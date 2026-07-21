"use client";

import Link from "next/link";
import {
  Award,
  BookOpen,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import { useLms } from "@/lib/lms/use-lms";
import { getTotalIncome } from "@/lib/lms/store";
import { useEffect, useState } from "react";

export default function AdminOverviewPage() {
  const { state, ready } = useLms();
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => setCourseCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setCourseCount(0));
  }, []);

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  const pendingOrders = state.courseOrders.filter((o) => o.status === "pending")
    .length;
  const pendingCerts = state.certificateOrders.filter(
    (o) => o.status === "pending"
  ).length;
  const income = getTotalIncome(state);
  const activeStudents = state.students.filter((s) => s.status === "active")
    .length;

  const cards = [
    {
      label: "طالبات نشطات",
      value: activeStudents,
      icon: Users,
      href: "/admin/students",
    },
    {
      label: "الدورات",
      value: courseCount,
      icon: BookOpen,
      href: "/admin/courses",
    },
    {
      label: "طلبات دورات معلّقة",
      value: pendingOrders,
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      label: "طلبات شهادات",
      value: pendingCerts,
      icon: Award,
      href: "/admin/certificates",
    },
    {
      label: "إجمالي الدخل (د.ج)",
      value: income.toLocaleString("ar-DZ"),
      icon: Wallet,
      href: "/admin/stats",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نظرة عامة</h1>
          <p className="mt-1 text-sm text-ink-muted">
            تحكّمي الكامل بالأكاديمية من مكان واحد
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex min-h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          إضافة دورة
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-border/70 bg-surface p-5 transition hover:border-accent/30 hover:shadow-sm"
          >
            <c.icon className="h-5 w-5 text-accent" />
            <p className="mt-3 text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-ink-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">أحدث طلبات الدورات</h2>
            <Link href="/admin/orders" className="text-xs text-accent">
              الكل
            </Link>
          </div>
          <ul className="space-y-3">
            {state.courseOrders.slice(0, 5).map((o) => {
              const stu = state.students.find((s) => s.id === o.studentId);
              return (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {stu ? (
                        <Link
                          href={`/admin/students/${stu.id}`}
                          className="text-accent hover:underline"
                        >
                          {stu.fullName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {o.courseTitle}
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                </li>
              );
            })}
            {state.courseOrders.length === 0 && (
              <p className="text-sm text-ink-muted">لا توجد طلبات بعد</p>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border/70 bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">طلبات الشهادات</h2>
            <Link href="/admin/certificates" className="text-xs text-accent">
              الكل
            </Link>
          </div>
          <ul className="space-y-3">
            {state.certificateOrders.slice(0, 5).map((o) => {
              const stu = state.students.find((s) => s.id === o.studentId);
              return (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {stu ? (
                        <Link
                          href={`/admin/students/${stu.id}`}
                          className="text-accent hover:underline"
                        >
                          {stu.fullName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {o.courseTitle}
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                </li>
              );
            })}
            {state.certificateOrders.length === 0 && (
              <p className="text-sm text-ink-muted">لا توجد طلبات بعد</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    done: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-muted text-ink-muted",
  };
  const label: Record<string, string> = {
    pending: "معلّق",
    done: "تم",
    cancelled: "ملغى",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${map[status] ?? map.cancelled}`}
    >
      {label[status] ?? status}
    </span>
  );
}
