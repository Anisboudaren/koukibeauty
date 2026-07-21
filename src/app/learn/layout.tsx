import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التعلّم",
  robots: { index: false, follow: false },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
