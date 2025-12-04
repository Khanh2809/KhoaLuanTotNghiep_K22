import type { Course } from '../types/course';
import Link from 'next/link';
import CourseCard from './CourseCard';
import { BookOpen } from 'lucide-react';

export default function CourseGrid({ courses }: { courses: Course[] }) {
  const hasData = Array.isArray(courses) && courses.length > 0;

  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
              <BookOpen className="h-4 w-4" />
              Danh mục khóa học
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-white md:text-3xl">Khóa học nổi bật</h2>
            </div>
            <p className="max-w-2xl text-sm text-white/70 md:text-base">
              Gợi ý theo hoạt động gần đây của bạn. Vào học tiếp hoặc bắt đầu thử thách mới.
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
          >
            Xem tất cả
          </Link>
        </div>

        {!hasData ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6 text-white/70">
            Khóa học đang được tải hoặc tạm thời chưa sẵn sàng. Vui lòng thử lại sau.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
