"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FadeIn } from "./motion";

function IconExperts({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      {/* Stylist silhouette + scissors */}
      <circle cx="18" cy="14" r="6" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 36c1.5-7 5.5-11 10-11s8.5 4 10 11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M30 14l10 14M40 14L30 28"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="30" cy="12.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="12.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M35 18.5v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPractice({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      {/* Makeup brush + palette swirl */}
      <path
        d="M14 40c6-2 10-8 12-14l8-16 4 2-8 16c-2 6-8 10-14 12-1.5.5-3-.5-2-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M32 12l4 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10 18c4-6 12-8 18-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="14" cy="14" r="2" fill="currentColor" opacity="0.35" />
      <circle cx="20" cy="10" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function IconCertificate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      {/* Wax seal diploma */}
      <rect
        x="8"
        y="10"
        width="32"
        height="22"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M14 18h20M14 24h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="30" cy="34" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M30 29.5l1.2 2.5 2.7.3-2 2.1.6 2.7L30 35.5l-2.5 1.4.6-2.7-2-2.1 2.7-.3L30 29.5z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M25 39.5l-2 5 7-2.5 7 2.5-2-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const features: {
  icon: (p: { className?: string }) => ReactNode;
  title: string;
  desc: string;
}[] = [
  {
    icon: IconExperts,
    title: "مدربون خبراء",
    desc: "نخبة من الخبراء في مجال التجميل",
  },
  {
    icon: IconPractice,
    title: "تطبيق عملي متقدم",
    desc: "تدريب مباشر مع نماذج واقعية",
  },
  {
    icon: IconCertificate,
    title: "شهادات معتمدة",
    desc: "تؤهلك للعمل محلياً ودولياً",
  },
];

export function WelcomeSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blush-soft/80 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-accent">
            مرحباً بكِ
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
            مرحبًا بكم في أكاديمية kouki beauty
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
            رحلتك نحو التميز في تصفيف الشعر والجمال تبدأ هنا! نمكّن الطموحين من
            التألق في مجال تصفيف الشعر والجمال. مع التزامنا بالتميز، نقدم دورات
            شاملة مصممة لإطلاق إبداعك وصقل مهاراتك.
          </p>
          <Link
            href="/courses"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-9 text-sm font-medium text-white transition duration-300 hover:bg-accent-dark"
          >
            سجل الآن
          </Link>
        </FadeIn>

        <div className="mt-14 grid gap-5 sm:grid-cols-3 sm:gap-6">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={0.08 * i} y={20}>
              <div className="flex h-full flex-col items-center rounded-[var(--radius-lg)] border border-border/70 bg-surface/80 px-6 py-8 text-center shadow-[0_12px_40px_-28px_rgba(232,160,171,0.55)] backdrop-blur-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blush-soft text-accent">
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
