import { HomeHero } from "@/components/home/hero";
import { WelcomeSection } from "@/components/home/welcome";
import { StatsSection } from "@/components/home/stats";
import { CraftGallery } from "@/components/home/craft-gallery";
import { FounderSection } from "@/components/home/founder";
import { FeaturedCourses } from "@/components/home/featured-courses";
import { TestimonialsSection } from "@/components/home/testimonials";
import { FaqSection } from "@/components/home/faq";
import { SiteFooter } from "@/components/home/site-footer";
import { getCourseSummaries } from "@/lib/courses";

export default async function HomePage() {
  const courses = await getCourseSummaries();
  const featured = courses.slice(0, 3);

  return (
    <div className="flex min-h-full flex-col">
      <HomeHero />
      <WelcomeSection />
      <StatsSection />
      <CraftGallery />
      <FounderSection />
      <FeaturedCourses courses={featured} totalCount={courses.length} />
      <TestimonialsSection />
      <FaqSection />
      <SiteFooter />
    </div>
  );
}
