import Link from "next/link";
import Image from "next/image";
import type { CourseSummary } from "@/lib/types";
import { getEffectivePrice, hasPromo } from "@/lib/types";
import { formatDuration, levelLabel } from "@/lib/parse-course-content";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: CourseSummary;
  className?: string;
}

export function CourseCard({ course, className }: CourseCardProps) {
  const effective = getEffectivePrice(course);
  const promo = hasPromo(course);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-surface transition duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_20px_40px_-24px_rgba(20,20,20,0.35)]",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-subtle">
            بدون صورة
          </div>
        )}
        <span className="absolute end-3 top-3 rounded-full bg-foreground/75 px-3 py-1 text-xs text-white backdrop-blur-sm">
          {course.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-accent">
          {course.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-accent-dark">
            {levelLabel(course.level)}
          </span>
          <span>
            {formatDuration(course.duration.hours, course.duration.minutes)}
          </span>
          <span>{course.lessonCount} درس</span>
        </div>
        <div className="flex items-baseline gap-2">
          {course.priceType === "free" || effective === 0 ? (
            <span className="text-sm font-bold text-accent">مجاني</span>
          ) : (
            <>
              <span className="text-sm font-bold text-accent">
                {effective.toLocaleString("ar-DZ")} د.ج
              </span>
              {promo && (
                <span className="text-xs text-ink-muted line-through">
                  {course.price.toLocaleString("ar-DZ")} د.ج
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
