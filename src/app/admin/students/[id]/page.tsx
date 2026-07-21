"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLms } from "@/lib/lms/use-lms";
import {
  getProgressPercent,
  setStudentCourses,
  upsertStudent,
} from "@/lib/lms/store";
import { WILAYAS } from "@/lib/wilayas";
import type { CourseSummary } from "@/lib/types";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, apply } = useLms();
  const [courses, setCourses] = useState<CourseSummary[]>([]);

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

  function toggleCourse(courseId: string) {
    const set = new Set(student!.enrolledCourseIds);
    if (set.has(courseId)) set.delete(courseId);
    else set.add(courseId);
    apply(setStudentCourses(student!.id, [...set]));
  }

  function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "").trim();
    apply(
      upsertStudent({
        id: student!.id,
        fullName: String(fd.get("fullName") || ""),
        phone: String(fd.get("phone") || ""),
        email: String(fd.get("email") || "") || undefined,
        whatsapp: String(fd.get("whatsapp") || ""),
        wilaya: String(fd.get("wilaya") || ""),
        ...(password.length >= 6 ? { password } : {}),
      })
    );
    const pwInput = e.currentTarget.elements.namedItem(
      "password"
    ) as HTMLInputElement | null;
    if (pwInput) pwInput.value = "";
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
        <button
          type="submit"
          className="h-11 rounded-full bg-accent text-sm font-medium text-white sm:col-span-2"
        >
          حفظ التعديلات
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
                  onChange={() => toggleCourse(c.id)}
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
