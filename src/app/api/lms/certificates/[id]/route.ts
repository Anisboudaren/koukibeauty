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

    const order = await prisma.certificateOrder.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    await prisma.certificateOrder.update({
      where: { id },
      data: {
        status: body.status,
        completedAt: body.status === "done" ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/lms/certificates/:id]", e);
    return NextResponse.json({ error: "تعذّر تحديث الطلب" }, { status: 500 });
  }
}
