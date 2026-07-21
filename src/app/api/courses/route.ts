import { NextResponse } from "next/server";
import { getCourseSummaries, saveCourse } from "@/lib/courses";
import type { Course } from "@/lib/types";
import { getAdminFromCookies, requireAdminApi } from "@/lib/auth/admin";

export async function GET() {
  const admin = await getAdminFromCookies();
  const summaries = await getCourseSummaries({
    includeArchived: Boolean(admin),
  });
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
  return NextResponse.json(course, { status: 201 });
}
