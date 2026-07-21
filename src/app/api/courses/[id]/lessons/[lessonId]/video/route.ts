import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/courses";
import { buildEmbedUrl } from "@/lib/youtube";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const { id, lessonId } = await params;
  const course = await getCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  }

  for (const module of course.modules) {
    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (lesson?.videoId) {
      return NextResponse.json({
        videoId: lesson.videoId,
        embedUrl: buildEmbedUrl(lesson.videoId),
        title: lesson.title,
      });
    }
  }

  return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
}
