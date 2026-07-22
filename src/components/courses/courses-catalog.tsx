"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import type { CourseSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CoursesCatalogProps {
  courses: CourseSummary[];
  categories: string[];
}

export function CoursesCatalog({ courses, categories }: CoursesCatalogProps) {
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q")?.trim() ?? "";
  const [q, setQ] = useState(urlQ);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (category && c.category !== category) return false;
      if (!term) return true;
      return (
        c.title.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term)
      );
    });
  }, [courses, q, category]);

  return (
    <>
      <div className="relative mb-8 max-w-xl">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحثي في الكتالوج…"
          className="h-11 w-full rounded-full border border-border/50 bg-[#fff5f6] pe-4 ps-10 text-sm outline-none focus:border-blush-deep focus:ring-2 focus:ring-blush/35"
        />
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-medium transition",
            !category
              ? "bg-foreground text-white"
              : "border border-border bg-surface text-ink-muted"
          )}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat === category ? null : cat)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium transition",
              category === cat
                ? "bg-foreground text-white"
                : "border border-border bg-surface text-ink-muted"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-ink-muted">
        {filtered.length} نتيجة
        {q.trim() ? ` لـ «${q.trim()}»` : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-muted">
          لا توجد دورات مطابقة لبحثك
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </>
  );
}
