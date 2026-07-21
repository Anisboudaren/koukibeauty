/**
 * Sync full course curriculum from Tutor LMS REST API
 * into local data/courses/*.json files.
 *
 * Docs:
 * - GET /course-contents/{course_id}  → topics + ordered contents
 * - GET /lessons?topic_id={topic_id}  → lessons with video meta
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "data", "courses");

const API_KEY = process.env.TUTOR_API_KEY || "key_2d2b612a3510bc4e1f4f34de4d66b18d";
const API_SECRET =
  process.env.TUTOR_API_SECRET ||
  "secret_9a89cd5032841fbee9e6e88329b3a63eb0936155a8a30685fe11e07148d8cef1";
const BASE_URL = "https://koukibeauty.com/wp-json/tutor/v1";
const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  if (match?.[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

function videoIdFromLesson(lesson) {
  const video = lesson.video;
  if (!video) return null;

  if (Array.isArray(video)) {
    const first = video[0];
    if (!first || typeof first !== "object") return null;
    return (
      extractYouTubeId(first.source_youtube) ||
      extractYouTubeId(first.source_external_url) ||
      extractYouTubeId(first.source) ||
      extractYouTubeId(first.source_embedded) ||
      null
    );
  }

  if (typeof video === "object") {
    return (
      extractYouTubeId(video.source_youtube) ||
      extractYouTubeId(video.source_external_url) ||
      extractYouTubeId(video.source) ||
      null
    );
  }

  return extractYouTubeId(String(video));
}

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiGet(pathSuffix, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}${pathSuffix}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      });
      const body = await res.json();
      return { ok: res.ok, status: res.status, body };
    } catch (error) {
      lastError = error;
      console.log(`  retry ${attempt}/${retries} for ${pathSuffix}`);
      await sleep(1000 * attempt);
    }
  }
  throw lastError;
}

async function fetchLessonsByTopic(topicId) {
  const { ok, body } = await apiGet(`/lessons?topic_id=${topicId}`);
  if (!ok) return [];
  const data = body?.data;
  return Array.isArray(data) ? data : [];
}

function mapLesson(item, order) {
  return {
    id: `lesson-${item.ID || item.id}`,
    title: String(item.post_title || item.title || `درس ${order}`).trim(),
    order,
    videoId: videoIdFromLesson(item),
    thumbnail: item.thumbnail || "",
    content: stripHtml(item.post_content).slice(0, 400),
  };
}

async function buildModules(courseId) {
  const contentsRes = await apiGet(`/course-contents/${courseId}`);
  console.log(`  course-contents -> ${contentsRes.status}`);

  let topics = [];
  if (contentsRes.ok && Array.isArray(contentsRes.body?.data)) {
    topics = contentsRes.body.data;
  } else {
    const topicsRes = await apiGet(`/topics?course_id=${courseId}`);
    console.log(`  topics fallback -> ${topicsRes.status}`);
    if (topicsRes.ok) {
      const data = topicsRes.body?.data;
      topics = Array.isArray(data) ? data : data?.posts || [];
    }
  }

  if (!topics.length) return [];

  const modules = [];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const topicId = topic.id || topic.ID;
    const title = String(
      topic.title || topic.post_title || topic.topic_title || `القسم ${i + 1}`
    ).trim();

    await sleep(250);

    // Prefer lessons endpoint — includes YouTube video meta
    let lessonPosts = await fetchLessonsByTopic(topicId);

    // Fallback to contents from course-contents if lessons endpoint empty
    if (!lessonPosts.length && Array.isArray(topic.contents)) {
      lessonPosts = topic.contents.filter(
        (c) => !c.post_type || c.post_type === "lesson"
      );
    }

    const lessons = lessonPosts.map((item, idx) => mapLesson(item, idx + 1));

    modules.push({
      id: `module-${topicId}`,
      title,
      order: i + 1,
      lessons,
    });

    const withVideo = lessons.filter((l) => l.videoId).length;
    console.log(
      `    topic ${topicId}: ${title.slice(0, 40)} → ${lessons.length} lessons (${withVideo} videos)`
    );
  }

  return modules;
}

function rebuildIndex() {
  const files = fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith(".json") && f !== "index.json");
  const summaries = [];

  for (const file of files) {
    const course = JSON.parse(
      fs.readFileSync(path.join(outDir, file), "utf-8")
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
}

async function syncCourse(courseId) {
  const filePath = path.join(outDir, `${courseId}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`Skip ${courseId}: file missing`);
    return;
  }

  console.log(`\nSyncing course ${courseId}...`);
  const modules = await buildModules(courseId);

  if (!modules.length) {
    console.log("  No curriculum found — keeping existing");
    return;
  }

  const course = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const allLessons = modules.flatMap((m) => m.lessons);
  const firstWithVideo = allLessons.find((l) => l.videoId);

  course.modules = modules.map((m) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessons: m.lessons.map(({ id, title, order, videoId }) => ({
      id,
      title,
      order,
      videoId,
    })),
  }));

  if (firstWithVideo?.videoId) {
    course.previewVideoId = firstWithVideo.videoId;
  }

  // Use real lesson titles as benefits/outline when available
  if (allLessons.length) {
    course.benefits = allLessons.slice(0, 25).map((l) => l.title);
  }

  course.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(course, null, 2), "utf-8");

  const withVideo = allLessons.filter((l) => l.videoId).length;
  console.log(
    `  ✓ Saved ${modules.length} modules, ${allLessons.length} lessons (${withVideo} with video)`
  );
}

const courseIds = fs
  .readdirSync(outDir)
  .filter((f) => /^\d+\.json$/.test(f))
  .map((f) => f.replace(".json", ""));

console.log(`Found ${courseIds.length} courses to sync`);

for (const id of courseIds) {
  await syncCourse(id);
}

rebuildIndex();
console.log("\nDone. index.json rebuilt.");
