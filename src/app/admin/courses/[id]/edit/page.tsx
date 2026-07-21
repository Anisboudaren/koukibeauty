import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourseById } from "@/lib/courses";
import { CourseForm } from "@/components/admin/course-form";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  return (
    <div>
      <Link href="/admin/courses" className="text-xs text-ink-muted hover:text-accent">
        ← العودة
      </Link>
      <h1 className="mt-2 text-2xl font-bold">تعديل البرنامج</h1>
      <p className="mt-1 text-sm text-ink-muted">{course.title}</p>
      <div className="mt-6 max-w-3xl">
        <CourseForm initial={course} />
      </div>
    </div>
  );
}
