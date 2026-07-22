import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Upsert a single completed lesson — does not wipe other progress. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      studentId?: string;
      courseId?: string;
      lessonId?: string;
    };

    const studentId = body.studentId?.trim();
    const courseId = body.courseId?.trim();
    const lessonId = body.lessonId?.trim();

    if (!studentId || !courseId || !lessonId) {
      return NextResponse.json(
        { error: "بيانات غير مكتملة" },
        { status: 400 }
      );
    }

    const [user, course, lesson] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true, status: true },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true },
      }),
      prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, module: { select: { courseId: true } } },
      }),
    ]);

    if (!user || user.role !== "STUDENT" || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "طالبة غير صالحة" }, { status: 403 });
    }
    if (!course) {
      return NextResponse.json({ error: "البرنامج غير موجود" }, { status: 404 });
    }
    if (!lesson || lesson.module.courseId !== courseId) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: studentId, courseId },
      },
      select: { id: true },
    });
    if (!enrollment) {
      return NextResponse.json(
        { error: "لا يوجد تسجيل في هذا البرنامج" },
        { status: 403 }
      );
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: studentId, lessonId },
      },
      create: {
        userId: studentId,
        courseId,
        lessonId,
      },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/lms/progress]", e);
    return NextResponse.json(
      { error: "تعذّر حفظ التقدّم" },
      { status: 500 }
    );
  }
}
