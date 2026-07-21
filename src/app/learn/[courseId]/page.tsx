import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { VideoPlayer } from "@/components/video/video-player";
import { CurriculumSheet } from "@/components/video/curriculum-sheet";
import { LearnAccessGate } from "@/components/learn/learn-access-gate";
import { getAllLessons, getCourseById } from "@/lib/courses";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: lessonParam } = await searchParams;
  const course = await getCourseById(courseId);
  if (!course) notFound();

  const lessons = getAllLessons(course);
  const currentIndex = lessonParam
    ? lessons.findIndex((l) => l.id === lessonParam)
    : 0;
  const currentLesson = lessons[currentIndex >= 0 ? currentIndex : 0];
  if (!currentLesson) notFound();

  const prev = lessons[currentIndex - 1];
  const next = lessons[currentIndex + 1];

  return (
    <div className="min-h-full bg-white pb-24 lg:pb-8">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <LearnAccessGate
          courseId={courseId}
          courseSlug={course.slug}
          lessonId={currentLesson.id}
          lessonCount={lessons.length}
        >
          <div className="mb-4">
            <Link
              href={`/courses/${course.slug}`}
              className="text-xs text-black/50 hover:text-accent"
            >
              {course.title}
            </Link>
            <h1 className="mt-1 text-lg font-bold sm:text-xl">
              {currentLesson.title}
            </h1>
            <p className="text-xs text-black/40">
              الدرس {currentIndex + 1} من {lessons.length}
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <VideoPlayer
                courseId={courseId}
                lessonId={currentLesson.id}
                title={currentLesson.title}
              />

              {currentLesson.description ? (
                <div className="mt-5 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:p-5">
                  <h2 className="text-sm font-bold">عن هذا الدرس</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/65">
                    {currentLesson.description}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex gap-3">
                {prev ? (
                  <Link
                    href={`/learn/${courseId}?lesson=${prev.id}`}
                    className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-border text-sm font-medium transition hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
                {next ? (
                  <Link
                    href={`/learn/${courseId}?lesson=${next.id}`}
                    className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-accent text-sm font-medium text-white transition hover:bg-accent-dark"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>

            <CurriculumSheet
              course={course}
              lessons={lessons}
              currentLessonId={currentLesson.id}
              courseId={courseId}
            />
          </div>
        </LearnAccessGate>
      </main>
    </div>
  );
}
