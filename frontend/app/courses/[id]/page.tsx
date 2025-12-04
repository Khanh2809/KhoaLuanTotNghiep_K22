import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { fetchCourseDetail, fetchStudentCourseAnalytics } from "@/lib/api";
import { fetchEnrollmentStatusServer } from "@/lib/api-server";
import CourseCTA from "@/components/CourseCTA";
import CourseModules from "@/components/CourseModules";
import CourseReviews from "@/components/CourseReviews";
import StudentCertificateActions from "@/components/StudentCertificateActions";
import { Star, GraduationCap, BookOpen, FolderOpen, LayoutDashboard } from "lucide-react";

export const revalidate = 60;

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);

  const cookieHeader = (await cookies()).toString();
  const course = await fetchCourseDetail(courseId, cookieHeader);
  const enrolled = typeof course.enrolled === "boolean"
    ? course.enrolled
    : await fetchEnrollmentStatusServer(courseId);
  let analytics: any = null;

  if (enrolled) {
    try {
      analytics = await fetchStudentCourseAnalytics(courseId, cookieHeader);
    } catch {
      analytics = null;
    }
  }

  const completedLessonIds: number[] = Array.isArray(analytics?.completedLessonIds) ? analytics.completedLessonIds : [];
  const completionRate: number | null = analytics?.userCompletion?.completionRate ?? null;
  const quizAvg: number | null = typeof analytics?.userQuizAverage === "number" ? analytics.userQuizAverage : null;
  const firstLessonId = course.modules?.[0]?.lessons?.[0]?.id;

  const lessonTotal = Array.isArray(course.modules)
    ? course.modules.reduce((sum: number, m: any) => sum + (m?.lessons?.length ?? 0), 0)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header / Hero */}
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        {/* Left: Title, meta, description, CTA */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-5">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {course.title}
          </h1>

          {/* Meta badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/80">
              <FolderOpen className="h-3.5 w-3.5" />
              {course.category ?? "Chua phan loai"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/80">
              <GraduationCap className="h-3.5 w-3.5" />
              Giang vien: {course.instructor ?? "Chua ro"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/80">
              <BookOpen className="h-3.5 w-3.5" />
              {lessonTotal} bai hoc
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/80">
              <Star className="h-3.5 w-3.5" />
              {(course.rating ?? 0).toFixed(1)}
            </span>
          </div>

          {/* Description */}
          {course.description && (
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              {course.description}
            </p>
          )}

          {enrolled && (
            <div className="mt-4">
              <StudentCertificateActions courseId={courseId} completionRate={completionRate} quizAvg={quizAvg} />
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <CourseCTA
                courseId={courseId}
                firstLessonId={firstLessonId}
                defaultEnrolled={enrolled}
              />
              <Link
                href="/courses"
                className="text-sm text-white/80 underline-offset-4 hover:underline"
              >
                Quay lai danh sach
              </Link>
            </div>
            {enrolled && (
              <Link
                href={`/student/courses/${courseId}/analytics`}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white text-black px-4 py-2 text-sm font-semibold shadow-md transition hover:-translate-y-0.5 active:translate-y-0 md:self-auto"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard cua toi
              </Link>
            )}
          </div>
        </div>

        {/* Right: Video/thumbnail card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
          <div className="relative aspect-video w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-purple-500/15" />
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                width={800}
                height={450}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                Chua co anh minh hoa
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs text-white/70">
            <span>Khoa hoc truc tuyen</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {(course.rating ?? 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Modules & Lessons */}
      <div className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-white">Noi dung khoa hoc</h2>

        <CourseModules
          courseId={courseId}
          modules={Array.isArray(course.modules) ? course.modules : []}
          enrolled={enrolled}
          completedLessonIds={completedLessonIds}
        />
      </div>

      {/* Reviews */}
      <CourseReviews courseId={courseId} enrolled={enrolled} />
    </div>
  );
}
