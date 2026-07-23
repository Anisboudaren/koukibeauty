"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useLms } from "@/lib/lms/use-lms";
import { WILAYAS } from "@/lib/wilayas";
import { cn } from "@/lib/utils";
import {
  ConfirmDialog,
  EmptyHint,
  Pagination,
  paginate,
} from "@/components/admin/confirm-dialog";

const PAGE_SIZE = 10;

export default function AdminStudentsPage() {
  const { state, ready, refresh } = useLms();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    whatsapp: "",
    wilaya: "16",
    password: "",
  });

  const filtered = useMemo(() => {
    if (!state) return [];
    const term = q.trim().toLowerCase();
    if (!term) return state.students;
    return state.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.phone.includes(term) ||
        s.whatsapp.includes(term)
    );
  }, [state, q]);

  const pageItems = paginate(filtered, page, PAGE_SIZE);
  const deleteTarget = state?.students.find((s) => s.id === deleteId);

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  async function createStudent(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (form.password.trim().length < 6) {
      setFormError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          whatsapp: (form.whatsapp || form.phone).trim(),
          wilaya: form.wilaya,
          password: form.password,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setFormError(data?.error || "تعذّر إنشاء الطالبة");
        return;
      }

      await refresh();
      setForm({
        fullName: "",
        phone: "",
        email: "",
        whatsapp: "",
        wilaya: "16",
        password: "",
      });
      setShowForm(false);
    } catch {
      setFormError("تعذّر الاتصال. حاولي مرة أخرى.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الطالبات</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {state.students.length} طالبة مسجّلة
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setFormError("");
          }}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          طالبة جديدة
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createStudent}
          className="mt-6 grid gap-3 rounded-2xl border border-border/70 bg-surface p-5 sm:grid-cols-2"
        >
          <input
            required
            placeholder="الاسم الكامل"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="h-11 rounded-full border border-border px-4 text-sm"
          />
          <input
            required
            placeholder="الهاتف"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="h-11 rounded-full border border-border px-4 text-sm"
          />
          <input
            placeholder="واتساب"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="h-11 rounded-full border border-border px-4 text-sm"
          />
          <input
            placeholder="البريد (اختياري)"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-11 rounded-full border border-border px-4 text-sm"
          />
          <select
            value={form.wilaya}
            onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
            className="h-11 rounded-full border border-border px-4 text-sm sm:col-span-2"
          >
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>
          <input
            required
            type="password"
            minLength={6}
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="h-11 rounded-full border border-border px-4 text-sm sm:col-span-2"
            autoComplete="new-password"
          />
          {formError && (
            <p className="text-sm text-accent sm:col-span-2" role="alert">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="h-11 rounded-full bg-accent text-sm font-medium text-white disabled:opacity-60 sm:col-span-2"
          >
            {creating ? "جاري الحفظ…" : "حفظ"}
          </button>
        </form>
      )}

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="بحث بالاسم أو الهاتف…"
          className="h-11 w-full rounded-full border border-border bg-surface pe-4 ps-10 text-sm"
        />
      </div>

      <div className="mt-4 space-y-3">
        {pageItems.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-surface p-4"
          >
            <Link href={`/admin/students/${s.id}`} className="min-w-0 flex-1">
              <p className="font-medium text-accent hover:underline">
                {s.fullName}
              </p>
              <p className="text-xs text-ink-muted">
                {s.phone} · {s.enrolledCourseIds.length} دورات · ولاية{" "}
                {s.wilaya}
              </p>
            </Link>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                s.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              )}
            >
              {s.status === "active" ? "نشطة" : "معلّقة"}
            </span>
            <button
              type="button"
              disabled={busyId === s.id}
              onClick={async () => {
                setActionError("");
                setBusyId(s.id);
                try {
                  const nextStatus =
                    s.status === "active" ? "suspended" : "active";
                  const res = await fetch(`/api/lms/students/${s.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: nextStatus }),
                  });
                  if (!res.ok) {
                    const data = (await res.json().catch(() => null)) as {
                      error?: string;
                    } | null;
                    setActionError(data?.error || "تعذّر تحديث الحالة");
                    return;
                  }
                  await refresh();
                } catch {
                  setActionError("تعذّر الاتصال");
                } finally {
                  setBusyId(null);
                }
              }}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-blush-soft disabled:opacity-60"
            >
              {s.status === "active" ? "تعليق" : "تفعيل"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteId(s.id)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-subtle"
            >
              حذف
            </button>
          </div>
        ))}
        {filtered.length === 0 && <EmptyHint>لا توجد نتائج</EmptyHint>}
      </div>

      {actionError && (
        <p className="mt-3 text-sm text-accent" role="alert">
          {actionError}
        </p>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="حذف الطالبة؟"
        description={
          deleteTarget
            ? `سيتم حذف «${deleteTarget.fullName}» وجميع طلباتها وتقدّمها. لا يمكن التراجع.`
            : undefined
        }
        confirmLabel="حذف"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (!id) return;
          void (async () => {
            setActionError("");
            setBusyId(id);
            try {
              const res = await fetch(`/api/lms/students/${id}`, {
                method: "DELETE",
              });
              if (!res.ok) {
                const data = (await res.json().catch(() => null)) as {
                  error?: string;
                } | null;
                setActionError(data?.error || "تعذّر الحذف");
                return;
              }
              await refresh();
            } catch {
              setActionError("تعذّر الاتصال");
            } finally {
              setBusyId(null);
            }
          })();
        }}
      />
    </div>
  );
}
