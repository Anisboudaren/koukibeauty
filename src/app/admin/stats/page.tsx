"use client";

import { useLms } from "@/lib/lms/use-lms";
import { getBestCourse, getTotalIncome } from "@/lib/lms/store";

export default function AdminStatsPage() {
  const { state, ready } = useLms();

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  const income = getTotalIncome(state);
  const best = getBestCourse(state);
  const doneOrders = state.courseOrders.filter((o) => o.status === "done");
  const pending = state.courseOrders.filter((o) => o.status === "pending")
    .length;

  const byCourse = new Map<
    string,
    { title: string; count: number; revenue: number }
  >();
  for (const o of doneOrders) {
    const cur = byCourse.get(o.courseId) ?? {
      title: o.courseTitle,
      count: 0,
      revenue: 0,
    };
    cur.count += 1;
    cur.revenue += o.amount;
    byCourse.set(o.courseId, cur);
  }
  const ranked = [...byCourse.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = Math.max(...ranked.map((r) => r.revenue), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">الإحصائيات</h1>
      <p className="mt-1 text-sm text-ink-muted">
        الدخل وأداء الدورات (من الطلبات المكتملة)
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-surface p-5">
          <p className="text-sm text-ink-muted">إجمالي الدخل</p>
          <p className="mt-2 text-3xl font-bold text-accent">
            {income.toLocaleString("ar-DZ")}
            <span className="ms-1 text-base font-medium">د.ج</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-surface p-5">
          <p className="text-sm text-ink-muted">أفضل دورة</p>
          <p className="mt-2 text-lg font-bold leading-snug">
            {best?.courseTitle ?? "—"}
          </p>
          {best && (
            <p className="mt-1 text-xs text-ink-muted">
              {best.count} مبيعات · {best.revenue.toLocaleString("ar-DZ")} د.ج
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-border/70 bg-surface p-5">
          <p className="text-sm text-ink-muted">طلبات معلّقة</p>
          <p className="mt-2 text-3xl font-bold">{pending}</p>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-border/70 bg-surface p-5 sm:p-6">
        <h2 className="mb-6 font-bold">إيرادات حسب الدورة</h2>
        {ranked.length === 0 ? (
          <p className="text-sm text-ink-muted">لا توجد مبيعات مكتملة بعد</p>
        ) : (
          <ul className="space-y-4">
            {ranked.map((r) => (
              <li key={r.id}>
                <div className="mb-1.5 flex justify-between gap-3 text-sm">
                  <span className="font-medium">{r.title}</span>
                  <span className="shrink-0 text-ink-muted">
                    {r.revenue.toLocaleString("ar-DZ")} د.ج
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-blush-soft">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-subtle">{r.count} طلب مكتمل</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
