"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/lms/store";

const links = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, short: "عامة" },
  { href: "/admin/students", label: "الطالبات", icon: Users, short: "طالبات" },
  { href: "/admin/courses", label: "البرامج", icon: BookOpen, short: "برامج" },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag, short: "طلبات" },
  { href: "/admin/stats", label: "الإحصائيات", icon: BarChart3, short: "إحصاء" },
  {
    href: "/admin/certificates",
    label: "الشهادات",
    icon: Award,
    short: "شهادات",
  },
] as const;

/** Primary items on the mobile bottom bar */
const mobilePrimary = [
  links[0],
  links[1],
  links[2],
  links[3],
] as const;

const mobileMore = [links[4], links[5]] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  function logout() {
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      clearSession();
      window.location.href = "/login";
    });
  }

  const moreActive = mobileMore.some((l) => isActive(pathname, l.href));

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Desktop sidebar — shadcn-style */}
      <aside className="sticky top-0 z-40 hidden h-[100dvh] w-[16.5rem] shrink-0 flex-col border-e border-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
            <BrandLogo size="sm" />
          </Link>
        </div>

        <div className="px-3 py-3">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            القائمة
          </p>
          <nav className="flex flex-col gap-0.5">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-white shadow-sm"
                      : "text-foreground/80 hover:bg-blush-soft hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center rounded-lg px-2.5 py-2 text-sm text-ink-muted transition hover:bg-blush-soft hover:text-foreground"
          >
            العودة للموقع
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition hover:bg-blush-soft hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar — compact */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-md md:hidden">
          <Link href="/admin">
            <BrandLogo size="sm" />
          </Link>
          <span className="text-xs font-medium text-ink-muted">الإدارة</span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-8 md:pb-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-xl md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto flex h-[3.75rem] max-w-lg items-stretch justify-around px-1">
            {mobilePrimary.map(({ href, short, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition",
                    active ? "text-accent" : "text-ink-muted"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition",
                      active && "bg-accent-subtle"
                    )}
                  >
                    <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={active ? 2.25 : 1.75} />
                  </span>
                  <span className="truncate px-0.5">{short}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition",
                moreActive || moreOpen ? "text-accent" : "text-ink-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition",
                  (moreActive || moreOpen) && "bg-accent-subtle"
                )}
              >
                <MoreHorizontal className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
              </span>
              <span>المزيد</span>
            </button>
          </div>
        </nav>

        {/* More sheet */}
        <div
          className={cn(
            "fixed inset-0 z-50 md:hidden",
            moreOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-hidden={!moreOpen}
        >
          <button
            type="button"
            tabIndex={moreOpen ? 0 : -1}
            aria-label="إغلاق"
            className={cn(
              "absolute inset-0 bg-black/45 transition-opacity duration-300",
              moreOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 rounded-t-2xl border border-border bg-surface shadow-2xl transition-transform duration-300 ease-[var(--ease-out-expo)]",
              moreOpen ? "translate-y-0" : "translate-y-full"
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
            <div className="space-y-1 p-4 pb-5">
              <p className="mb-2 px-1 text-xs font-medium text-ink-subtle">
                المزيد
              </p>
              {mobileMore.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                      active
                        ? "bg-accent text-white"
                        : "text-foreground hover:bg-blush-soft"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
              <div className="my-2 border-t border-border" />
              <Link
                href="/"
                onClick={() => setMoreOpen(false)}
                className="flex items-center rounded-xl px-3 py-3 text-sm text-ink-muted hover:bg-blush-soft"
              >
                العودة للموقع
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink-muted hover:bg-blush-soft"
              >
                <LogOut className="h-5 w-5" />
                خروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
