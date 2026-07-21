"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { useLms } from "@/lib/lms/use-lms";
import { createCourseOrder } from "@/lib/lms/store";
import { DEFAULT_COURSE_PRICE } from "@/lib/lms/types";

interface Props {
  courseId: string;
  courseTitle: string;
  firstLessonId?: string;
  price?: number;
}

export function CourseAccessCta({
  courseId,
  courseTitle,
  firstLessonId,
  price = DEFAULT_COURSE_PRICE,
}: Props) {
  const { state, ready, apply } = useLms();
  const [msg, setMsg] = useState("");

  if (!ready || !state) {
    return (
      <div className="mt-2 h-12 w-40 animate-pulse rounded-full bg-muted" />
    );
  }

  const session = state.session;

  if (session?.role === "admin") {
    return firstLessonId ? (
      <Link
        href={`/learn/${courseId}?lesson=${firstLessonId}`}
        className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition hover:bg-accent-dark"
      >
        <Play className="h-4 w-4" />
        معاينة التعلم
      </Link>
    ) : null;
  }

  if (!session || session.role !== "student") {
    return (
      <div className="mt-2 space-y-2">
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white"
        >
          سجّلي للطلب
        </Link>
        <p className="text-xs text-ink-muted">
          يلزم تسجيل الدخول لطلب الوصول عبر واتساب
        </p>
      </div>
    );
  }

  const student = state.students.find((s) => s.id === session.studentId);
  if (!student) return null;

  if (student.status === "suspended") {
    return (
      <p className="mt-2 text-sm text-amber-700">حسابك معلّق — تواصلي مع الإدارة</p>
    );
  }

  if (student.enrolledCourseIds.includes(courseId)) {
    return firstLessonId ? (
      <Link
        href={`/learn/${courseId}?lesson=${firstLessonId}`}
        className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition hover:bg-accent-dark"
      >
        <Play className="h-4 w-4" />
        ابدئي التعلم
      </Link>
    ) : null;
  }

  const pending = state.courseOrders.find(
    (o) =>
      o.studentId === student.id &&
      o.courseId === courseId &&
      o.status === "pending"
  );

  if (pending) {
    return (
      <div className="mt-2 space-y-2">
        <span className="inline-flex min-h-12 items-center rounded-full bg-amber-50 px-6 text-sm font-medium text-amber-800">
          طلبك قيد المعالجة
        </span>
        <p className="text-xs text-ink-muted">
          <Link href="/dashboard/requests" className="text-accent">
            متابعة الطلب
          </Link>
        </p>
      </div>
    );
  }

  function requestAccess() {
    try {
      const { state: next } = createCourseOrder({
        studentId: student!.id,
        courseId,
        courseTitle,
        amount: price,
      });
      apply(next);
      setMsg("تم إرسال الطلب — ستتواصل الإدارة عبر واتساب لتأكيد الدفع");
    } catch {
      setMsg("تعذّر إنشاء الطلب");
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        onClick={requestAccess}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition hover:bg-accent-dark"
      >
        اطلبي الوصول ({price.toLocaleString("ar-DZ")} د.ج)
      </button>
      {msg && <p className="text-xs text-ink-muted">{msg}</p>}
    </div>
  );
}
