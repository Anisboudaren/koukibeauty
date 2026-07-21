import { StudentShell } from "@/components/dashboard/student-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentShell>{children}</StudentShell>;
}
