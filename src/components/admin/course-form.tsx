"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { extractYouTubeId } from "@/lib/youtube";
import type { Course, Lesson, Module } from "@/lib/types";
import { DEFAULT_COURSE_LIST_PRICE } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBusy } from "@/components/busy-overlay";

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyLesson(order: number): Lesson {
  return {
    id: uid("lesson"),
    title: "",
    description: "",
    order,
    videoId: null,
  };
}

function emptyModule(order: number): Module {
  return {
    id: uid("module"),
    title: `الوحدة ${order}`,
    order,
    lessons: [],
  };
}

const emptyCourse = (): Course => ({
  id: "",
  slug: "",
  title: "",
  description: "",
  thumbnail: "",
  category: "عام",
  level: "beginner",
  duration: { hours: 0, minutes: 0 },
  priceType: "paid",
  price: DEFAULT_COURSE_LIST_PRICE,
  promoPrice: null,
  archived: false,
  previewVideoId: null,
  benefits: [],
  targetAudience: [],
  materials: [],
  modules: [emptyModule(1)],
  createdAt: "",
  updatedAt: "",
});

/** Normalize older course JSON that may lack newer fields */
function normalizeCourse(course: Course): Course {
  return {
    ...course,
    price: course.price ?? DEFAULT_COURSE_LIST_PRICE,
    promoPrice: course.promoPrice === undefined ? null : course.promoPrice,
    archived: course.archived ?? false,
    modules: course.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => ({
        ...l,
        description: l.description ?? "",
      })),
    })),
  };
}

function lessonVideoDrafts(course: Course): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const m of course.modules) {
    for (const l of m.lessons) {
      drafts[l.id] = l.videoId ? `https://youtu.be/${l.videoId}` : "";
    }
  }
  return drafts;
}

interface CourseFormProps {
  initial?: Course;
}

