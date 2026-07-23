import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      status?: "pending" | "done" | "cancelled";
    };

    if (
      body.status !== "pending" &&
      body.status !== "done" &&
      body.status !== "cancelled"
    ) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }

    const order = await prisma.courseOrder.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.courseOrder.update({
        where: { id },
        data: {
          status: body.status,
          completedAt: body.status === "done" ? new Date() : null,
        },
      });

      if (body.status === "done") {
        const exists = await tx.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: order.userId,
              courseId: order.courseId,
            },
          },
        });
        if (!exists) {
          const course = await tx.course.findUnique({
            where: { id: order.courseId },
            select: { id: true },
          });
          if (course) {
            await tx.enrollment.create({
              data: { userId: order.userId, courseId: order.courseId },
            });
          }
        }
      }

      if (body.status === "cancelled" && order.status === "done") {
        await tx.enrollment.deleteMany({
          where: { userId: order.userId, courseId: order.courseId },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/lms/orders/:id]", e);
    return NextResponse.json({ error: "تعذّر تحديث الطلب" }, { status: 500 });
  }
}
