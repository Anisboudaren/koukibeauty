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
    price: course.price,
    promoPrice: course.promoPrice,
    archived: course.archived,
    previewVideoId: course.previewVideoId,
    benefits: course.benefits,
    targetAudience: course.targetAudience,
    materials: course.materials,
    updatedAt: new Date(),
  };

  await prisma.$transaction(async (tx) => {
    await tx.course.upsert({
      where: { id: course.id },
      create: {
        id: course.id,
        ...data,
        createdAt: course.createdAt
          ? new Date(course.createdAt)
          : new Date(),
      },
      update: data,
    });

    await tx.lesson.deleteMany({
      where: { module: { courseId: course.id } },
    });
    await tx.module.deleteMany({ where: { courseId: course.id } });

    for (const m of course.modules) {
      await tx.module.create({
        data: {
          id: m.id,
          courseId: course.id,
          title: m.title,
          order: m.order,
          lessons: {
            create: m.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              description: l.description ?? "",
              order: l.order,
              videoId: l.videoId,
            })),
          },
        },
      });
    }
  });
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
  for (const module of course.modules) {
    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, module };
  }
  return null;
}

export function getCategories(summaries: CourseSummary[]): string[] {
  return [...new Set(summaries.map((c) => c.category).filter(Boolean))];
}
