import { NextResponse } from "next/server";
import { getCourseSummaries, saveCourse } from "@/lib/courses";
import type { Course } from "@/lib/types";
import { getAdminFromCookies, requireAdminApi } from "@/lib/auth/admin";
import { revalidateCoursePages } from "@/lib/revalidate-courses";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminFromCookies();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  let summaries = await getCourseSummaries({
    includeArchived: Boolean(admin),
  });

  if (q) {
    summaries = summaries.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  return NextResponse.json(summaries);
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as Course;
  const id = body.id || String(Date.now());
  const course: Course = {
    ...body,
    id,
    slug: body.slug || `course-${id}`,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveCourse(course);
  revalidateCoursePages(course.slug);
  return NextResponse.json(course, { status: 201 });
}
