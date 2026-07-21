export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type PriceType = "paid" | "free";

export interface Lesson {
  id: string;
  title: string;
  /** Lesson body / notes shown under the video */
  description: string;
  order: number;
  videoId: string | null;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: CourseLevel;
  duration: { hours: number; minutes: number };
  priceType: PriceType;
  /** Regular price in DZD */
  price: number;
  /** Promo / sale price in DZD — null when no promo */
  promoPrice: number | null;
  /** Hidden from public catalog & blocked for new access — not deleted */
  archived: boolean;
  previewVideoId: string | null;
  benefits: string[];
  targetAudience: string[];
  materials: string[];
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  level: CourseLevel;
  duration: { hours: number; minutes: number };
  priceType: PriceType;
  price: number;
  promoPrice: number | null;
  archived: boolean;
  lessonCount: number;
}

export const DEFAULT_COURSE_LIST_PRICE = 4500;

/** Price charged after promo (0 if free). */
export function getEffectivePrice(course: {
  priceType: PriceType;
  price: number;
  promoPrice: number | null;
}): number {
  if (course.priceType === "free") return 0;
  const price = course.price ?? DEFAULT_COURSE_LIST_PRICE;
  const promo = course.promoPrice;
  if (promo != null && promo > 0 && promo < price) return promo;
  return price;
}

export function hasPromo(course: {
  priceType: PriceType;
  price: number;
  promoPrice: number | null;
}): boolean {
  if (course.priceType === "free") return false;
  const price = course.price ?? DEFAULT_COURSE_LIST_PRICE;
  const promo = course.promoPrice;
  return promo != null && promo > 0 && promo < price;
}