export function CourseForm({ initial }: CourseFormProps) {
  const router = useRouter();
  const { showBusy, hideBusy } = useBusy();
  const normalized = initial ? normalizeCourse(initial) : emptyCourse();
  const [course, setCourse] = useState<Course>(normalized);
  const [previewUrl, setPreviewUrl] = useState(
    initial?.previewVideoId
      ? `https://youtu.be/${initial.previewVideoId}`
      : ""
  );
  const [videoDrafts, setVideoDrafts] = useState<Record<string, string>>(() =>
    lessonVideoDrafts(normalized)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(normalized.modules.map((m) => [m.id, true]))
  );

  function updateModule(moduleId: string, patch: Partial<Module>) {
    setCourse((c) => ({
      ...c,
      modules: c.modules.map((m) =>
        m.id === moduleId ? { ...m, ...patch } : m
      ),
    }));
  }

  function updateLesson(
    moduleId: string,
    lessonId: string,
    patch: Partial<Lesson>
  ) {
    setCourse((c) => ({
      ...c,
      modules: c.modules.map((m) =>
        m.id !== moduleId
          ? m
          : {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, ...patch } : l
              ),
            }
      ),
    }));
  }

  function addModule() {
    const mod = emptyModule(course.modules.length + 1);
    setCourse((c) => ({
      ...c,
      modules: [...c.modules, mod],
    }));
    setOpenModules((o) => ({ ...o, [mod.id]: true }));
    setVideoDrafts((d) => {
      const next = { ...d };
      for (const l of mod.lessons) next[l.id] = "";
      return next;
    });
  }

  function removeModule(moduleId: string) {
    if (course.modules.length <= 1) return;
    setCourse((c) => ({
      ...c,
      modules: c.modules
        .filter((m) => m.id !== moduleId)
        .map((m, i) => ({ ...m, order: i + 1 })),
    }));
  }

  function moveModule(moduleId: string, dir: -1 | 1) {
    setCourse((c) => {
      const idx = c.modules.findIndex((m) => m.id === moduleId);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= c.modules.length) return c;
      const modules = [...c.modules];
      [modules[idx], modules[next]] = [modules[next], modules[idx]];
      return {
        ...c,
        modules: modules.map((m, i) => ({ ...m, order: i + 1 })),
      };
    });
  }

  function addLesson(moduleId: string) {
    const lesson = emptyLesson(
      (course.modules.find((m) => m.id === moduleId)?.lessons.length ?? 0) + 1
    );
    setCourse((c) => ({
      ...c,
      modules: c.modules.map((m) =>
        m.id !== moduleId
          ? m
          : {
              ...m,
              lessons: [...m.lessons, lesson],
            }
      ),
    }));
    setVideoDrafts((d) => ({ ...d, [lesson.id]: "" }));
  }

  function removeLesson(moduleId: string, lessonId: string) {
    setCourse((c) => ({
      ...c,
      modules: c.modules.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          lessons: m.lessons
            .filter((l) => l.id !== lessonId)
            .map((l, i) => ({ ...l, order: i + 1 })),
        };
      }),
    }));
  }

  function moveLesson(moduleId: string, lessonId: string, dir: -1 | 1) {
    setCourse((c) => ({
      ...c,
      modules: c.modules.map((m) => {
        if (m.id !== moduleId) return m;
        const idx = m.lessons.findIndex((l) => l.id === lessonId);
        const next = idx + dir;
        if (idx < 0 || next < 0 || next >= m.lessons.length) return m;
        const lessons = [...m.lessons];
        [lessons[idx], lessons[next]] = [lessons[next], lessons[idx]];
        return {
          ...m,
          lessons: lessons.map((l, i) => ({ ...l, order: i + 1 })),
        };
      }),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveCourse();
  }

  async function saveCourse(overrides?: Partial<Course>) {
    setError("");

    const draft = { ...course, ...overrides };

    // Only validate titles on modules/lessons that exist — empty programs are allowed
    const blankModule = draft.modules.some((m) => !m.title.trim());
    if (blankModule) {
      setError("كل وحدة تحتاج عنواناً (أو احذفي الوحدات الفارغة)");
      return;
    }

    const blankLesson = draft.modules.some((m) =>
      m.lessons.some((l) => !l.title.trim())
    );
    if (blankLesson) {
      setError("كل درس موجود يحتاج عنواناً (أو احذفيه)");
      return;
    }

    setSaving(true);
    const busyLabel =
      overrides?.archived !== undefined
        ? overrides.archived
          ? "جاري الأرشفة…"
          : "جاري إلغاء الأرشفة…"
        : "جاري حفظ البرنامج…";
    showBusy(busyLabel);

    const previewVideoId =
      extractYouTubeId(previewUrl) ?? draft.previewVideoId;

    const payload: Course = {
      ...draft,
      previewVideoId,
      price: Number(draft.price) || 0,
      promoPrice:
        draft.promoPrice == null ? null : Number(draft.promoPrice) || null,
      archived: draft.archived ?? false,
      modules: draft.modules.map((m, mi) => ({
        ...m,
        order: mi + 1,
        title: m.title.trim(),
        lessons: m.lessons.map((l, li) => ({
          ...l,
          order: li + 1,
          title: l.title.trim(),
          description: (l.description ?? "").trim(),
          videoId: l.videoId,
        })),
      })),
      benefits: draft.benefits.filter(Boolean),
    };

    // Clear invalid promo (must be below regular price)
    if (
      payload.promoPrice != null &&
      (payload.promoPrice <= 0 || payload.promoPrice >= payload.price)
    ) {
      payload.promoPrice = null;
    }

    const isNew = !initial?.id;
    const url = isNew ? "/api/courses" : `/api/courses/${course.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (overrides?.archived !== undefined) {
          setCourse(payload);
        }
        router.push("/admin/courses");
        router.refresh();
        // Keep overlay visible until navigation finishes
        return;
      }
      setError("تعذّر الحفظ. حاولي مرة أخرى.");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    }
    setSaving(false);
    hideBusy();
  }

  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  const saveBar = (
    <div className="flex flex-wrap items-center gap-2">
      {initial?.id && (
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            saveCourse({ archived: !course.archived })
          }
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition disabled:opacity-50",
            course.archived
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-border hover:bg-blush-soft"
          )}
        >
          {course.archived ? (
            <>
              <ArchiveRestore className="h-4 w-4" />
              إلغاء الأرشفة
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" />
              أرشفة
            </>
          )}
        </button>
      )}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50 sm:flex-none"
      >
        {saving ? "جاري الحفظ..." : "حفظ البرنامج"}
      </button>
      <Link
        href="/admin/courses"
        className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm"
      >
        إلغاء
      </Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="sticky top-0 z-20 -mx-1 space-y-3 rounded-2xl border border-border/70 bg-surface/95 p-3 backdrop-blur-md sm:p-4">
        {course.archived && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            هذا البرنامج مؤرشف — مخفي من الكتالوج وغير متاح للطلبات الجديدة.
            الطالبات المسجّلات يبقين قادرات على التعلم.
          </p>
        )}
        {saveBar}
      </div>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-surface p-5">
        <h2 className="text-sm font-bold text-ink-muted">معلومات البرنامج</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">عنوان البرنامج</label>
          <input
            required
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="مثال: برنامج علاجات الشعر"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">وصف البرنامج</label>
          <textarea
            rows={4}
            value={course.description}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="ماذا يغطي هذا البرنامج؟"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">التصنيف</label>
            <input
              value={course.category}
              onChange={(e) =>
                setCourse({ ...course, category: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">رابط الصورة</label>
            <input
              value={course.thumbnail}
              onChange={(e) =>
                setCourse({ ...course, thumbnail: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">نوع السعر</label>
            <select
              value={course.priceType}
              onChange={(e) =>
                setCourse({
                  ...course,
                  priceType: e.target.value as Course["priceType"],
                })
              }
              className="h-[46px] w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-accent"
            >
              <option value="paid">مدفوع</option>
              <option value="free">مجاني</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              السعر (د.ج)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              disabled={course.priceType === "free"}
              value={course.price}
              onChange={(e) =>
                setCourse({
                  ...course,
                  price: Number(e.target.value) || 0,
                })
              }
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent disabled:opacity-50"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              سعر ترويجي (د.ج)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              disabled={course.priceType === "free"}
              value={course.promoPrice ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setCourse({
                  ...course,
                  promoPrice: v === "" ? null : Number(v) || 0,
                });
              }}
              placeholder="اختياري"
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent disabled:opacity-50"
              dir="ltr"
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              اتركيه فارغاً إن لم يكن هناك تخفيض
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            فيديو المعاينة (يوتيوب)
          </label>
          <input
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="https://youtu.be/..."
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            ماذا ستتعلمين؟ (سطر لكل نقطة)
          </label>
          <textarea
            rows={4}
            value={course.benefits.join("\n")}
            onChange={(e) =>
              setCourse({
                ...course,
                benefits: e.target.value.split("\n"),
              })
            }
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder={"تعلّم الأساسيات\nتطبيق عملي"}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">محتوى البرنامج</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              وحدات ودروس — كل درس بفيديو ووصف خاص به · {course.modules.length}{" "}
              وحدة · {lessonCount} درس
            </p>
          </div>
          <button
            type="button"
            onClick={addModule}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blush-soft px-4 text-sm font-medium text-accent-dark"
          >
            <Plus className="h-4 w-4" />
            وحدة جديدة
          </button>
        </div>

        <div className="space-y-4">
          {course.modules.map((mod, mi) => {
            const isOpen = openModules[mod.id] !== false;
            return (
              <div
                key={mod.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-surface"
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-blush-soft/40 px-3 py-2.5 sm:px-4">
                  <GripVertical className="hidden h-4 w-4 text-ink-subtle sm:block" />
                  <span className="text-xs font-medium text-ink-muted">
                    وحدة {mi + 1}
                  </span>
                  <input
                    value={mod.title}
                    onChange={(e) =>
                      updateModule(mod.id, { title: e.target.value })
                    }
                    className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-bold outline-none focus:border-border focus:bg-white"
                    placeholder="عنوان الوحدة"
                  />
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveModule(mod.id, -1)}
                      disabled={mi === 0}
                      className="rounded-lg p-1.5 disabled:opacity-30 hover:bg-white"
                      title="أعلى"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveModule(mod.id, 1)}
                      disabled={mi === course.modules.length - 1}
                      className="rounded-lg p-1.5 disabled:opacity-30 hover:bg-white"
                      title="أسفل"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenModules((o) => ({
                          ...o,
                          [mod.id]: !isOpen,
                        }))
                      }
                      className="rounded-lg px-2 py-1 text-xs text-ink-muted hover:bg-white"
                    >
                      {isOpen ? "طي" : "فتح"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeModule(mod.id)}
                      disabled={course.modules.length <= 1}
                      className="rounded-lg p-1.5 text-accent disabled:opacity-30 hover:bg-accent-subtle"
                      title="حذف الوحدة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-3 p-3 sm:p-4">
                    {mod.lessons.map((lesson, li) => (
                      <div
                        key={lesson.id}
                        className={cn(
                          "rounded-xl border border-border/60 bg-white p-3 sm:p-4",
                          "space-y-3"
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-white">
                            {li + 1}
                          </span>
                          <input
                            required
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(mod.id, lesson.id, {
                                title: e.target.value,
                              })
                            }
                            placeholder="عنوان الدرس"
                            className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                          />
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                moveLesson(mod.id, lesson.id, -1)
                              }
                              disabled={li === 0}
                              className="rounded-lg p-1.5 disabled:opacity-30 hover:bg-muted"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                moveLesson(mod.id, lesson.id, 1)
                              }
                              disabled={li === mod.lessons.length - 1}
                              className="rounded-lg p-1.5 disabled:opacity-30 hover:bg-muted"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeLesson(mod.id, lesson.id)
                              }
                              className="rounded-lg p-1.5 text-accent disabled:opacity-30 hover:bg-accent-subtle"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-ink-muted">
                            وصف الدرس
                          </label>
                          <textarea
                            rows={3}
                            value={lesson.description ?? ""}
                            onChange={(e) =>
                              updateLesson(mod.id, lesson.id, {
                                description: e.target.value,
                              })
                            }
                            placeholder="شرح ما ستتعلمه الطالبة في هذا الدرس…"
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-ink-muted">
                            رابط فيديو يوتيوب لهذا الدرس
                          </label>
                          <input
                            value={videoDrafts[lesson.id] ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setVideoDrafts((d) => ({
                                ...d,
                                [lesson.id]: raw,
                              }));
                              updateLesson(mod.id, lesson.id, {
                                videoId: extractYouTubeId(raw),
                              });
                            }}
                            placeholder="https://youtu.be/... أو اتركيه فارغاً"
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                            dir="ltr"
                          />
                          {lesson.videoId && (
                            <p className="mt-1 text-[11px] text-emerald-700">
                              معرّف الفيديو: {lesson.videoId}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addLesson(mod.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-ink-muted transition hover:border-accent hover:text-accent"
                    >
                      <Plus className="h-4 w-4" />
                      إضافة درس في هذه الوحدة
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-accent-subtle px-4 py-3 text-sm text-accent-dark">
          {error}
        </p>
      )}

      {saveBar}
    </form>
  );
}
