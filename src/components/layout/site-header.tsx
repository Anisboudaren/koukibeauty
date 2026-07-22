"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { CourseSearch } from "@/components/courses/course-search";
import { cn } from "@/lib/utils";
import { useLms } from "@/lib/lms/use-lms";
import { clearSession } from "@/lib/lms/store";

interface SiteHeaderProps {
  inverted?: boolean;
  className?: string;
  overHero?: boolean;
}

export function SiteHeader({
  inverted = false,
  className,
  overHero = false,
}: SiteHeaderProps) {
  const { state } = useLms();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const role = state?.session?.role;

  const links = useMemo(() => {
    if (role === "admin") {
      return [
        { href: "/courses", label: "الدورات" },
        { href: "/admin", label: "الإدارة" },
      ];
    }
    if (role === "student") {
      return [
        { href: "/courses", label: "الدورات" },
        { href: "/dashboard", label: "لوحتي" },
      ];
    }
    return [
      { href: "/courses", label: "الدورات" },
      { href: "/dashboard", label: "لوحتي" },
      { href: "/login", label: "دخول" },
    ];
  }, [role]);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  useEffect(() => {
    if (!menuOpen && !mobileSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, mobileSearchOpen]);

  const useInverted = overHero ? !scrolled : inverted;
  const solid = overHero ? scrolled : !inverted;

  function logout() {
    clearSession();
    setMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <>
      <header
        className={cn(
          "z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-400",
          overHero ? "fixed inset-x-0 top-0" : "sticky top-0",
          solid
            ? "bg-background/95 text-foreground shadow-[0_8px_30px_-18px_rgba(26,18,20,0.25)] backdrop-blur-xl"
            : "bg-gradient-to-b from-black/45 to-transparent text-white",
          className
        )}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="relative z-10 shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <BrandLogo inverted={useInverted} size="sm" />
          </Link>

          <nav className="absolute inset-x-0 hidden items-center justify-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors duration-300 hover:text-accent",
                  useInverted ? "text-white/90" : "text-foreground/70"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <CourseSearch
              className="hidden w-[220px] lg:block xl:w-[280px]"
              size="sm"
              placeholder="ابحثي…"
            />

            {role ? (
              <button
                type="button"
                onClick={logout}
                className={cn(
                  "hidden h-9 items-center rounded-full px-5 text-sm font-medium transition duration-300 md:inline-flex",
                  useInverted
                    ? "bg-white/15 text-white backdrop-blur-sm"
                    : "border border-border text-foreground hover:bg-blush-soft"
                )}
              >
                خروج
              </button>
            ) : (
              <Link
                href="/courses"
                className={cn(
                  "hidden h-9 items-center rounded-full px-5 text-sm font-medium transition duration-300 md:inline-flex",
                  useInverted
                    ? "bg-white text-foreground hover:bg-white/90"
                    : "bg-accent text-white hover:bg-accent-dark"
                )}
              >
                ابدأ التعلم
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(true);
                setMenuOpen(false);
              }}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition lg:hidden",
                useInverted
                  ? "bg-white/15 text-white backdrop-blur-sm"
                  : "bg-blush-soft text-foreground"
              )}
              aria-label="بحث"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition md:hidden",
                useInverted
                  ? "bg-white/15 text-white backdrop-blur-sm"
                  : "bg-blush-soft text-foreground"
              )}
              aria-label={menuOpen ? "إغلاق القائمة" : "القائمة"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile search sheet */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="إغلاق"
            onClick={() => setMobileSearchOpen(false)}
          />
          <div
            className="absolute inset-x-3 rounded-2xl border border-border bg-background p-3 shadow-2xl"
            style={{
              top: "calc(3.5rem + env(safe-area-inset-top, 0px) + 0.5rem)",
            }}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-medium">بحث في الدورات</p>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="rounded-full p-1.5 hover:bg-blush-soft"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CourseSearch
              size="md"
              placeholder="ابحثي عن دورة…"
              onNavigate={() => setMobileSearchOpen(false)}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          className={cn(
            "absolute inset-0 bg-black/55 transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0"
          )}
          aria-label="إغلاق"
          onClick={() => setMenuOpen(false)}
        />

        <nav
          className={cn(
            "absolute inset-x-3 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl transition-all duration-400 ease-[var(--ease-out-expo)]",
            menuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          )}
          style={{
            top: "calc(3.5rem + env(safe-area-inset-top, 0px) + 0.5rem)",
          }}
        >
          <div className="space-y-1 p-3">
            <CourseSearch
              size="md"
              className="mb-2"
              placeholder="ابحثي عن دورة…"
              onNavigate={() => setMenuOpen(false)}
            />

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-xl px-4 text-base font-medium text-foreground transition hover:bg-blush-soft"
              >
                {link.label}
              </Link>
            ))}

            {!role && (
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-white transition hover:bg-accent-dark"
              >
                إنشاء حساب
              </Link>
            )}

            {role && (
              <button
                type="button"
                onClick={logout}
                className="mt-2 flex min-h-12 w-full items-center justify-center rounded-full border border-border px-6 text-sm font-medium"
              >
                خروج
              </button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
