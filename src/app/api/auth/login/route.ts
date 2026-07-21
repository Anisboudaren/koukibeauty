import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { ADMIN_COOKIE, signAdminSession } from "@/lib/auth/admin-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
    };
    const identifier = (body.identifier || "").trim();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "أدخلي اسم المستخدم وكلمة المرور" },
        { status: 400 }
      );
    }

    const lower = identifier.toLowerCase();
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        OR: [
          { email: { equals: lower, mode: "insensitive" } },
          { phone: identifier },
          { fullName: { equals: identifier, mode: "insensitive" } },
          { email: { startsWith: `${lower}@`, mode: "insensitive" } },
        ],
      },
    });

    if (!admin || admin.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      role: "admin",
      user: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
      },
    });

    res.cookies.set(ADMIN_COOKIE, await signAdminSession(admin.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذّر الدخول" }, { status: 500 });
  }
}
