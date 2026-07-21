"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLms } from "@/lib/lms/use-lms";
import { getProgressPercent } from "@/lib/lms/store";
import type { CourseSummary } from "@/lib/types";
import {
  EmptyHint,
  Pagination,
  paginate,
} from "@/components/admin/confirm-dialog";

const PAGE_SIZE = 12;

export default function CourseStudentsPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready } = useLms();
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((list: CourseSummary[]) => {
        setCourse(list.find((c) => c.id === id) ?? null);
      });
  }, [id]);

  const enrolled = useMemo(() => {
    if (!state) return [];
    return state.students.filter((s) => s.enrolledCourseIds.includes(id));
  }, [state, id]);

  const pageItems = paginate(enrolled, page, PAGE_SIZE);

  if (!ready || !state) {
    return <p className="text-sm text-ink-muted">جاري التحميل…</p>;
  }

  return (
    <div>
      <Link
        href="/admin/courses"
        className="text-xs text-ink-muted hover:text-accent"
      >
        ← الدورات
      </Link>
      <h1 className="mt-2 text-2xl font-bold">المسجّلات في الدورة</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {course?.title ?? id} · {enrolled.length} طالبة
      </p>

      <div className="mt-6 space-y-3">
        {pageItems.map((s) => {
          const prog = state.progress.find(
            (p) => p.studentId === s.id && p.courseId === id
          );
          const pct = getProgressPercent(prog);
          return (
            <Link
              key={s.id}
              href={`/admin/students/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 transition hover:border-accent/30"
            >
              <div>
                <p className="font-medium text-accent hover:underline">
                  {s.fullName}
                </p>
                <p className="text-xs text-ink-muted">
                  {s.phone} · ولاية {s.wilaya}
                </p>
              </div>
              <span className="text-sm font-medium text-accent">{pct}%</span>
            </Link>
          );
        })}
        {enrolled.length === 0 && (
          <EmptyHint>لا توجد طالبات مسجّلات بعد</EmptyHint>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={enrolled.length}
        onPageChange={setPage}
      />
    </div>
  );
}
