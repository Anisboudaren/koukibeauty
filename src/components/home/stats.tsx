"use client";

import { FadeIn } from "./motion";

const stats = [
  { value: "320", label: "عدد الطلاب الحاليين" },
  { value: "1500", label: "عدد الخريجين" },
  { value: "5", label: "عدد الدورات" },
];

export function StatsSection() {
  return (
    <section className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-4 rounded-[var(--radius-lg)] border border-border/60 bg-blush-soft/70 px-4 py-10 text-center sm:gap-8 sm:px-10 sm:py-12">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08} y={16}>
              <p className="text-3xl font-bold tracking-tight text-accent sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-xs leading-snug text-ink-muted sm:text-sm">
                {s.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
