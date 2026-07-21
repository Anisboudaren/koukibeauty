"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLms } from "@/lib/lms/use-lms";
import {
  createCertificateOrder,
  getProgressPercent,
} from "@/lib/lms/store";
import type { CourseSummary } from "@/lib/types";

export default function StudentCertificatesPage() {
  const { state, ready, apply } = useLms();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [msg, setMsg] = useState("");

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

  const eligible = useMemo(() => {
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
        const existing = state.certificateOrders.find(
          (o) =>
            o.studentId === student.id &&
            o.courseId === id &&
            (o.status === "pending" || o.status === "done")
        );
        return { id, course, pct, existing };
      })
      .filter((r) => r.pct >= 100);
  }, [student, state, courses]);

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  if (!student) {
    return (
      <p className="text-sm text-ink-muted">
        <Link href="/login" className="text-accent">
          سجّلي الدخول
        </Link>
      </p>
    );
  }

  function orderCert(courseId: string, title: string) {
    try {
      const { state: next } = createCertificateOrder({
        studentId: student!.id,
        courseId,
        courseTitle: title,
      });
      apply(next);
      setMsg("تم إرسال طلب الشهادة — ستتواصل الإدارة عبر واتساب");
    } catch {
      setMsg("تعذّر إنشاء الطلب");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">الشهادات</h1>
      <p className="mt-1 text-sm text-ink-muted">
        اطلبي شهادة للدورة المكتملة — تُرسل عبر واتساب بعد التأكيد
      </p>

      {msg && (
        <p className="mt-4 rounded-xl bg-blush-soft px-4 py-3 text-sm text-foreground">
          {msg}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {eligible.map(({ id, course, existing }) => (
          <div
            key={id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface p-4"
          >
            <div>
              <p className="font-medium">{course?.title ?? id}</p>
              <p className="text-xs text-emerald-700">مكتملة 100%</p>
            </div>
            {existing ? (
              <span className="rounded-full bg-blush-soft px-3 py-1.5 text-xs font-medium">
                {existing.status === "done" ? "تم الإرسال" : "طلب معلّق"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  orderCert(id, course?.title ?? id)
                }
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
              >
                طلب شهادة
              </button>
            )}
          </div>
        ))}
        {eligible.length === 0 && (
          <p className="text-sm text-ink-muted">
            أكملي دورة أولاً لتتمكّني من طلب الشهادة.{" "}
            <Link href="/dashboard/courses" className="text-accent">
              دوراتي
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
