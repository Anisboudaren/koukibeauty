"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useLms } from "@/lib/lms/use-lms";
import { getProgressPercent } from "@/lib/lms/store";
import type { CertificateOrder } from "@/lib/lms/types";
import type { CourseSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StudentCertificatesPage() {
  const { state, ready, apply, refresh } = useLms();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [orderingId, setOrderingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  const session = state?.session;
  const student =
    session?.role === "student"
      ? (state?.students.find((s) => s.id === session.studentId) ?? null)
      : null;

  const myOrders = useMemo(() => {
    if (!student || !state) return [];
    return state.certificateOrders
      .filter((o) => o.studentId === student.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [student, state]);

  const programRows = useMemo(() => {
    if (!student || !state) return [];
    return student.enrolledCourseIds.map((id) => {
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
      const activeOrder = state.certificateOrders.find(
        (o) =>
          o.studentId === student.id &&
          o.courseId === id &&
          (o.status === "pending" || o.status === "done")
      );
      return { id, course, pct, activeOrder };
    });
  }, [student, state, courses]);

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  if (!student) {
    return (
      <div className="rounded-2xl border border-border/70 bg-surface p-8 text-center">
        <h1 className="text-xl font-bold">الشهادات</h1>
        <p className="mt-2 text-sm text-ink-muted">
          سجّلي الدخول لطلب شهاداتك ومتابعة حالتها.
        </p>
        <Link
          href="/login?next=/dashboard/certificates"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  async function orderCert(courseId: string, title: string) {
    if (!student || !state || orderingId) return;
    setOrderingId(courseId);
    try {
      const res = await fetch("/api/lms/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          courseId,
          courseTitle: title,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
        order?: {
          id: string;
          studentId: string;
          courseId: string;
          courseTitle: string;
          status: "pending" | "done" | "cancelled";
          createdAt: string;
          completedAt?: string;
        };
        existing?: boolean;
      } | null;

      if (!res.ok || !data?.order) {
        toast.error(data?.error || "تعذّر إنشاء الطلب. حاولي مرة أخرى.");
        return;
      }

      const order = data.order;
      const already = state.certificateOrders.some((o) => o.id === order.id);
      const next = already
        ? state
        : {
            ...state,
            certificateOrders: [order, ...state.certificateOrders],
          };

      apply(next, { quiet: true });
      await refresh();
      toast.success(
        data.existing
          ? "يوجد طلب شهادة لهذا البرنامج مسبقاً"
          : "تم إرسال طلب الشهادة — ستتواصل الإدارة عبر واتساب"
      );
    } catch {
      toast.error("تعذّر الاتصال. حاولي مرة أخرى.");
    } finally {
      setOrderingId(null);
    }
  }

  const canOrderAny = programRows.some((r) => r.pct >= 100 && !r.activeOrder);

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">الشهادات</h1>
            <p className="mt-1 text-sm text-ink-muted">
              اطلبي شهادة بعد إكمال البرنامج، وتابعي حالة كل طلب من هنا.
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-bold">طلبات الشهادات</h2>
          {myOrders.length > 0 && (
            <p className="text-xs text-ink-muted">{myOrders.length} طلب</p>
          )}
        </div>

        {myOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-5 py-8 text-center">
            <p className="text-sm text-ink-muted">
              لا توجد طلبات شهادات بعد.
              {canOrderAny
                ? " اختاري برنامجاً مكتملاً بالأسفل لطلب شهادتك."
                : " أكملي برنامجاً أولاً ثم اطلبي الشهادة."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-bold">طلب شهادة جديدة</h2>
        <p className="mb-4 text-sm text-ink-muted">
          يظهر زر الطلب عندما تصلي إلى 100% في البرنامج.
        </p>

        {programRows.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-surface p-6 text-center">
            <p className="text-sm text-ink-muted">
              لا توجد برامج مسجّلة بعد.{" "}
              <Link href="/courses" className="font-medium text-accent">
                تصفّحي البرامج
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {programRows.map(({ id, course, pct, activeOrder }) => {
              const title = course?.title ?? id;
              const readyForCert = pct >= 100;
              return (
                <div
                  key={id}
                  className="rounded-2xl border border-border/70 bg-surface p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{title}</p>
                      <div className="mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-blush-soft">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            readyForCert ? "bg-emerald-500" : "bg-accent"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p
                        className={cn(
                          "mt-1.5 text-xs",
                          readyForCert
                            ? "font-medium text-emerald-700"
                            : "text-ink-muted"
                        )}
                      >
                        {readyForCert
                          ? "مكتمل 100% — جاهز لطلب الشهادة"
                          : `${pct}% مكتمل — أكملي البرنامج لطلب الشهادة`}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      {activeOrder ? (
                        <CertStatusBadge status={activeOrder.status} />
                      ) : readyForCert ? (
                        <button
                          type="button"
                          disabled={orderingId === id}
                          onClick={() => void orderCert(id, title)}
                          className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:bg-accent-dark disabled:opacity-60"
                        >
                          {orderingId === id ? "جاري الإرسال…" : "طلب شهادة"}
                        </button>
                      ) : (
                        <Link
                          href={`/learn/${id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium hover:bg-blush-soft"
                        >
                          متابعة التعلم
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function OrderCard({ order }: { order: CertificateOrder }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface p-4 sm:p-5">
      <div className="min-w-0">
        <p className="font-medium leading-snug">{order.courseTitle}</p>
        <p className="mt-1 text-xs text-ink-muted">
          طُلب في {new Date(order.createdAt).toLocaleString("ar-DZ")}
          {order.completedAt
            ? ` · أُنجز في ${new Date(order.completedAt).toLocaleString("ar-DZ")}`
            : null}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-subtle">
          {order.status === "pending" &&
            "طلبك قيد المراجعة — ستتواصل الإدارة عبر واتساب قريباً."}
          {order.status === "done" &&
            "تم اعتماد الشهادة وإرسالها / تجهيزها من الإدارة."}
          {order.status === "cancelled" &&
            "أُلغي هذا الطلب. يمكنك طلب شهادة جديدة إن كان البرنامج مكتملاً."}
        </p>
      </div>
      <CertStatusBadge status={order.status} />
    </div>
  );
}

function CertStatusBadge({ status }: { status: CertificateOrder["status"] }) {
  const config = {
    pending: {
      label: "قيد المعالجة",
      className: "bg-amber-50 text-amber-800 border-amber-200",
      Icon: Clock3,
    },
    done: {
      label: "تم الإرسال",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      Icon: CheckCircle2,
    },
    cancelled: {
      label: "ملغى",
      className: "bg-muted text-ink-muted border-border",
      Icon: XCircle,
    },
  }[status];

  const Icon = config.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
