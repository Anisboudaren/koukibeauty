import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description:
    "سجّلي في أكاديمية كوكي بيوتي وابدئي رحلتك في دورات الجمال والعناية.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/signup" },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
