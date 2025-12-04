import SectionHero from '@/components/SectionHero';
import CourseGrid from '@/components/CourseGrid';
import { fetchCourses } from '@/lib/api';
import StudentStrip from '@/components/StudentStrip';
import Testimonials from '@/components/Testimonials';
import WhyChooseSelfStudy from '@/components/WhyChooseSelfStudy';

export default async function HomePage() {
  const courses = await fetchCourses();

  return (
    <div className="space-y-16 pb-16 md:space-y-20">
      <SectionHero />
      <div className="space-y-12 md:space-y-16">
        <StudentStrip />
        <CourseGrid courses={courses} />
      </div>
      <WhyChooseSelfStudy />
      <Testimonials />
    </div>
  );
}
