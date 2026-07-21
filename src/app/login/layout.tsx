import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description:
    "دخولي إلى حسابك في أكاديمية كوكي بيوتي لمتابعة الدورات أو الإدارة.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/login" },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
