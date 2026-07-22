import { prisma } from "./prisma";
import type { Course, CourseSummary, Lesson, Module } from "./types";
import { DEFAULT_COURSE_LIST_PRICE } from "./types";
import type {
  Course as DbCourse,
  Module as DbModule,
  Lesson as DbLesson,
} from "@/generated/prisma";

type DbCourseFull = DbCourse & {
  modules: (DbModule & { lessons: DbLesson[] })[];
};

function mapLesson(l: DbLesson): Lesson {
  return {
    id: l.id,
    title: l.title,
    description: l.description ?? "",
    order: l.order,
    videoId: l.videoId,
  };
}

function mapModule(m: DbModule & { lessons: DbLesson[] }): Module {
  return {
    id: m.id,
    title: m.title,
    order: m.order,
    lessons: [...m.lessons]
      .sort((a, b) => a.order - b.order)
      .map(mapLesson),
  };
}

function mapCourse(c: DbCourseFull): Course {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    thumbnail: c.thumbnail,
    category: c.category,
    level: c.level,
    duration: {
      hours: c.durationHours,
      minutes: c.durationMinutes,
    },
    priceType: c.priceType,
    price: c.price ?? DEFAULT_COURSE_LIST_PRICE,
    promoPrice: c.promoPrice,
    archived: c.archived,
    previewVideoId: c.previewVideoId,
    benefits: c.benefits ?? [],
    targetAudience: c.targetAudience ?? [],
    materials: c.materials ?? [],
    modules: [...c.modules]
      .sort((a, b) => a.order - b.order)
      .map(mapModule),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toSummary(c: DbCourse & { modules?: { lessons: unknown[] }[] }): CourseSummary {
  const lessonCount =
    c.modules?.reduce((n, m) => n + m.lessons.length, 0) ?? 0;
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    thumbnail: c.thumbnail,
    category: c.category,
    level: c.level,
    duration: {
      hours: c.durationHours,
      minutes: c.durationMinutes,
    },
    priceType: c.priceType,
    price: c.price ?? DEFAULT_COURSE_LIST_PRICE,
    promoPrice: c.promoPrice,
    archived: c.archived,
    lessonCount,
  };
}

const courseInclude = {
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: { orderBy: { order: "asc" as const } },
    },
  },
};

export async function getCourseSummaries(opts?: {
  includeArchived?: boolean;
}): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    where: opts?.includeArchived ? undefined : { archived: false },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return courses.map(toSummary);
}

export async function getCourseById(id: string): Promise<Course | null> {
  const course = await prisma.course.findUnique({
    where: { id },
    include: courseInclude,
  });
  return course ? mapCourse(course) : null;
}

export async function getCourseBySlug(
  slug: string,
  opts?: { includeArchived?: boolean }
): Promise<Course | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: courseInclude,
  });
  if (!course) return null;
  if (course.archived && !opts?.includeArchived) return null;
  return mapCourse(course);
}

export async function getAllCourses(opts?: {
  includeArchived?: boolean;
}): Promise<Course[]> {
  const courses = await prisma.course.findMany({
    where: opts?.includeArchived ? undefined : { archived: false },
    include: courseInclude,
    orderBy: { updatedAt: "desc" },
  });
  return courses.map(mapCourse);
}

export async function saveCourse(course: Course): Promise<void> {
  const data = {
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    category: course.category,
    level: course.level,
    durationHours: course.duration.hours,
    durationMinutes: course.duration.minutes,
    priceType: course.priceType,
    price: Math.round(Number(course.price)) || 0,
    promoPrice:
      course.promoPrice == null
        ? null
        : Math.round(Number(course.promoPrice)) || null,
    archived: course.archived ?? false,
    previewVideoId: course.previewVideoId,
    benefits: course.benefits,
    targetAudience: course.targetAudience,
    materials: course.materials,
    updatedAt: new Date(),
  };

  const existing = await prisma.course.findUnique({
    where: { id: course.id },
    include: courseInclude,
  });

  // Always upsert course metadata first (price, title, archive, …)
  await prisma.course.upsert({
    where: { id: course.id },
    create: {
      id: course.id,
      ...data,
      createdAt: course.createdAt ? new Date(course.createdAt) : new Date(),
    },
    update: data,
  });

  // Skip curriculum rewrite when modules/lessons are unchanged — avoids
  // Neon interactive-transaction timeouts on large programs (price-only edits).
  if (existing && sameCurriculum(mapCourse(existing).modules, course.modules)) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      const dbModules = await tx.module.findMany({
        where: { courseId: course.id },
        include: { lessons: { select: { id: true } } },
      });

      const incomingModuleIds = new Set(course.modules.map((m) => m.id));
      const modulesToRemove = dbModules
        .filter((m) => !incomingModuleIds.has(m.id))
        .map((m) => m.id);
      if (modulesToRemove.length) {
        await tx.module.deleteMany({
          where: { id: { in: modulesToRemove } },
        });
      }

      for (const m of course.modules) {
        await tx.module.upsert({
          where: { id: m.id },
          create: {
            id: m.id,
            courseId: course.id,
            title: m.title,
            order: m.order,
          },
          update: {
            courseId: course.id,
            title: m.title,
            order: m.order,
          },
        });

        const dbLessonIds =
          dbModules.find((x) => x.id === m.id)?.lessons.map((l) => l.id) ??
          (
            await tx.lesson.findMany({
              where: { moduleId: m.id },
              select: { id: true },
            })
          ).map((l) => l.id);

        const incomingLessonIds = new Set(m.lessons.map((l) => l.id));
        const lessonsToRemove = dbLessonIds.filter(
          (id) => !incomingLessonIds.has(id)
        );
        if (lessonsToRemove.length) {
          await tx.lesson.deleteMany({
            where: { id: { in: lessonsToRemove } },
          });
        }

        for (const l of m.lessons) {
          await tx.lesson.upsert({
            where: { id: l.id },
            create: {
              id: l.id,
              moduleId: m.id,
              title: l.title,
              description: l.description ?? "",
              order: l.order,
              videoId: l.videoId,
            },
            update: {
              moduleId: m.id,
              title: l.title,
              description: l.description ?? "",
              order: l.order,
              videoId: l.videoId,
            },
          });
        }
      }
    },
    { maxWait: 15_000, timeout: 60_000 }
  );
}

function sameCurriculum(a: Module[], b: Module[]): boolean {
  const norm = (modules: Module[]) =>
    JSON.stringify(
      [...modules]
        .sort((x, y) => x.order - y.order || x.id.localeCompare(y.id))
        .map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          lessons: [...m.lessons]
            .sort((x, y) => x.order - y.order || x.id.localeCompare(y.id))
            .map((l) => ({
              id: l.id,
              title: l.title,
              description: l.description ?? "",
              order: l.order,
              videoId: l.videoId ?? null,
            })),
        }))
    );
  return norm(a) === norm(b);
}

export async function deleteCourse(id: string): Promise<void> {
  await prisma.course.delete({ where: { id } });
}

export function getAllLessons(course: Course): Lesson[] {
  return course.modules
    .flatMap((m) => m.lessons)
    .sort((a, b) => a.order - b.order);
}

export function findLesson(
  course: Course,
  lessonId: string
): { lesson: Lesson; module: Module } | null {
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, module: mod };
  }
  return null;
}

export function getCategories(summaries: CourseSummary[]): string[] {
  return [...new Set(summaries.map((c) => c.category).filter(Boolean))];
}
