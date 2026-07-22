import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Create a certificate order directly in the DB (visible to admin immediately). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      studentId?: string;
      courseId?: string;
      courseTitle?: string;
    };

    const studentId = body.studentId?.trim();
    const courseId = body.courseId?.trim();
    const courseTitle = body.courseTitle?.trim();

    if (!studentId || !courseId || !courseTitle) {
      return NextResponse.json(
        { error: "بيانات غير مكتملة" },
        { status: 400 }
      );
    }

    const [user, course, enrollment] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true, status: true },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true },
      }),
      prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: studentId, courseId },
        },
        select: { id: true },
      }),
    ]);

    if (!user || user.role !== "STUDENT" || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "طالبة غير صالحة" }, { status: 403 });
    }
    if (!course) {
      return NextResponse.json({ error: "البرنامج غير موجود" }, { status: 404 });
    }
    if (!enrollment) {
      return NextResponse.json(
        { error: "لا يوجد تسجيل في هذا البرنامج" },
        { status: 403 }
      );
    }

    const existing = await prisma.certificateOrder.findFirst({
      where: {
        userId: studentId,
        courseId,
        status: { in: ["pending", "done"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        order: {
          id: existing.id,
          studentId: existing.userId,
          courseId: existing.courseId,
          courseTitle: existing.courseTitle,
          status: existing.status,
          createdAt: existing.createdAt.toISOString(),
          completedAt: existing.completedAt?.toISOString(),
        },
        existing: true,
      });
    }

    const created = await prisma.certificateOrder.create({
      data: {
        userId: studentId,
        courseId,
        courseTitle: courseTitle || course.title,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        order: {
          id: created.id,
          studentId: created.userId,
          courseId: created.courseId,
          courseTitle: created.courseTitle,
          status: created.status,
          createdAt: created.createdAt.toISOString(),
          completedAt: created.completedAt?.toISOString(),
        },
        existing: false,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/lms/certificates]", e);
    return NextResponse.json(
      { error: "تعذّر إنشاء طلب الشهادة" },
      { status: 500 }
    );
  }
}
