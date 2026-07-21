"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import type { CourseSummary } from "@/lib/types";
import { FadeIn } from "./motion";

interface FeaturedCoursesProps {
  courses: CourseSummary[];
  totalCount: number;
}

export function FeaturedCourses({ courses, totalCount }: FeaturedCoursesProps) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blush-soft/50 via-transparent to-blush-soft/30" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn className="mb-10 flex items-end justify-between sm:mb-14">
          <div>
            <p className="mb-3 text-sm font-medium tracking-wide text-accent">
              الدورات
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              الدورات المميزة
            </h2>
            <p className="mt-2 text-sm text-ink-muted sm:text-base">
              {totalCount} دورة متاحة الآن
            </p>
          </div>
          <Link
            href="/courses"
            className="hidden items-center gap-1.5 text-sm font-medium text-accent transition hover:text-accent-dark sm:flex"
          >
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {courses.map((course, i) => (
            <FadeIn key={course.id} delay={i * 0.08} y={20}>
              <CourseCard course={course} />
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-10 flex justify-center sm:hidden">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent"
          >
            عرض جميع الدورات
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
