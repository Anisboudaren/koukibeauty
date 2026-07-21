import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { CourseAccessCta } from "@/components/courses/course-access-cta";
import { getCourseBySlug, getCourseSummaries } from "@/lib/courses";
import { formatDuration, levelLabel } from "@/lib/parse-course-content";
import { getEffectivePrice, hasPromo } from "@/lib/types";
import { absoluteUrl } from "@/lib/seo";
import { CheckCircle, PlayCircle } from "lucide-react";

export async function generateStaticParams() {
  const courses = await getCourseSummaries();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.archived) {
    return { title: "دورة غير موجودة" };
  }

  const description =
    course.description?.slice(0, 160) ||
    `${course.title} — برنامج من أكاديمية كوكي بيوتي`;

  return {
    title: course.title,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      title: course.title,
      description,
      url: `/courses/${course.slug}`,
      type: "article",
      images: course.thumbnail
        ? [{ url: course.thumbnail, alt: course.title }]
        : [{ url: "/icon/K.png", alt: course.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      images: course.thumbnail ? [course.thumbnail] : ["/icon/K.png"],
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.archived) notFound();

  const modules = [...course.modules].sort((a, b) => a.order - b.order);
  const lessons = modules.flatMap((m) =>
    [...m.lessons].sort((a, b) => a.order - b.order)
  );
  const firstLesson = lessons[0];
  let lessonNumber = 0;
  const effective = getEffectivePrice(course);
  const promo = hasPromo(course);

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "koukibeauty academy",
      sameAs: absoluteUrl("/"),
    },
    image: course.thumbnail || absoluteUrl("/icon/K.png"),
    inLanguage: "ar",
    ...(course.priceType === "paid"
      ? {
          offers: {
            "@type": "Offer",
            price: effective,
            priceCurrency: "DZD",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/courses/${course.slug}`),
          },
        }
      : {}),
  };

  return (
    <div className="min-h-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
            {course.thumbnail && (
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent-dark">
                {course.category}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-black/60">
                {levelLabel(course.level)}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-black/60">
                {formatDuration(course.duration.hours, course.duration.minutes)}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-black/60">
                {lessons.length} درس
              </span>
            </div>

            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {course.title}
            </h1>

            <p className="text-sm leading-relaxed text-black/60">
              {course.description}
            </p>

            <div className="flex items-baseline gap-2">
              {course.priceType === "free" || effective === 0 ? (
                <span className="text-lg font-bold text-accent">مجاني</span>
              ) : (
                <>
                  <span className="text-lg font-bold text-accent">
                    {effective.toLocaleString("ar-DZ")} د.ج
                  </span>
                  {promo && (
                    <span className="text-sm text-black/40 line-through">
                      {course.price.toLocaleString("ar-DZ")} د.ج
                    </span>
                  )}
                </>
              )}
            </div>

            <CourseAccessCta
              courseId={course.id}
              courseTitle={course.title}
              firstLessonId={firstLesson?.id}
              price={effective}
            />
          </div>
        </div>

        {course.benefits.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">ماذا ستتعلمين؟</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {course.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-2 text-lg font-bold">محتوى البرنامج</h2>
          <p className="mb-6 text-sm text-black/50">
            {modules.length} وحدة · {lessons.length} درس
          </p>

          <div className="space-y-6">
            {modules.map((mod) => {
              const modLessons = [...mod.lessons].sort(
                (a, b) => a.order - b.order
              );
              return (
                <div key={mod.id}>
                  <h3 className="mb-3 text-sm font-bold text-accent-dark">
                    {mod.title}
                  </h3>
                  <div className="space-y-2">
                    {modLessons.map((lesson) => {
                      lessonNumber += 1;
                      return (
                        <div
                          key={lesson.id}
                          className="rounded-xl border border-border px-4 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">
                              {lessonNumber}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {lesson.title}
                                </p>
                                {lesson.videoId ? (
                                  <PlayCircle className="h-3.5 w-3.5 shrink-0 text-accent" />
                                ) : null}
                              </div>
                              {lesson.description ? (
                                <p className="mt-1 text-xs leading-relaxed text-black/50">
                                  {lesson.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
