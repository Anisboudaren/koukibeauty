"use client";

import Link from "next/link";
import { Award, BookOpen, Clock, ShoppingBag } from "lucide-react";
import { useLms } from "@/lib/lms/use-lms";
import { getProgressPercent } from "@/lib/lms/store";

export default function StudentDashboardPage() {
  const { state, ready } = useLms();

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  if (!state.session || state.session.role !== "student") {
    return (
      <div className="rounded-2xl border border-border/70 bg-surface p-8 text-center">
        <h1 className="text-xl font-bold">لوحة الطالبة</h1>
        <p className="mt-2 text-sm text-ink-muted">
          سجّلي الدخول كطالبة لعرض دوراتك وطلباتك.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
          >
            إنشاء حساب
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink-subtle">
          للتجربة: ادخلي بأي حساب طالبة من البيانات التجريبية، أو أنشئي حساباً
          جديداً.
        </p>
      </div>
    );
  }

  const studentId = state.session.studentId;
  const student = state.students.find((s) => s.id === studentId);
  if (!student) {
    return <p className="text-sm text-ink-muted">الحساب غير موجود</p>;
  }

  if (student.status === "suspended") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold text-amber-900">الحساب معلّق</h1>
        <p className="mt-2 text-sm text-amber-800/80">
          تواصلي مع الإدارة عبر واتساب لإعادة التفعيل.
        </p>
      </div>
    );
  }

  const enrolled = student.enrolledCourseIds;
  let completed = 0;
  let inProgress = 0;
  for (const cid of enrolled) {
    const prog = state.progress.find(
      (p) => p.studentId === student.id && p.courseId === cid
    );
    const pct = getProgressPercent(prog);
    if (pct >= 100) completed += 1;
    else inProgress += 1;
  }

  const pendingCourse = state.courseOrders.filter(
    (o) => o.studentId === student.id && o.status === "pending"
  ).length;
  const pendingCert = state.certificateOrders.filter(
    (o) => o.studentId === student.id && o.status === "pending"
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold">مرحباً، {student.fullName}</h1>
      <p className="mt-1 text-sm text-ink-muted">لوحة التعلّم وطلباتك</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          value={enrolled.length}
          label="دورات مسجّلة"
          href="/dashboard/courses"
        />
        <StatCard
          icon={Clock}
          value={inProgress}
          label="قيد الدراسة"
          href="/dashboard/courses"
        />
        <StatCard
          icon={Award}
          value={completed}
          label="مكتملة"
          href="/dashboard/certificates"
        />
        <StatCard
          icon={ShoppingBag}
          value={pendingCourse + pendingCert}
          label="طلبات معلّقة"
          href="/dashboard/requests"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/courses"
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white"
        >
          تصفّحي الدورات
        </Link>
        <Link
          href="/dashboard/requests"
          className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
        >
          متابعة الطلبات
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  href,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border/70 bg-surface p-5 transition hover:border-accent/30"
    >
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
    </Link>
  );
}
