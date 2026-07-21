"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLms } from "@/lib/lms/use-lms";
import { getProgressPercent } from "@/lib/lms/store";
import type { CourseSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "all" | "progress" | "done";

export default function StudentCoursesPage() {
  const { state, ready } = useLms();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  const session = state?.session;
  const student =
    session?.role === "student"
      ? state?.students.find((s) => s.id === session.studentId) ?? null
      : null;

  const rows = useMemo(() => {
    if (!student || !state) return [];
    return student.enrolledCourseIds
      .map((id) => {
        const course = courses.find((c) => c.id === id);
        const prog = state.progress.find(
          (p) => p.studentId === student.id && p.courseId === id
        );
        const pct = getProgressPercent(
          prog ?? {
            studentId: student.id,
            courseId: id,
            completedLessonIds: [],
            lessonCount: course?.lessonCount ?? 1,
          }
        );
        return { course, pct, id };
      })
      .filter((r) => {
        if (tab === "done") return r.pct >= 100;
        if (tab === "progress") return r.pct < 100;
        return true;
      });
  }, [student, state, courses, tab]);

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  if (!student) {
    return (
      <p className="text-sm text-ink-muted">
        <Link href="/login" className="text-accent">
          سجّلي الدخول
        </Link>{" "}
        لعرض دوراتك.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">دوراتي</h1>
      <p className="mt-1 text-sm text-ink-muted">
        الدورات التي لديكِ وصول إليها
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "الكل"],
            ["progress", "قيد الدراسة"],
            ["done", "مكتملة"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium",
              tab === key
                ? "bg-accent text-white"
                : "bg-blush-soft text-foreground/70"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map(({ course, pct, id }) => (
          <div
            key={id}
            className="overflow-hidden rounded-2xl border border-border/70 bg-surface"
          >
            <div className="relative aspect-[16/9] bg-muted">
              {course?.thumbnail && (
                <Image
                  src={course.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold leading-snug">
                {course?.title ?? id}
              </h3>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-blush-soft">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{pct}% مكتمل</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/learn/${id}`}
                  className="inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-medium text-white"
                >
                  {pct >= 100 ? "مراجعة" : "متابعة"}
                </Link>
                {pct >= 100 && (
                  <Link
                    href="/dashboard/certificates"
                    className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-medium"
                  >
                    طلب شهادة
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-ink-muted sm:col-span-2">
            لا توجد دورات هنا.{" "}
            <Link href="/courses" className="text-accent">
              تصفّحي الكتالوج
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
