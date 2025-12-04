import Link from 'next/link';
import { cookies } from 'next/headers';
import { fetchStudentCourseAnalytics } from '@/lib/api';
import { fetchLessonDetailServer, fetchCourseOutlineServer } from '@/lib/api-server';
import LessonContent from '@/components/LessonContent';
import CourseOutlineSidebar from '@/components/CourseOutlineSidebar';
import LessonQA from '@/components/LessonQA';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lessonId = Number(id);
  const lesson = await fetchLessonDetailServer(lessonId);
  const outline = lesson.course?.id
    ? await fetchCourseOutlineServer(Number(lesson.course.id))
    : null;

  const flat: { id: number; title: string; quizId?: number | null }[] = [];
  outline?.modules?.forEach((m: any) =>
    m.lessons?.forEach((ls: any) =>
      flat.push({ id: ls.id, title: ls.title, quizId: ls.quizId ?? ls.quiz?.id ?? null })
    )
  );
  const idx = flat.findIndex((x) => x.id === lessonId);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  const quizIdForLesson =
    (lesson as any)?.quiz?.id ??
    (lesson as any)?.quizId ??
    flat[idx]?.quizId ??
    null;

  let completedLessonIds: number[] = [];
  if (lesson.course?.id) {
    try {
      const cookieHeader = (await cookies()).toString();
      const analytics = await fetchStudentCourseAnalytics(Number(lesson.course.id), cookieHeader);
      completedLessonIds = Array.isArray(analytics?.completedLessonIds) ? analytics.completedLessonIds : [];
    } catch {
      completedLessonIds = [];
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-20">
          <CourseOutlineSidebar
            outline={outline}
            currentLessonId={lessonId}
            completedLessonIds={completedLessonIds}
          />
        </aside>

        <main className="flex-1 space-y-6">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <BookOpen className="h-3.5 w-3.5" />
                  <Link href={`/courses/${lesson.course?.id ?? ''}`} className="hover:underline">
                    {lesson.course?.title ?? 'Khoá học'}
                  </Link>
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold text-white">{lesson.title}</h1>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                {prev && (
                  <Link
                    href={`/lessons/${prev.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
                    title={prev.title}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Link>
                )}
                {next && (
                  <Link
                    href={`/lessons/${next.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:-translate-y-0.5"
                    title={next.title}
                  >
                    Tiếp
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <LessonContent
            lesson={{
              ...lesson,
              progress: lesson.progress ?? { isCompleted: false },
            }}
          />

          <LessonQA lessonId={lessonId} />

          {quizIdForLesson && (
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">Bài học này có Quiz. Bạn muốn luyện tập ngay?</div>
                <Link
                  href={`/courses/${lesson.course?.id}/quizzes/${quizIdForLesson}`}
                  className="rounded bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:-translate-y-0.5"
                >
                  Làm Quiz
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div>
              {prev && (
                <Link
                  href={`/lessons/${prev.id}`}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
                >
                  ← {prev.title}
                </Link>
              )}
            </div>
            <div>
              {next && (
                <Link
                  href={`/lessons/${next.id}`}
                  className="rounded-md bg-white px-3 py-1.5 text-sm text-black transition hover:-translate-y-0.5"
                >
                  Tiếp theo: {next.title} →
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
