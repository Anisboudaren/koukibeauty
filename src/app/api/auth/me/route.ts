import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth/admin";

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
    },
  });
}
