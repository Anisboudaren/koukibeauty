/**
 * Seed Neon DB from filesystem course JSON + demo LMS users/orders.
 * Run: npx prisma db seed
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const DATA_DIR = path.join(process.cwd(), "data", "courses");
const DEFAULT_PRICE = 4500;

function hashPassword(password: string) {
  return createHash("sha256").update(`kouki:${password}`).digest("hex");
}

function parseDate(value: string | undefined): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

type JsonLesson = {
  id: string;
  title: string;
  description?: string;
  order: number;
  videoId: string | null;
};

type JsonModule = {
  id: string;
  title: string;
  order: number;
  lessons: JsonLesson[];
};

type JsonCourse = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  duration?: { hours: number; minutes: number };
  priceType?: "paid" | "free";
  price?: number;
  promoPrice?: number | null;
  archived?: boolean;
  previewVideoId?: string | null;
  benefits?: string[];
  targetAudience?: string[];
  materials?: string[];
  modules?: JsonModule[];
  createdAt?: string;
  updatedAt?: string;
};

async function loadCourseFiles(): Promise<JsonCourse[]> {
  const files = await fs.readdir(DATA_DIR);
  const courses: JsonCourse[] = [];
  for (const file of files) {
    if (file === "index.json" || !file.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    courses.push(JSON.parse(raw) as JsonCourse);
  }
  return courses;
}

async function seedCourses() {
  const courses = await loadCourseFiles();
  console.log(`Seeding ${courses.length} courses…`);

  for (const c of courses) {
    await prisma.course.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug || `course-${c.id}`,
        title: c.title,
        description: c.description ?? "",
        thumbnail: c.thumbnail ?? "",
        category: c.category ?? "عام",
        level: c.level ?? "beginner",
        durationHours: c.duration?.hours ?? 0,
        durationMinutes: c.duration?.minutes ?? 0,
        priceType: c.priceType ?? "paid",
        price: c.price ?? DEFAULT_PRICE,
        promoPrice: c.promoPrice ?? null,
        archived: c.archived ?? false,
        previewVideoId: c.previewVideoId ?? null,
        benefits: c.benefits ?? [],
        targetAudience: c.targetAudience ?? [],
        materials: c.materials ?? [],
        createdAt: parseDate(c.createdAt),
        updatedAt: parseDate(c.updatedAt),
      },
      update: {
        slug: c.slug || `course-${c.id}`,
        title: c.title,
        description: c.description ?? "",
        thumbnail: c.thumbnail ?? "",
        category: c.category ?? "عام",
        level: c.level ?? "beginner",
        durationHours: c.duration?.hours ?? 0,
        durationMinutes: c.duration?.minutes ?? 0,
        priceType: c.priceType ?? "paid",
        price: c.price ?? DEFAULT_PRICE,
        promoPrice: c.promoPrice ?? null,
        archived: c.archived ?? false,
        previewVideoId: c.previewVideoId ?? null,
        benefits: c.benefits ?? [],
        targetAudience: c.targetAudience ?? [],
        materials: c.materials ?? [],
        updatedAt: parseDate(c.updatedAt),
      },
    });

    await prisma.lessonProgress.deleteMany({
      where: { courseId: c.id },
    });
    await prisma.lesson.deleteMany({
      where: { module: { courseId: c.id } },
    });
    await prisma.module.deleteMany({ where: { courseId: c.id } });

    for (const m of c.modules ?? []) {
      await prisma.module.create({
        data: {
          id: m.id,
          courseId: c.id,
          title: m.title,
          order: m.order,
          lessons: {
            create: (m.lessons ?? []).map((l) => ({
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

    console.log(`  ✓ ${c.id} — ${c.title}`);
  }
}

async function seedAdminOnly() {
  console.log("Ensuring Kouki super admin…");

  // Remove legacy demo admin if present
  await prisma.user.deleteMany({
    where: {
      role: "ADMIN",
      OR: [{ email: "admin@kouki.dz" }, { phone: "0000000000" }],
      NOT: { email: "kouki@kouki.dz" },
    },
  });

  const password = "KoukiBeauty#2026";
  const admin = await prisma.user.upsert({
    where: { email: "kouki@kouki.dz" },
    create: {
      id: "user_kouki",
      fullName: "Kouki",
      phone: "0555000001",
      email: "kouki@kouki.dz",
      whatsapp: "0555000001",
      wilaya: "16",
      passwordHash: hashPassword(password),
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {
      fullName: "Kouki",
      passwordHash: hashPassword(password),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`  ✓ super admin ${admin.fullName} <${admin.email}>`);
  console.log(`  ✓ login: kouki  /  ${password}`);
}

async function main() {
  await seedCourses();
  await seedAdminOnly();
  console.log("\nSeed complete (courses + Kouki admin).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
