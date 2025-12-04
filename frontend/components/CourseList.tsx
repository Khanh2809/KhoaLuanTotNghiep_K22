import CourseCard from '@/components/CourseCard';
import { fetchCoursesByQuery } from '@/lib/api';
import type { Course } from '@/types/course';

export default async function CourseList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams; // ✅ await trước khi dùng

  const q = sp.q ?? null;
  const cat = sp.cat ?? null;
  const level = sp.level ?? null;
  const sort = (sp.sort as 'recent' | 'rating' | 'popular' | undefined) ?? 'popular';
  const page = sp.page ?? '1';

  const { items } = await fetchCoursesByQuery({ q, cat, level, sort, page, pageSize: '12' });
  const list: Course[] = items;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}
