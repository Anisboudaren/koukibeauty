"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, RefreshCw } from "lucide-react";
import { useLms } from "@/lib/lms/use-lms";
import {
  buildWhatsAppUrl,
  certificateOrderMessage,
  getAcademyWhatsApp,
} from "@/lib/lms/whatsapp";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/lms/types";
import {
  ConfirmDialog,
  EmptyHint,
  Pagination,
  StatusPill,
  paginate,
} from "@/components/admin/confirm-dialog";

const PAGE_SIZE = 8;

export default function AdminCertificatesPage() {
  const { state, ready, refresh } = useLms();
  const [filter, setFilter] = useState<OrderStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  async function patchCert(
    id: string,
    status: "pending" | "done" | "cancelled"
  ) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/lms/certificates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error || "تعذّر تحديث الطلب");
        return;
      }
      await refresh();
    } catch {
      setError("تعذّر الاتصال");
    } finally {
      setBusyId(null);
    }
  }

  const list = useMemo(() => {
    if (!state) return [];
    const orders = state.certificateOrders;
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [state, filter]);

  const pageItems = paginate(list, page, PAGE_SIZE);
  const cancelTarget = state?.certificateOrders.find((o) => o.id === cancelId);
  const cancelStudent = cancelTarget
    ? state?.students.find((s) => s.id === cancelTarget.studentId)
    : null;

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">طلبات الشهادات</h1>
          <p className="mt-1 text-sm text-ink-muted">
            أرسلي الشهادة عبر واتساب ثم علّمي الطلب كمكتمل — يمكن الإلغاء بعد
            القبول أيضاً
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-blush-soft disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshing && "animate-spin")}
          />
          تحديث
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["pending", "معلّق"],
            ["done", "مكتمل"],
            ["cancelled", "ملغى"],
            ["all", "الكل"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium",
              filter === key
                ? "bg-accent text-white"
                : "bg-blush-soft text-foreground/70"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {pageItems.map((o) => {
          const stu = state.students.find((s) => s.id === o.studentId);
          const msg = certificateOrderMessage({
            studentName: stu?.fullName ?? "—",
            courseTitle: o.courseTitle,
            orderId: o.id,
          });
          const wa = buildWhatsAppUrl(
            stu?.whatsapp || stu?.phone || getAcademyWhatsApp(),
            msg
          );

          return (
            <div
              key={o.id}
              className="rounded-2xl border border-border/70 bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{o.courseTitle}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {stu ? (
                      <Link
                        href={`/admin/students/${stu.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {stu.fullName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <StatusPill status={o.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(o.status === "pending" || o.status === "done") && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-medium text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    واتساب
                  </a>
                )}
                {o.status === "pending" && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => void patchCert(o.id, "done")}
                    className="inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-medium text-white disabled:opacity-60"
                  >
                    تم الإرسال
                  </button>
                )}
                {o.status === "cancelled" && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => void patchCert(o.id, "pending")}
                    className="inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-medium text-white disabled:opacity-60"
                  >
                    إعادة إلى معلّق
                  </button>
                )}
                {o.status !== "cancelled" && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => setCancelId(o.id)}
                    className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-medium disabled:opacity-60"
                  >
                    إلغاء الطلب
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <EmptyHint>لا توجد طلبات في هذا التصفية</EmptyHint>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-accent" role="alert">
          {error}
        </p>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={list.length}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!cancelId}
        title="إلغاء طلب الشهادة؟"
        description={
          cancelTarget
            ? `إلغاء شهادة «${cancelTarget.courseTitle}» لـ ${cancelStudent?.fullName ?? "الطالبة"}؟`
            : undefined
        }
        confirmLabel="تأكيد الإلغاء"
        onCancel={() => setCancelId(null)}
        onConfirm={() => {
          const id = cancelId;
          setCancelId(null);
          if (id) void patchCert(id, "cancelled");
        }}
      />
    </div>
  );
}
