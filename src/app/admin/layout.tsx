import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminGuard } from "@/components/admin/admin-guard";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
