"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tabs = [
  { href: "/dashboard", label: "الرئيسية" },
  { href: "/dashboard/courses", label: "دوراتي" },
  { href: "/dashboard/requests", label: "طلباتي" },
  { href: "/dashboard/certificates", label: "الشهادات" },
];

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col pb-8">
      <SiteHeader />
      <div className="border-b border-border/70 bg-surface/80">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {tabs.map((t) => {
            const active =
              t.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-accent text-white"
                    : "text-ink-muted hover:bg-blush-soft"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
