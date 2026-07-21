import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth/admin-session";

export async function getAdminFromCookies() {
  const jar = await cookies();
  const userId = await verifyAdminSession(jar.get(ADMIN_COOKIE)?.value);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") return null;
  return user;
}

export async function requireAdminApi() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return { error: Response.json({ error: "غير مصرح" }, { status: 401 }) };
  }
  return { admin };
}
