"use client";

import { FadeIn } from "./motion";

const testimonials = [
  {
    quote:
      "البيئة داخل الأكاديمية محفزة جدًا، وقد حصلت على فرصة عمل مباشرة بعد إنهاء الدورة",
    name: "نور ع",
  },
  {
    quote:
      "الدورات مكثفة وغنية بالمعلومات، والمدربون دائمًا على استعداد للإجابة على أسئلتنا.",
    name: "ليندا خ",
  },
  {
    quote:
      "لقد كانت أكاديمية كوكي تجربة مميزة لي. تعلمت مهارات جديدة وافتتحت صالوني الخاص بعد التخرج.",
    name: "سارة م",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 pink-texture opacity-60" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-sm font-medium tracking-wide text-accent">
            آراء الطالبات
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ماذا يقول طلابنا؟
          </h2>
        </FadeIn>

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1} y={24}>
              <figure className="flex h-full flex-col rounded-[var(--radius-lg)] border border-white/70 bg-surface/90 p-6 shadow-[0_16px_40px_-28px_rgba(26,18,20,0.2)] sm:p-7">
                <blockquote className="flex-1 text-base leading-relaxed text-foreground/80">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border/70 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-sm font-bold text-accent-dark">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-ink-subtle">طالبة</p>
                  </div>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
