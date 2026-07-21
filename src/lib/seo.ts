/** Site-wide SEO / brand constants */
export const SITE_NAME = "koukibeauty academy";
export const SITE_NAME_AR = "أكاديمية كوكي بيوتي";
export const SITE_TAGLINE =
  "منصة تعليمية متخصصة في الجمال والعناية بالشعر والمكياج";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://koukibeauty.com";

export const SITE_LOCALE = "ar_DZ";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
