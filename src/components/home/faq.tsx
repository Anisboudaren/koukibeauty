"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "./motion";

const faqs = [
  {
    q: "ما هي طرق الدفع المقبولة؟",
    a: "نقبل الدفع عبر CCP (الحساب البريدي الجاري) أو تطبيق BaridiMob للدفع السريع والآمن.",
  },
  {
    q: "هل يمكنني استرداد الأموال؟",
    a: "نعم، نقدم ضمان استرداد الأموال خلال 7 أيام من التسجيل إذا لم تكن راضياً عن الدورة.",
  },
  {
    q: "هل سأحصل على شهادة بعد إكمال الدورة؟",
    a: "بالتأكيد! ستحصل على شهادة معترف بها لإبراز مهاراتك بعد انتهاء الدورة.",
  },
  {
    q: "هل الدورات مسجلة أم مباشرة؟",
    a: "نوفر جلسات مسجلة للتعلم الذاتي وجلسات مباشرة للتطبيق العملي.",
  },
  {
    q: "هل أحتاج إلى خبرة مسبقة؟",
    a: "لا، دوراتنا مصممة للمبتدئين، مع وجود وحدات متقدمة للمحترفين.",
  },
  {
    q: "كيف يمكنني التسجيل؟",
    a: "اختر الدورة المطلوبة، قم بالدفع عبر CCP أو BaridiMob، وأرسل إثبات الدفع للحصول على الوصول.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <FadeIn className="mb-10 text-center sm:mb-12">
          <p className="mb-3 text-sm font-medium tracking-wide text-accent">
            المساعدة
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            الأسئلة الشائعة
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="divide-y divide-border/80 overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-surface">
            {faqs.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition hover:bg-blush-soft/40 sm:px-6 sm:py-5"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold sm:text-base">
                      {item.q}
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                        isOpen
                          ? "bg-accent text-white"
                          : "bg-blush-soft text-accent"
                      )}
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-400 ease-[var(--ease-out-soft)]",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-ink-muted sm:px-6">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
