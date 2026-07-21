"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="إغلاق"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6"
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition hover:bg-blush-soft"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition",
              danger
                ? "bg-accent hover:bg-accent-dark"
                : "bg-foreground hover:bg-foreground/90"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
      <p className="text-xs text-ink-muted">
        عرض {from}–{to} من {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex min-h-9 items-center rounded-full border border-border px-4 text-xs font-medium disabled:opacity-40"
        >
          السابق
        </button>
        <span className="text-xs font-medium text-ink-muted">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-9 items-center rounded-full border border-border px-4 text-xs font-medium disabled:opacity-40"
        >
          التالي
        </button>
      </div>
    </div>
  );
}

export { paginate } from "@/lib/paginate";

export function StatusPill({ status }: { status: string }) {
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

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink-muted">{children}</p>;
}
