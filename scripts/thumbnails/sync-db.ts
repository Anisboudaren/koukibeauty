/**
 * Point course thumbnails that still use the dead WordPress host
 * at the local files in public/courses/<id>.jpg.
 * Run: npx tsx scripts/thumbnails/sync-db.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, thumbnail: true },
  });
  for (const c of courses) {
    const local = `/courses/${c.id}.jpg`;
    const exists = fs.existsSync(path.join(process.cwd(), "public", local));
    const stale = !c.thumbnail || c.thumbnail.includes("wp-content");
    if (exists && stale) {
      await prisma.course.update({ where: { id: c.id }, data: { thumbnail: local } });
      console.log(`updated ${c.id}: ${c.thumbnail || "(empty)"} -> ${local}`);
    } else {
      console.log(`kept    ${c.id}: ${c.thumbnail}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
