import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      phone?: string;
      email?: string;
      whatsapp?: string;
      wilaya?: string;
      password?: string;
    };

    const fullName = (body.fullName || "").trim();
    const phone = (body.phone || "").trim();
    const whatsapp = (body.whatsapp || "").trim();
    const wilaya = (body.wilaya || "").trim();
    const emailRaw = (body.email || "").trim();
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    const password = body.password || "";

    if (!fullName) {
      return NextResponse.json(
        { error: "الاسم الكامل مطلوب", field: "fullName" },
        { status: 400 }
      );
    }
    if (!phone) {
      return NextResponse.json(
        { error: "رقم الهاتف مطلوب", field: "phone" },
        { status: 400 }
      );
    }
    if (!whatsapp) {
      return NextResponse.json(
        { error: "رقم واتساب مطلوب", field: "whatsapp" },
        { status: 400 }
      );
    }
    if (!wilaya) {
      return NextResponse.json(
        { error: "اختاري الولاية", field: "wilaya" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
          field: "password",
        },
        { status: 400 }
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صالح", field: "email" },
        { status: 400 }
      );
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "رقم الهاتف مسجّل مسبقاً. جرّبي تسجيل الدخول.", field: "phone" },
        { status: 409 }
      );
    }

    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (existingEmail) {
        return NextResponse.json(
          {
            error: "البريد الإلكتروني مسجّل مسبقاً. جرّبي تسجيل الدخول.",
            field: "email",
          },
          { status: 409 }
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email,
        whatsapp,
        wilaya,
        passwordHash: hashPassword(password),
        role: "STUDENT",
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    return NextResponse.json({
      ok: true,
      role: "student",
      user,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "تعذّر إنشاء الحساب. حاولي مرة أخرى." },
      { status: 500 }
    );
  }
}
