import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      status?: "active" | "suspended";
      fullName?: string;
      phone?: string;
      email?: string | null;
      whatsapp?: string;
      wilaya?: string;
      password?: string;
      enrolledCourseIds?: string[];
    };

    const existing = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      select: { id: true, phone: true, email: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "الطالبة غير موجودة" }, { status: 404 });
    }

    const data: {
      status?: "ACTIVE" | "SUSPENDED";
      fullName?: string;
      phone?: string;
      email?: string | null;
      whatsapp?: string;
      wilaya?: string;
      passwordHash?: string;
    } = {};

    if (body.status === "active" || body.status === "suspended") {
      data.status = body.status === "suspended" ? "SUSPENDED" : "ACTIVE";
    }
    if (typeof body.fullName === "string" && body.fullName.trim()) {
      data.fullName = body.fullName.trim();
    }
    if (typeof body.phone === "string" && body.phone.trim()) {
      const phone = body.phone.trim();
      if (phone !== existing.phone) {
        const taken = await prisma.user.findUnique({
          where: { phone },
          select: { id: true },
        });
        if (taken) {
          return NextResponse.json(
            { error: "رقم الهاتف مستخدم لطالبة أخرى" },
            { status: 409 }
          );
        }
      }
      data.phone = phone;
    }
    if (body.email !== undefined) {
      const emailRaw = (body.email || "").trim();
      const email = emailRaw ? emailRaw.toLowerCase() : null;
      if (email && email !== (existing.email || "").toLowerCase()) {
        const taken = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true },
        });
        if (taken) {
          return NextResponse.json(
            { error: "البريد الإلكتروني مستخدم لطالبة أخرى" },
            { status: 409 }
          );
        }
      }
      data.email = email;
    }
    if (typeof body.whatsapp === "string" && body.whatsapp.trim()) {
      data.whatsapp = body.whatsapp.trim();
    }
    if (typeof body.wilaya === "string" && body.wilaya.trim()) {
      data.wilaya = body.wilaya.trim();
    }
    if (typeof body.password === "string" && body.password.trim().length >= 6) {
      data.passwordHash = hashPassword(body.password.trim());
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) {
        await tx.user.update({ where: { id }, data });
      }

      if (Array.isArray(body.enrolledCourseIds)) {
        const wanted = [...new Set(body.enrolledCourseIds.filter(Boolean))];
        const existingEnrollments = await tx.enrollment.findMany({
          where: { userId: id },
          select: { courseId: true },
        });
        const existingIds = new Set(existingEnrollments.map((e) => e.courseId));
        const wantedSet = new Set(wanted);

        const toRemove = [...existingIds].filter((c) => !wantedSet.has(c));
        if (toRemove.length) {
          await tx.enrollment.deleteMany({
            where: { userId: id, courseId: { in: toRemove } },
          });
        }

        for (const courseId of wanted) {
          if (existingIds.has(courseId)) continue;
          const course = await tx.course.findUnique({
            where: { id: courseId },
            select: { id: true },
          });
          if (!course) continue;
          await tx.enrollment.create({ data: { userId: id, courseId } });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/lms/students/:id]", e);
    return NextResponse.json({ error: "تعذّر حفظ التعديلات" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const existing = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "الطالبة غير موجودة" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/lms/students/:id]", e);
    return NextResponse.json({ error: "تعذّر الحذف" }, { status: 500 });
  }
}
