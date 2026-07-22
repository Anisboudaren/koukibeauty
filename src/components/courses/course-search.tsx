"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";
import type { CourseSummary } from "@/lib/types";
import { getEffectivePrice } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CourseSearchProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  /** Larger input for mobile menu */
  size?: "sm" | "md";
  onNavigate?: () => void;
}

export function CourseSearch({
  className,
  inputClassName,
  placeholder = "ابحثي عن دورة…",
  size = "sm",
  onNavigate,
}: CourseSearchProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CourseSummary[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/courses?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as CourseSummary[];
        setResults(data.slice(0, 8));
        setSearched(true);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className={cn(
            "pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-muted",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4 start-3.5"
          )}
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-full border border-border/50 bg-[#fff5f6] text-sm text-foreground outline-none transition placeholder:text-ink-subtle focus:border-blush-deep focus:ring-2 focus:ring-blush/35",
            size === "sm" ? "h-9 pe-8 ps-9" : "h-11 pe-10 ps-10",
            inputClassName
          )}
        />
        {loading ? (
          <Loader2 className="absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-ink-muted" />
        ) : query ? (
          <button
            type="button"
            aria-label="مسح"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-blush-soft"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-[60] overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl"
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-muted">جاري البحث…</p>
          ) : searched && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-muted">لا توجد نتائج</p>
          ) : (
            <ul className="max-h-[min(70vh,22rem)] overflow-y-auto py-1">
              {results.map((course) => {
                const price = getEffectivePrice(course);
                return (
                  <li key={course.id} role="option">
                    <Link
                      href={`/courses/${course.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-blush-soft"
                    >
                      <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {course.thumbnail ? (
                          <Image
                            src={course.thumbnail}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {course.title}
                        </p>
                        <p className="truncate text-xs text-ink-muted">
                          {course.category}
                          {course.priceType === "free" || price === 0
                            ? " · مجاني"
                            : ` · ${price.toLocaleString("ar-DZ")} د.ج`}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {query.trim() && (
            <Link
              href={`/courses?q=${encodeURIComponent(query.trim())}`}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="block border-t border-border/60 px-4 py-2.5 text-center text-xs font-medium text-accent hover:bg-blush-soft"
            >
              عرض كل النتائج
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
