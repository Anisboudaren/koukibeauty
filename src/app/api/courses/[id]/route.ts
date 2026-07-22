import { NextResponse } from "next/server";
import {
  deleteCourse,
  getCourseById,
  saveCourse,
} from "@/lib/courses";
import type { Course } from "@/lib/types";
import { requireAdminApi } from "@/lib/auth/admin";
import { revalidateCoursePages } from "@/lib/revalidate-courses";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const existing = await getCourseById(id);
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = (await request.json()) as Course;
    const course: Course = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await saveCourse(course);
    revalidateCoursePages(course.slug);
    return NextResponse.json(course);
  } catch (err) {
    console.error("[PUT /api/courses/:id]", err);
    const message =
      err instanceof Error ? err.message : "تعذّر حفظ البرنامج";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const existing = await getCourseById(id);
  await deleteCourse(id);
  revalidateCoursePages(existing?.slug);
  return NextResponse.json({ ok: true });
}
