"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "./motion";

function Star({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 1.5l1.6 6.4L20 9.5l-6.4 1.6L12 17.5l-1.6-6.4L4 9.5l6.4-1.6L12 1.5z" />
    </svg>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 48"
      fill="currentColor"
      className={className}
      aria-hidden
    >
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

function Decorations() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute start-1/2 top-1/2 h-[min(70vw,420px)] w-[min(70vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blush/15 blur-3xl lg:start-[28%] lg:translate-x-0" />

      <Star className="absolute start-[8%] top-[18%] h-3 w-3 text-blush/35 sm:h-3.5 sm:w-3.5" />
      <Star className="absolute end-[12%] top-[22%] h-2 w-2 text-white/25 sm:end-[18%]" />
      <Star className="absolute start-[18%] bottom-[28%] h-2.5 w-2.5 text-blush/28" />
      <Star className="absolute end-[8%] bottom-[36%] h-3 w-3 text-white/20 lg:end-[42%]" />
      <Star className="absolute start-[42%] top-[12%] h-2 w-2 text-blush/40 lg:start-[22%]" />
      <Star className="absolute end-[28%] top-[48%] h-1.5 w-1.5 text-white/30" />

      <Leaf className="absolute -start-2 top-[30%] h-16 w-10 rotate-[-25deg] text-blush/18 sm:h-20 sm:w-12" />
      <Leaf className="absolute end-[-6px] top-[58%] h-14 w-9 rotate-[140deg] text-blush-deep/16 sm:end-[4%] lg:end-[40%]" />
      <Leaf className="absolute start-[55%] bottom-[8%] h-12 w-8 rotate-[40deg] text-blush/14 lg:start-[30%]" />
      <Leaf className="absolute end-[20%] top-[14%] h-10 w-7 -rotate-12 text-white/10" />
    </div>
  );
}

export function FounderSection() {
  return (
    <section className="relative overflow-hidden bg-foreground py-20 text-white sm:py-28">
      <Decorations />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8">
        <FadeIn className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[5/4] w-full">
            <Image
              src="/owner-photos/kouki-herself.png"
              alt="كوكي — مؤسِّسة الأكاديمية"
              fill
              className="object-contain object-center drop-shadow-[0_20px_50px_rgba(246,198,206,0.12)]"
              sizes="(max-width: 1024px) 90vw, 45vw"
              priority
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.12} className="lg:ps-4">
          <p className="mb-3 text-sm font-medium tracking-wide text-blush">
            تعرّفي على كوكي
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            شغف بالجمال…
            <br />
            وخبرة من قلب الصالون
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
            كوكي هي الوجه خلف koukibeauty academy — خبيرة تجميل تعلّمك أسرار المهنة
            بوضوح وبساطة، من أول درس حتى تتمكّني من الإبداع بثقة من منزلك.
          </p>
          <Link
            href="/courses"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-8 text-sm font-medium text-white transition duration-300 hover:bg-accent-dark"
          >
            ابدئي رحلتك معها
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
