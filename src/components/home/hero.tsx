"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroVideoBackground } from "@/components/video/video-player";
import { StaggerChildren, StaggerItem } from "./motion";

export function HomeHero() {
  return (
    <section
      className="relative flex min-h-[100dvh] flex-col bg-black text-white"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Extend media under the status bar so no light body stripe shows */}
      <div
        className="absolute inset-x-0 bottom-0 bg-black"
        style={{ top: "calc(-1 * env(safe-area-inset-top, 0px))" }}
      >
        <HeroVideoBackground />
      </div>

      <SiteHeader overHero />

      <div className="relative z-10 mx-auto flex flex-1 w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-20 sm:px-6 sm:pb-20 md:pb-24">
        <StaggerChildren
          className="mx-auto flex w-full max-w-2xl flex-col md:mx-0"
          delay={0.15}
          stagger={0.12}
        >
          <StaggerItem>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl md:text-6xl">
              تعلّمي فن الجمال من المنزل
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              دورات احترافية في التجميل، الشعر، والمكياج — مصممة للمبتدئات
              والمحترفات على حد سواء.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex min-h-12 items-center rounded-full bg-accent px-8 text-sm font-medium text-white transition duration-300 hover:bg-accent-dark"
              >
                استكشفي الدورات
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center rounded-full border border-white/35 px-8 text-sm font-medium text-white transition duration-300 hover:bg-white/10"
              >
                لوحة الطالبة
              </Link>
            </div>
          </StaggerItem>
        </StaggerChildren>
      </div>
    </section>
  );
}
