import { revalidatePath } from "next/cache";

/** Bust public course pages after admin create/update/delete. */
export function revalidateCoursePages(slug?: string) {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/courses/${slug}`);
  }
}
