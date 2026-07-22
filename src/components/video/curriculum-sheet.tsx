"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, List, Lock, PlayCircle, X } from "lucide-react";
import type { Course, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLms } from "@/lib/lms/use-lms";

interface CurriculumSheetProps {
  course: Course;
  lessons: Lesson[];
  currentLessonId: string;
  courseId: string;
}

export function CurriculumSheet({
  course,
  lessons,
  currentLessonId,
  courseId,
}: CurriculumSheetProps) {
  const [open, setOpen] = useState(false);
  const { state } = useLms();

  const session = state?.session;
  const completedIds = new Set(
    session?.role === "student"
      ? (state?.progress.find(
          (p) =>
            p.studentId === session.studentId && p.courseId === courseId
        )?.completedLessonIds ?? [])
      : []
  );

  const modules = [...course.modules].sort((a, b) => a.order - b.order);
  const lessonIndex = new Map(lessons.map((l, i) => [l.id, i + 1]));
  const doneCount = lessons.filter((l) => completedIds.has(l.id)).length;

  const list = (
    <div className="space-y-5">
      {modules.map((mod) => {
        const modLessons = [...mod.lessons].sort((a, b) => a.order - b.order);
        return (
          <div key={mod.id}>
            <p className="mb-2 px-1 text-xs font-bold text-ink-muted">
              {mod.title}
            </p>
            <div className="space-y-1">
              {modLessons.map((lesson) => {
                const index = lessonIndex.get(lesson.id) ?? 0;
                const active = lesson.id === currentLessonId;
                const completed = completedIds.has(lesson.id);
                const hasVideo = Boolean(lesson.videoId);
                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/${courseId}?lesson=${lesson.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl px-3 py-3 text-sm transition",
                      active && !completed && "bg-accent-subtle text-accent-dark",
                      active && completed && "bg-emerald-100 text-emerald-900",
                      !active &&
                        completed &&
                        "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                      !active && !completed && "hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                        completed
                          ? "bg-emerald-600 text-white"
                          : "bg-black text-white"
                      )}
                    >
                      {completed ? <Check className="h-3.5 w-3.5" /> : index}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block leading-relaxed">{lesson.title}</span>
                      {lesson.description ? (
                        <span
                          className={cn(
                            "mt-0.5 block line-clamp-2 text-[11px] leading-relaxed",
                            completed ? "text-emerald-700/70" : "text-black/45"
                          )}
                        >
                          {lesson.description}
                        </span>
                      ) : null}
                    </span>
                    {completed ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : hasVideo ? (
                      <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    ) : (
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-black/30" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <aside className="hidden w-80 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border p-4">
          <h2 className="mb-1 text-sm font-bold">محتوى البرنامج</h2>
          <p className="mb-4 text-xs text-black/40">
            {doneCount > 0
              ? `${doneCount} من ${lessons.length} مكتمل`
              : `${lessons.length} درس`}
          </p>
          {list}
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden"
      >
        <List className="h-4 w-4" />
        محتوى البرنامج
        {doneCount > 0 ? (
          <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold">
            {doneCount}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-4 safe-bottom">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-black/50">البرنامج</p>
                <h2 className="font-bold">{course.title}</h2>
                {doneCount > 0 ? (
                  <p className="mt-0.5 text-xs text-emerald-700">
                    {doneCount} من {lessons.length} مكتمل
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {list}
          </div>
        </div>
      )}
    </>
  );
}
