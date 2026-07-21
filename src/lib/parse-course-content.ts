export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#038;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractBulletsFromHtml(html: string): string[] {
  const bullets: string[] = [];

  const dirAutoMatches = html.matchAll(/dir="auto"[^>]*>([^<]+)</gi);
  for (const match of dirAutoMatches) {
    const text = match[1].replace(/\s+/g, " ").trim();
    if (text.length > 8) bullets.push(text);
  }

  const liMatches = html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  for (const match of liMatches) {
    const text = stripHtml(match[1]);
    if (text.length > 3) bullets.push(text);
  }

  const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const match of pMatches) {
    const text = stripHtml(match[1]);
    if (text.length > 20 && !text.includes("gtx-trans")) {
      bullets.push(text);
    }
  }

  return [...new Set(bullets)];
}

export function splitLines(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join("\n") : value;
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^WW/, "").trim())
    .filter((line) => line.length > 2);
}

export function levelLabel(level: string): string {
  const map: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };
  return map[level] ?? "مبتدئ";
}

export function formatDuration(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return "مرن";
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  return parts.join(" و ");
}
