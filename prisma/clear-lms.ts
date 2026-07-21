/**
 * Clear students, orders, certificates, enrollments, progress.
 * Leaves courses (and modules/lessons) intact.
 * Run: npx tsx prisma/clear-lms.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const progress = await prisma.lessonProgress.deleteMany();
  const certs = await prisma.certificateOrder.deleteMany();
  const orders = await prisma.courseOrder.deleteMany();
  const enrollments = await prisma.enrollment.deleteMany();
  const students = await prisma.user.deleteMany({ where: { role: "STUDENT" } });

  const courses = await prisma.course.count();
  const users = await prisma.user.count();

  console.log("Cleared LMS data:");
  console.log(`  lesson progress: ${progress.count}`);
  console.log(`  certificate orders: ${certs.count}`);
  console.log(`  course orders: ${orders.count}`);
  console.log(`  enrollments: ${enrollments.count}`);
  console.log(`  students: ${students.count}`);
  console.log(`Kept: ${courses} courses, ${users} users (admin only if present)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
