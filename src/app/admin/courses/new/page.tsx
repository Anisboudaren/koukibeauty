import Link from "next/link";
import { CourseForm } from "@/components/admin/course-form";

export default function NewCoursePage() {
  return (
    <div>
      <Link href="/admin/courses" className="text-xs text-ink-muted hover:text-accent">
        ← العودة
      </Link>
      <h1 className="mt-2 text-2xl font-bold">إضافة برنامج جديد</h1>
      <p className="mt-1 text-sm text-ink-muted">
        برنامج بوحدات ودروس متعددة — كل درس بفيديو ووصف
      </p>
      <div className="mt-6 max-w-3xl">
        <CourseForm />
      </div>
    </div>
  );
}
