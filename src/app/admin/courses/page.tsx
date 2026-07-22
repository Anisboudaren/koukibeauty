"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CourseSummary } from "@/lib/types";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useLms } from "@/lib/lms/use-lms";
import {
  ConfirmDialog,
  EmptyHint,
  Pagination,
  paginate,
} from "@/components/admin/confirm-dialog";
import { useBusy } from "@/components/busy-overlay";

const PAGE_SIZE = 10;

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { state } = useLms();
  const { withBusy } = useBusy();

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  const pageItems = useMemo(
    () => paginate(courses, page, PAGE_SIZE),
    [courses, page]
  );
  const deleteTarget = courses.find((c) => c.id === deleteId);

  async function confirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    await withBusy(
      fetch(`/api/courses/${id}`, { method: "DELETE" }).then(() => {
        setCourses((prev) => prev.filter((c) => c.id !== id));
      }),
      "جاري الحذف…"
    );
  }

  function enrolledCount(courseId: string) {
    if (!state) return 0;
    return state.students.filter((s) =>
      s.enrolledCourseIds.includes(courseId)
    ).length;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة البرامج</h1>
          <p className="mt-1 text-sm text-ink-muted">
            كل برنامج = وحدات ودروس بفيديوهات ووصف
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          برنامج جديد
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-muted">جاري التحميل...</p>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {pageItems.map((course) => (
              <div
                key={course.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-surface p-3 sm:p-4"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {course.thumbnail && (
                    <Image
                      src={course.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{course.title}</p>
                    {course.archived && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        مؤرشف
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">
                    {course.category} · {course.lessonCount} درس ·{" "}
                    {enrolledCount(course.id)} مسجّلة
                    {course.priceType === "free"
                      ? " · مجاني"
                      : ` · ${(course.promoPrice && course.promoPrice < course.price
                          ? course.promoPrice
                          : course.price ?? 4500
                        ).toLocaleString("ar-DZ")} د.ج`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link
                    href={`/admin/courses/${course.id}/students`}
                    className="rounded-lg p-2 hover:bg-blush-soft"
                    title="المسجّلات"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="rounded-lg p-2 hover:bg-blush-soft"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteId(course.id)}
                    className="rounded-lg p-2 text-accent hover:bg-accent-subtle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {courses.length === 0 && <EmptyHint>لا توجد دورات</EmptyHint>}
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={courses.length}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="حذف البرنامج؟"
        description={
          deleteTarget
            ? `سيتم حذف «${deleteTarget.title}» نهائياً من المحتوى.`
            : undefined
        }
        confirmLabel="حذف البرنامج"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
