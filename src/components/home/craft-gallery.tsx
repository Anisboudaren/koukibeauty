"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FadeIn } from "./motion";

const shots = [
  { src: "/models-shoots/model-01.jpeg", alt: "مكياج احترافي" },
  { src: "/models-shoots/model-02.jpeg", alt: "إطلالة جمال" },
  { src: "/models-shoots/model-03.jpeg", alt: "فن المكياج" },
  { src: "/models-shoots/model-04.jpeg", alt: "تفاصيل الجمال" },
  { src: "/models-shoots/model-05.jpeg", alt: "لمسة احترافية" },
  { src: "/models-shoots/model-06.jpeg", alt: "إبداع المكياج" },
];

export function CraftGallery() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + shots.length) % shots.length);
    },
    []
  );

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => go(1), 4500);
    return () => window.clearInterval(id);
  }, [go, reduce]);

  const current = shots[index];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 pink-texture" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn className="mb-10 max-w-xl sm:mb-12">
          <p className="mb-3 text-sm font-medium tracking-wide text-accent">
            الحرفة
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            جمال يُصنع بدقّة
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
            من أول ضربة فرشاة إلى آخر لمسة — نتعلّم التفاصيل التي تصنع الفرق.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-blush/30 shadow-[0_24px_60px_-30px_rgba(232,160,171,0.65)] sm:aspect-[16/10] md:rounded-[2rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.src}
                  className="absolute inset-0"
                  initial={reduce ? false : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image
                    src={current.src}
                    alt={current.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 1100px"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
                <p className="text-sm font-medium text-white/90 drop-shadow">
                  {current.alt}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
                    aria-label="السابق"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
                    aria-label="التالي"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-center gap-2">
              {shots.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`عرض ${s.alt}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-400",
                    i === index
                      ? "w-7 bg-accent"
                      : "w-2 bg-blush-deep/40 hover:bg-blush-deep/70"
                  )}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
