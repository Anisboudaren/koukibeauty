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
  const [users, courseOrders, certificateOrders, progressRows, moduleLessonCounts] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: "STUDENT" },
        include: { enrollments: { select: { courseId: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.courseOrder.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.certificateOrder.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.lessonProgress.findMany({
        select: { userId: true, courseId: true, lessonId: true },
      }),
      prisma.module.findMany({
        select: {
          courseId: true,
          _count: { select: { lessons: true } },
        },
      }),
    ]);

  const lessonCountByCourse = new Map<string, number>();
  for (const m of moduleLessonCounts) {
    lessonCountByCourse.set(
      m.courseId,
      (lessonCountByCourse.get(m.courseId) ?? 0) + m._count.lessons
    );
  }

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
  state: Omit<LmsState, "session">,
  passwords: Record<string, string> = {}
): Promise<void> {
  const { hashPassword } = await import("@/lib/auth/password");

  await prisma.$transaction(async (tx) => {
    // Students (users with STUDENT role)
    const existingStudents = await tx.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, passwordHash: true },
    });
    const existingById = new Map(
      existingStudents.map((s) => [s.id, s.passwordHash])
    );
    const incomingIds = new Set(state.students.map((s) => s.id));
    const toDelete = existingStudents
      .map((s) => s.id)
      .filter((id) => !incomingIds.has(id));

    if (toDelete.length) {
      await tx.user.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const s of state.students) {
      const plain = passwords[s.id];
      const hashed = plain ? hashPassword(plain) : undefined;
      const previousHash = existingById.get(s.id);

      await tx.user.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          fullName: s.fullName,
          phone: s.phone,
          email: s.email || null,
          whatsapp: s.whatsapp,
          wilaya: s.wilaya,
          passwordHash: hashed || previousHash || hashPassword("changeme"),
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
          ...(hashed ? { passwordHash: hashed } : {}),
        },
      });

      const wanted = [...new Set(s.enrolledCourseIds)];
      const existingEnrollments = await tx.enrollment.findMany({
        where: { userId: s.id },
        select: { courseId: true },
      });
      const existingIds = new Set(existingEnrollments.map((e) => e.courseId));
      const wantedSet = new Set(wanted);
      const toRemove = [...existingIds].filter((c) => !wantedSet.has(c));
      if (toRemove.length) {
        await tx.enrollment.deleteMany({
          where: { userId: s.id, courseId: { in: toRemove } },
        });
      }
      for (const courseId of wanted) {
        if (existingIds.has(courseId)) continue;
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

    // Course orders — upsert only (never wipe student/admin orders from a stale snapshot)
    for (const o of state.courseOrders) {
      const exists = await tx.course.findUnique({
        where: { id: o.courseId },
        select: { id: true },
      });
      if (!exists) continue;
      await tx.courseOrder.upsert({
        where: { id: o.id },
        create: {
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
        update: {
          courseTitle: o.courseTitle,
          amount: o.amount,
          status: o.status,
          note: o.note ?? null,
          completedAt: o.completedAt ? new Date(o.completedAt) : null,
        },
      });
    }

    // Certificate orders — upsert only
    for (const o of state.certificateOrders) {
      const exists = await tx.course.findUnique({
        where: { id: o.courseId },
        select: { id: true },
      });
      if (!exists) continue;
      await tx.certificateOrder.upsert({
        where: { id: o.id },
        create: {
          id: o.id,
          userId: o.studentId,
          courseId: o.courseId,
          courseTitle: o.courseTitle,
          status: o.status,
          createdAt: new Date(o.createdAt),
          completedAt: o.completedAt ? new Date(o.completedAt) : null,
        },
        update: {
          courseTitle: o.courseTitle,
          status: o.status,
          completedAt: o.completedAt ? new Date(o.completedAt) : null,
        },
      });
    }

    // Sync progress per (student, course) — never wipe unrelated progress rows
    for (const p of state.progress) {
      await tx.lessonProgress.deleteMany({
        where: { userId: p.studentId, courseId: p.courseId },
      });
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
