import Image from 'next/image';
import Link from 'next/link';
import type { Course } from '../types/course';
import { BookOpen, PlayCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function CourseCard({ course }: { course: Course }) {
  const lessonCount =
    (course as any).lessonCount ?? (Array.isArray((course as any).lessons) ? (course as any).lessons.length : 0);
  const level = (course as any).level ?? 'All levels';
  const duration = (course as any).duration ?? 'Tiến độ linh hoạt';
  const category = (course as any).category ?? 'Lộ trình kỹ năng';

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent shadow-xl ring-1 ring-white/5 transition-all hover:-translate-y-1 hover:border-white/25 hover:shadow-2xl"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/15" />
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {category}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-black shadow">
            <PlayCircle className="h-3.5 w-3.5" />
            Xem nhanh
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur">
            <BookOpen className="h-3.5 w-3.5" />
            {lessonCount} bài học
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h3 className="line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-sky-200">
              {course.title}
            </h3>
            {course.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-white/70">{course.description}</p>
            ) : (
              <p className="mt-1 text-sm italic text-white/50">Chưa có mô tả.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">{level}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">{duration}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-white/70">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <BookOpen className="h-4 w-4" />
            {lessonCount} bài học
          </div>
          <div className="inline-flex items-center gap-1 text-sky-200">
            <span className="text-xs font-semibold">Xem chi tiết</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
