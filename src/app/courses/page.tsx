import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/home/site-footer";
import { CourseCard } from "@/components/courses/course-card";
import { getCategories, getCourseSummaries } from "@/lib/courses";

export default async function CoursesPage() {
  const courses = await getCourseSummaries();
  const categories = getCategories(courses);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-xl sm:mb-12">
          <p className="mb-3 text-sm font-medium tracking-wide text-accent">
            الكتالوج
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            جميع الدورات
          </h1>
          <p className="mt-3 text-sm text-ink-muted sm:text-base">
            {courses.length} دورة في {categories.length} تصنيف
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-white">
            الكل
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-ink-muted"
            >
              {cat}
            </span>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
