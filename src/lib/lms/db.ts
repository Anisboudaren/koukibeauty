import { prisma } from "@/lib/prisma";
import type {
  CertificateOrder,
  CourseOrder,
  CourseProgress,
  LmsState,
  Student,
} from "@/lib/lms/types";

function mapStudent(
  u: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    whatsapp: string;
    wilaya: string;
    status: "ACTIVE" | "SUSPENDED";
    createdAt: Date;
    enrollments: { courseId: string }[];
  }
): Student {
  return {
    id: u.id,
    fullName: u.fullName,
    phone: u.phone,
    email: u.email ?? undefined,
    whatsapp: u.whatsapp,
    wilaya: u.wilaya,
    status: u.status === "SUSPENDED" ? "suspended" : "active",
    enrolledCourseIds: u.enrollments.map((e) => e.courseId),
    createdAt: u.createdAt.toISOString(),
  };
}

export async function loadLmsStateFromDb(): Promise<Omit<LmsState, "session">> {
  const [users, courseOrders, certificateOrders, progressRows, lessonCounts] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: "STUDENT" },
        include: { enrollments: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.courseOrder.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.certificateOrder.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.lessonProgress.findMany(),
      prisma.course.findMany({
        select: {
          id: true,
          modules: { select: { lessons: { select: { id: true } } } },
        },
      }),
    ]);

  const lessonCountByCourse = new Map(
    lessonCounts.map((c) => [
      c.id,
      c.modules.reduce((n, m) => n + m.lessons.length, 0),
    ])
  );

  const progressMap = new Map<string, CourseProgress>();
  for (const row of progressRows) {
    const key = `${row.userId}:${row.courseId}`;
    const existing = progressMap.get(key);
    if (existing) {
      existing.completedLessonIds.push(row.lessonId);
    } else {
      progressMap.set(key, {
        studentId: row.userId,
        courseId: row.courseId,
        completedLessonIds: [row.lessonId],
        lessonCount: lessonCountByCourse.get(row.courseId) ?? 1,
      });
    }
  }

  const mappedOrders: CourseOrder[] = courseOrders.map((o) => ({
    id: o.id,
    studentId: o.userId,
    courseId: o.courseId,
    courseTitle: o.courseTitle,
    amount: o.amount,
    status: o.status,
    note: o.note ?? undefined,
    createdAt: o.createdAt.toISOString(),
    completedAt: o.completedAt?.toISOString(),
  }));

  const mappedCerts: CertificateOrder[] = certificateOrders.map((o) => ({
    id: o.id,
    studentId: o.userId,
    courseId: o.courseId,
    courseTitle: o.courseTitle,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    completedAt: o.completedAt?.toISOString(),
  }));

  return {
    students: users.map(mapStudent),
    courseOrders: mappedOrders,
    certificateOrders: mappedCerts,
    progress: [...progressMap.values()],
  };
}

/** Persist LMS snapshot (students / orders / progress). Session stays client-side. */
export async function saveLmsStateToDb(
  state: Omit<LmsState, "session">
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Students (users with STUDENT role)
    const existingStudents = await tx.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    });
    const incomingIds = new Set(state.students.map((s) => s.id));
    const toDelete = existingStudents
      .map((s) => s.id)
      .filter((id) => !incomingIds.has(id));

    if (toDelete.length) {
      await tx.user.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const s of state.students) {
      await tx.user.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          fullName: s.fullName,
          phone: s.phone,
          email: s.email || null,
          whatsapp: s.whatsapp,
          wilaya: s.wilaya,
          passwordHash: "pending",
          role: "STUDENT",
          status: s.status === "suspended" ? "SUSPENDED" : "ACTIVE",
          createdAt: new Date(s.createdAt),
        },
        update: {
          fullName: s.fullName,
          phone: s.phone,
          email: s.email || null,
          whatsapp: s.whatsapp,
          wilaya: s.wilaya,
          status: s.status === "suspended" ? "SUSPENDED" : "ACTIVE",
        },
      });

      await tx.enrollment.deleteMany({ where: { userId: s.id } });
      for (const courseId of s.enrolledCourseIds) {
        const exists = await tx.course.findUnique({
          where: { id: courseId },
          select: { id: true },
        });
        if (!exists) continue;
        await tx.enrollment.create({
          data: { userId: s.id, courseId },
        });
      }
    }

    // Course orders — replace all
    await tx.courseOrder.deleteMany();
    for (const o of state.courseOrders) {
      const exists = await tx.course.findUnique({
        where: { id: o.courseId },
        select: { id: true },
      });
      if (!exists) continue;
      await tx.courseOrder.create({
        data: {
          id: o.id,
          userId: o.studentId,
          courseId: o.courseId,
          courseTitle: o.courseTitle,
          amount: o.amount,
          status: o.status,
          note: o.note,
          createdAt: new Date(o.createdAt),
          completedAt: o.completedAt ? new Date(o.completedAt) : null,
        },
      });
    }

    await tx.certificateOrder.deleteMany();
    for (const o of state.certificateOrders) {
      const exists = await tx.course.findUnique({
        where: { id: o.courseId },
        select: { id: true },
      });
      if (!exists) continue;
      await tx.certificateOrder.create({
        data: {
          id: o.id,
          userId: o.studentId,
          courseId: o.courseId,
          courseTitle: o.courseTitle,
          status: o.status,
          createdAt: new Date(o.createdAt),
          completedAt: o.completedAt ? new Date(o.completedAt) : null,
        },
      });
    }

    await tx.lessonProgress.deleteMany();
    for (const p of state.progress) {
      for (const lessonId of p.completedLessonIds) {
        const lesson = await tx.lesson.findUnique({
          where: { id: lessonId },
          select: { id: true },
        });
        if (!lesson) continue;
        await tx.lessonProgress.create({
          data: {
            userId: p.studentId,
            courseId: p.courseId,
            lessonId,
          },
        });
      }
    }
  });
}
