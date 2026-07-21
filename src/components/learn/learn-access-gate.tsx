"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useLms } from "@/lib/lms/use-lms";
import { markLessonComplete } from "@/lib/lms/store";

interface Props {
  courseId: string;
  courseSlug: string;
  lessonId: string;
  lessonCount: number;
  children: ReactNode;
}

export function LearnAccessGate({
  courseId,
  courseSlug,
  lessonId,
  lessonCount,
  children,
}: Props) {
  const { state, ready, apply } = useLms();
  const router = useRouter();

  const session = state?.session;
  const student =
    session?.role === "student"
      ? state?.students.find((s) => s.id === session.studentId)
      : null;

  const allowed =
    !ready ||
    !session ||
    session.role === "admin" ||
    (student &&
      student.status === "active" &&
      student.enrolledCourseIds.includes(courseId));

  const pending =
    student &&
    state?.courseOrders.some(
      (o) =>
        o.studentId === student.id &&
        o.courseId === courseId &&
        o.status === "pending"
    );

  useEffect(() => {
    if (!ready || !session) return;
    if (session.role === "admin") return;
    if (session.role === "student" && !allowed && !pending) {
      router.replace(`/courses/${courseSlug}`);
    }
  }, [ready, session, allowed, pending, courseSlug, router]);

  if (!ready) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  if (session?.role === "student" && !allowed) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="text-lg font-bold">
          {pending ? "طلبك قيد المعالجة" : "لا يوجد وصول لهذه الدورة"}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {pending
            ? "بعد تأكيد الدفع عبر واتساب ستفتح الدورة تلقائياً."
            : "اطلبي الوصول من صفحة الدورة أولاً."}
        </p>
        <Link
          href={pending ? "/dashboard/requests" : `/courses/${courseSlug}`}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white"
        >
          {pending ? "طلباتي" : "صفحة الدورة"}
        </Link>
      </div>
    );
  }

  function completeLesson() {
    if (session?.role !== "student") return;
    apply(
      markLessonComplete(session.studentId, courseId, lessonId, lessonCount)
    );
  }

  const prog =
    session?.role === "student"
      ? state?.progress.find(
          (p) =>
            p.studentId === session.studentId && p.courseId === courseId
        )
      : null;
  const done = prog?.completedLessonIds.includes(lessonId);

  return (
    <div>
      {children}
      {session?.role === "student" && (
        <div className="mt-4">
          <button
            type="button"
            onClick={completeLesson}
            disabled={done}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium transition hover:bg-blush-soft disabled:opacity-50"
          >
            {done ? "تم إنجاز هذا الدرس ✓" : "تعليم الدرس كمكتمل"}
          </button>
        </div>
      )}
    </div>
  );
}
