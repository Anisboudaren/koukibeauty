import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "..", "courses.json");
const outDir = path.join(root, "data", "courses");

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBulletsFromHtml(html) {
  const bullets = [];
  for (const match of html.matchAll(/dir="auto"[^>]*>([^<]+)</gi)) {
    const text = match[1].replace(/\s+/g, " ").trim();
    if (text.length > 8) bullets.push(text);
  }
  for (const match of html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = stripHtml(match[1]);
    if (text.length > 3) bullets.push(text);
  }
  return [...new Set(bullets)];
}

function splitLines(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join("\n") : value;
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^WW/, "").trim())
    .filter((line) => line.length > 2);
}

function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function transformPost(post) {
  const info = post.additional_info ?? {};
  const durationRaw = info.course_duration?.[0] ?? { hours: "0", minutes: "0" };
  const videoObj = info.video?.[0];
  const videoUrl =
    videoObj?.source_youtube || videoObj?.source_external_url || null;
  const previewVideoId = extractYouTubeId(videoUrl);

  const benefits = splitLines(info.course_benefits);
  const htmlBullets = extractBulletsFromHtml(post.post_content ?? "");
  const outline = [...new Set([...benefits, ...htmlBullets])];

  const lessonTitles =
    outline.length > 0
      ? outline
      : ["مقدمة الدورة", "محتوى الدورة", "الختام والتطبيق"];

  const lessons = lessonTitles.map((title, index) => ({
    id: `lesson-${index + 1}`,
    title: index === 0 ? "مقدمة الدورة" : title,
    order: index + 1,
    videoId: index === 0 ? previewVideoId : null,
  }));

  const id = String(post.ID);
  const description = stripHtml(post.post_content ?? "").slice(0, 600);

  return {
    id,
    slug: `course-${id}`,
    title: post.post_title,
    description: description || post.post_title,
    thumbnail: post.thumbnail_url ?? "",
    category: post.course_category?.[0]?.name ?? "عام",
    level: info.course_level?.[0] ?? "beginner",
    duration: {
      hours: parseInt(durationRaw.hours || "0", 10) || 0,
      minutes: parseInt(durationRaw.minutes || "0", 10) || 0,
    },
    priceType: info.course_price_type?.[0] ?? "paid",
    previewVideoId,
    benefits,
    targetAudience: splitLines(info.course_target_audience),
    materials: splitLines(info.course_material_includes),
    modules: [
      {
        id: "module-1",
        title: "محتوى الدورة",
        order: 1,
        lessons,
      },
    ],
    createdAt: post.post_date ?? new Date().toISOString(),
    updatedAt: post.post_modified ?? new Date().toISOString(),
  };
}

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
const posts = raw.data?.posts ?? [];

fs.mkdirSync(outDir, { recursive: true });

const summaries = [];

for (const post of posts) {
  const course = transformPost(post);
  fs.writeFileSync(
    path.join(outDir, `${course.id}.json`),
    JSON.stringify(course, null, 2),
    "utf-8"
  );

  summaries.push({
    id: course.id,
    slug: course.slug,
    title: course.title,
    thumbnail: course.thumbnail,
    category: course.category,
    level: course.level,
    duration: course.duration,
    priceType: course.priceType,
    lessonCount: course.modules.reduce((n, m) => n + m.lessons.length, 0),
  });
}

fs.writeFileSync(
  path.join(outDir, "index.json"),
  JSON.stringify(summaries, null, 2),
  "utf-8"
);

console.log(`Migrated ${summaries.length} courses to ${outDir}`);
