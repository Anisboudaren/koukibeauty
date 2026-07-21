"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 1.5l1.6 6.4L20 9.5l-6.4 1.6L12 17.5l-1.6-6.4L4 9.5l6.4-1.6L12 1.5z" />
    </svg>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 48" fill="currentColor" className={className} aria-hidden>
      <path d="M16 2C8 12 4 22 6 34c1.2 7 5.5 11 10 12 4.5-1 8.8-5 10-12 2-12-2-22-10-32z" />
      <path
        d="M16 10v30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.35"
      />
    </svg>
  );
}

function LightDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute start-1/2 top-1/3 h-[min(80vw,380px)] w-[min(80vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blush/40 blur-3xl" />
      <div className="absolute end-0 bottom-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <Star className="absolute start-[10%] top-[16%] h-3 w-3 text-blush-deep/40" />
      <Star className="absolute end-[14%] top-[22%] h-2 w-2 text-accent/25" />
      <Star className="absolute start-[22%] bottom-[24%] h-2.5 w-2.5 text-blush-deep/35" />
      <Star className="absolute end-[20%] bottom-[40%] h-3 w-3 text-blush/50" />

      <Leaf className="absolute -start-1 top-[28%] h-16 w-10 rotate-[-25deg] text-blush-deep/25" />
      <Leaf className="absolute end-[-4px] top-[55%] h-14 w-9 rotate-[140deg] text-blush/30" />
      <Leaf className="absolute start-[50%] bottom-[6%] h-12 w-8 rotate-[35deg] text-blush-deep/20" />
    </div>
  );
}

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function AuthShell({ children, eyebrow, title, subtitle }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-blush-soft/40">
      <LightDecorations />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/">
          <BrandLogo size="sm" />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-ink-muted transition hover:text-accent"
        >
          العودة للرئيسية
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 pb-12 pt-2 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pb-16">
        {/* Portrait panel — light Kouki moment */}
        <div className="relative mx-auto hidden w-full max-w-md lg:mx-0 lg:block lg:max-w-none">
          <div className="relative aspect-[5/4] w-full">
            <Image
              src="/owner-photos/kouki-herself.png"
              alt="كوكي — أكاديمية الجمال"
              fill
              className="object-contain object-center drop-shadow-[0_24px_50px_rgba(232,160,171,0.35)]"
              sizes="45vw"
              priority
            />
          </div>
          <div className="mt-2 max-w-sm ps-2">
            <p className="text-sm font-medium tracking-wide text-accent">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground xl:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted xl:text-base">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="mx-auto w-full max-w-md lg:ms-auto lg:me-0">
          <div className="mb-8 text-center lg:hidden">
            <p className="text-sm font-medium tracking-wide text-accent">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/80 bg-surface/90 p-6 shadow-[0_24px_60px_-28px_rgba(232,160,171,0.55)] backdrop-blur-sm sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
