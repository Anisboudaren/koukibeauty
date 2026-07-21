import { NextResponse } from "next/server";
import { loadLmsStateFromDb, saveLmsStateToDb } from "@/lib/lms/db";
import type { LmsState } from "@/lib/lms/types";

export async function GET() {
  try {
    const data = await loadLmsStateFromDb();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load LMS state" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Omit<LmsState, "session"> & {
      passwords?: Record<string, string>;
    };
    const { passwords, ...state } = body;
    await saveLmsStateToDb(state, passwords ?? {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to save LMS state" },
      { status: 500 }
    );
  }
}
