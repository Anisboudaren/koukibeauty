import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/home/site-footer";
import { CoursesCatalog } from "@/components/courses/courses-catalog";
import { getCategories, getCourseSummaries } from "@/lib/courses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "جميع الدورات والبرامج",
  description:
    "تصفّحي برامج أكاديمية كوكي بيوتي — شعر، مكياج، تسريحات والمزيد. دورات أونلاين مرتّبة بالوحدات والدروس.",
  alternates: { canonical: "/courses" },
  openGraph: {
    title: "جميع الدورات | koukibeauty academy",
    description:
      "كتالوج برامج التجميل والعناية — تعلّمي أونلاين مع كوكي.",
    url: "/courses",
  },
};

export default async function CoursesPage() {
  const courses = await getCourseSummaries();
  const categories = getCategories(courses);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-xl sm:mb-8">
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

        <Suspense
          fallback={
            <p className="text-sm text-ink-muted">جاري تحميل الكتالوج…</p>
          }
        >
          <CoursesCatalog courses={courses} categories={categories} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
