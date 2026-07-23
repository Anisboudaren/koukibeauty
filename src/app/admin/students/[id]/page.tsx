"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLms } from "@/lib/lms/use-lms";
import { getProgressPercent } from "@/lib/lms/store";
import { WILAYAS } from "@/lib/wilayas";
import type { CourseSummary } from "@/lib/types";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, refresh } = useLms();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  const student = state.students.find((s) => s.id === id);
  if (!student) {
    return (
      <div>
        <p className="text-sm text-ink-muted">الطالبة غير موجودة</p>
        <Link href="/admin/students" className="mt-2 text-sm text-accent">
          العودة
        </Link>
      </div>
    );
  }

  async function patchStudent(body: Record<string, unknown>) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/lms/students/${student!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error || "تعذّر الحفظ");
        return false;
      }
      await refresh();
      return true;
    } catch {
      setError("تعذّر الاتصال");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleCourse(courseId: string) {
    const set = new Set(student!.enrolledCourseIds);
    if (set.has(courseId)) set.delete(courseId);
    else set.add(courseId);
    await patchStudent({ enrolledCourseIds: [...set] });
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "").trim();
    const ok = await patchStudent({
      fullName: String(fd.get("fullName") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || "") || null,
      whatsapp: String(fd.get("whatsapp") || ""),
      wilaya: String(fd.get("wilaya") || ""),
      ...(password.length >= 6 ? { password } : {}),
    });
    if (ok) {
      const pwInput = e.currentTarget.elements.namedItem(
        "password"
      ) as HTMLInputElement | null;
      if (pwInput) pwInput.value = "";
    }
  }

  const orders = state.courseOrders.filter((o) => o.studentId === id);
  const certs = state.certificateOrders.filter((o) => o.studentId === id);

  return (
    <div>
      <Link
        href="/admin/students"
        className="text-xs text-ink-muted hover:text-accent"
      >
        ← الطالبات
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{student.fullName}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        الحالة: {student.status === "active" ? "نشطة" : "معلّقة"}
      </p>

      <form
        onSubmit={saveProfile}
        className="mt-8 grid gap-3 rounded-2xl border border-border/70 bg-surface p-5 sm:grid-cols-2"
      >
        <h2 className="font-bold sm:col-span-2">تعديل البيانات</h2>
        <input
          name="fullName"
          defaultValue={student.fullName}
          required
          className="h-11 rounded-full border border-border px-4 text-sm"
        />
        <input
          name="phone"
          defaultValue={student.phone}
          required
          className="h-11 rounded-full border border-border px-4 text-sm"
        />
        <input
          name="whatsapp"
          defaultValue={student.whatsapp}
          className="h-11 rounded-full border border-border px-4 text-sm"
        />
        <input
          name="email"
          defaultValue={student.email ?? ""}
          className="h-11 rounded-full border border-border px-4 text-sm"
        />
        <select
          name="wilaya"
          defaultValue={student.wilaya}
          className="h-11 rounded-full border border-border px-4 text-sm sm:col-span-2"
        >
          {WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.code} — {w.name}
            </option>
          ))}
        </select>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-ink-muted">
            كلمة مرور جديدة (اتركيها فارغة للإبقاء على الحالية)
          </label>
          <input
            name="password"
            type="password"
            minLength={6}
            placeholder="••••••••"
            className="h-11 w-full rounded-full border border-border px-4 text-sm"
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-accent sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-full bg-accent text-sm font-medium text-white disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "جاري الحفظ…" : "حفظ التعديلات"}
        </button>
      </form>

      <section className="mt-8 rounded-2xl border border-border/70 bg-surface p-5">
        <h2 className="mb-4 font-bold">الدورات المسجّلة</h2>
        <div className="space-y-2">
          {courses.map((c) => {
            const enrolled = student.enrolledCourseIds.includes(c.id);
            const prog = state.progress.find(
              (p) => p.studentId === id && p.courseId === c.id
            );
            return (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={enrolled}
                  disabled={saving}
                  onChange={() => void toggleCourse(c.id)}
                  className="accent-accent"
                />
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                {enrolled && (
                  <span className="text-xs text-accent">
                    {getProgressPercent(prog)}%
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-surface p-5">
          <h2 className="mb-3 font-bold">طلبات الدورات</h2>
          <ul className="space-y-2 text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex justify-between gap-2">
                <span className="truncate">{o.courseTitle}</span>
                <span className="text-ink-muted">{o.status}</span>
              </li>
            ))}
            {orders.length === 0 && (
              <li className="text-ink-muted">لا يوجد</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-border/70 bg-surface p-5">
          <h2 className="mb-3 font-bold">طلبات الشهادات</h2>
          <ul className="space-y-2 text-sm">
            {certs.map((o) => (
              <li key={o.id} className="flex justify-between gap-2">
                <span className="truncate">{o.courseTitle}</span>
                <span className="text-ink-muted">{o.status}</span>
              </li>
            ))}
            {certs.length === 0 && (
              <li className="text-ink-muted">لا يوجد</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
