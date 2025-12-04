// app/courses/page.tsx
import { Suspense } from 'react';
import CoursesFilterSection from '@/components/CoursesFilterSection';
import CourseList from '@/components/CourseList';

export default async function CoursesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold">Danh sách khóa học</h1>
      </div>

      <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-4 text-sm text-white/70">Loading filters...</div>}>
        <CoursesFilterSection />
      </Suspense>
      <Suspense fallback={<div className="mx-auto max-w-6xl px-4 pb-8 text-sm text-white/70">Loading courses...</div>}>
        <CourseList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
