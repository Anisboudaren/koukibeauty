"use client";

import { useLms } from "@/lib/lms/use-lms";
import Link from "next/link";

export default function StudentRequestsPage() {
  const { state, ready } = useLms();

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  const studentId =
    state.session?.role === "student" ? state.session.studentId : null;
  if (!studentId) {
    return (
      <p className="text-sm text-ink-muted">
        <Link href="/login" className="text-accent">
          سجّلي الدخول
        </Link>
      </p>
    );
  }

  const courseOrders = state.courseOrders.filter(
    (o) => o.studentId === studentId
  );
  const certOrders = state.certificateOrders.filter(
    (o) => o.studentId === studentId
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">طلباتي</h1>
      <p className="mt-1 text-sm text-ink-muted">
        طلبات الوصول للشهادات والدورات — المعلّقة والمكتملة
      </p>

      <section className="mt-8">
        <h2 className="mb-3 font-bold">طلبات الدورات</h2>
        <div className="space-y-3">
          {courseOrders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium">{o.courseTitle}</p>
                <p className="text-xs text-ink-muted">
                  {o.amount.toLocaleString("ar-DZ")} د.ج ·{" "}
                  {new Date(o.createdAt).toLocaleDateString("ar-DZ")}
                </p>
              </div>
              <StatusPill status={o.status} />
            </div>
          ))}
          {courseOrders.length === 0 && (
            <p className="text-sm text-ink-muted">لا توجد طلبات دورات</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-bold">طلبات الشهادات</h2>
        <div className="space-y-3">
          {certOrders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium">{o.courseTitle}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(o.createdAt).toLocaleDateString("ar-DZ")}
                </p>
              </div>
              <StatusPill status={o.status} />
            </div>
          ))}
          {certOrders.length === 0 && (
            <p className="text-sm text-ink-muted">لا توجد طلبات شهادات</p>
          )}
        </div>
      </section>
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
    pending: "قيد المعالجة",
    done: "تم",
    cancelled: "ملغى",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}
