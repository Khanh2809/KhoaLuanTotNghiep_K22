"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, ShieldCheck, Clock, LineChart, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/providers/auth-context";
import { fetchCourseOutline, fetchMyEnrollments, fetchStudentCourseAnalytics } from "@/lib/api";

const stats = [
  { label: "Học viên hoạt động", value: "100+" },
  { label: "Tiến độ tuần", value: "76%" },
  { label: "Phiên học mỗi tuần", value: "140+" },
];

const highlights = [
  {
    icon: <ShieldCheck className="h-4 w-4 text-emerald-300" />,
    title: "Không gian an toàn",
    desc: "Phiên học bảo mật, giảng viên được kiểm duyệt, dữ liệu riêng tư.",
  },
  {
    icon: <Clock className="h-4 w-4 text-sky-300" />,
    title: "Tiến độ theo nhịp riêng",
    desc: "Bài ngắn, tạm dừng/tiếp tục linh hoạt, nhắc nhẹ đúng lúc.",
  },
  {
    icon: <LineChart className="h-4 w-4 text-indigo-300" />,
    title: "Nhìn thấy rõ tiến trình",
    desc: "Mốc kiểm tra, streak, phản hồi quiz tức thì theo từng bài.",
  },
];

type EnrollRow = {
  id: number;
  course: { id: number; title: string };
  progressPct?: number;
  updatedAt?: string;
};

type TopProgress = {
  title: string;
  pct: number;
  courseId: number;
  nextLessonTitle?: string | null;
  pendingQuizzes?: number | null;
  completedLessons?: number | null;
  totalLessons?: number | null;
  lastAccessedAt?: number | null;
  updatedAt?: string | null;
} | null;

export default function SectionHero() {
  const { user } = useAuth();
  const [topProgress, setTopProgress] = useState<TopProgress>(null);
  const isStudent = user?.role === "student";

  function extractLessonsFromAnalytics(analytics: any) {
    const candidates: Array<{ title: string; order: number; isCompleted?: boolean; hasQuiz?: boolean; quizCompleted?: boolean }> = [];
    const pushLessons = (lessons?: any[]) => {
      (lessons ?? []).forEach((ls: any, idx: number) => {
        if (!ls) return;
        const status = ls.status || ls.completionStatus || ls.progressStatus;
        const isCompleted =
          ls.isCompleted === true ||
          ls.completed === true ||
          status === "COMPLETED" ||
          status === "DONE" ||
          status === "FINISHED";
        const hasQuiz = !!(ls.quizId || ls.quiz || ls.hasQuiz || (ls.quizzes && ls.quizzes.length));
        const quizCompleted =
          ls.quizCompleted === true ||
          ls.quizStatus === "COMPLETED" ||
          ls.quizDone === true ||
          ls.quizProgress === "DONE";
        candidates.push({
          title: ls.title || ls.name || `Bài ${idx + 1}`,
          order: ls.order ?? idx,
          isCompleted,
          hasQuiz,
          quizCompleted,
        });
      });
    };

    pushLessons(analytics?.lessons);
    pushLessons(analytics?.userLessons);
    pushLessons(analytics?.userCompletion?.lessons);
    if (Array.isArray(analytics?.modules)) {
      analytics.modules.forEach((m: any) => pushLessons(m?.lessons));
    }
    if (Array.isArray(analytics?.userCompletion?.modules)) {
      analytics.userCompletion.modules.forEach((m: any) => pushLessons(m?.lessons));
    }
    return candidates.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  useEffect(() => {
    if (!isStudent) return;
    (async () => {
      try {
        const enrolls: EnrollRow[] = await fetchMyEnrollments();
        const entries = await Promise.all(
          enrolls.map(async (r) => {
            let pct = typeof r.progressPct === "number" ? Math.max(0, Math.min(100, r.progressPct)) : null;
            let nextLessonTitle: string | null = null;
            let pendingQuizzes: number | null = null;
            let completedLessons: number | null = null;
            let totalLessons: number | null = null;
            let analytics: any = null;
            try {
              analytics = await fetchStudentCourseAnalytics(Number(r.course.id));
              const rate = analytics?.userCompletion?.completionRate;
              if (rate !== null && rate !== undefined) {
                pct = Math.round(Math.max(0, Math.min(1, rate)) * 100);
              }
              completedLessons = analytics?.userCompletion?.completedLessons ?? null;
              totalLessons = analytics?.userCompletion?.totalLessons ?? null;
              nextLessonTitle =
                analytics?.nextLesson?.title ??
                analytics?.nextLessonTitle ??
                analytics?.nextLesson?.name ??
                null;
              const pending =
                analytics?.pendingQuizzes ??
                analytics?.userCompletion?.pendingQuizzes ??
                analytics?.uncompletedQuizzes ??
                analytics?.remainingQuizzes ??
                analytics?.todoQuizzes ??
                analytics?.pendingQuizCount ??
                analytics?.quizTodoCount ??
                analytics?.notStartedQuizzes ??
                null;
              const lastAccessedAt = analytics?.lastAccessedAt ? Date.parse(analytics.lastAccessedAt) : null;

              if (typeof pending === "number" && Number.isFinite(pending)) {
                pendingQuizzes = Math.max(0, Math.round(pending));
              }

              const lessonCandidates = extractLessonsFromAnalytics(analytics);

              if (!nextLessonTitle && lessonCandidates.length) {
                const lastDoneIdx = lessonCandidates.reduce((acc, ls, idx) => (ls.isCompleted ? idx : acc), -1);
                const nextIdx =
                  lessonCandidates.findIndex((ls, idx) => idx > lastDoneIdx && ls.isCompleted !== true) ?? -1;
                const picked =
                  (nextIdx >= 0 ? lessonCandidates[nextIdx] : null) ||
                  lessonCandidates.find((ls) => ls.isCompleted !== true);
                nextLessonTitle = picked?.title ?? null;
              }

              if (pendingQuizzes === null && lessonCandidates.length) {
                const count = lessonCandidates.filter((ls) => ls.hasQuiz && !ls.quizCompleted).length;
                pendingQuizzes = count;
              }

              if (pendingQuizzes === null && Array.isArray(analytics?.lowScoreRecommendations)) {
                pendingQuizzes = analytics.lowScoreRecommendations.length;
              }
            } catch {
              // ignore analytic errors, fallback to enrollment pct
            }
            if (!nextLessonTitle && totalLessons !== null) {
              if (completedLessons !== null && completedLessons < totalLessons) {
                nextLessonTitle = `Bài ${completedLessons + 1}`;
              } else if (totalLessons > 0) {
                nextLessonTitle = "Ôn tập & quiz";
              }
            }
            return {
              title: r.course.title,
              pct: pct ?? 0,
              courseId: Number(r.course.id),
              nextLessonTitle,
              pendingQuizzes,
              completedLessons,
              totalLessons,
              lastAccessedAt: analytics?.lastAccessedAt ? Date.parse(analytics.lastAccessedAt) : null,
              updatedAt: r.updatedAt ?? null,
            };
          })
        );
        const best = entries.reduce<TopProgress>((acc, cur) => {
          if (!acc) return cur;
          const curTs =
            cur.lastAccessedAt && Number.isFinite(cur.lastAccessedAt)
              ? cur.lastAccessedAt
              : cur.updatedAt
              ? Date.parse(cur.updatedAt)
              : null;
          const accTs =
            acc.lastAccessedAt && Number.isFinite(acc.lastAccessedAt)
              ? acc.lastAccessedAt
              : acc.updatedAt
              ? Date.parse(acc.updatedAt)
              : null;
          if (curTs !== null && accTs !== null) return curTs > accTs ? cur : acc;
          if (curTs !== null) return cur;
          if (accTs !== null) return acc;
          return cur.pct > acc.pct ? cur : acc;
        }, null);
        setTopProgress(best);
      } catch {
        setTopProgress(null);
      }
    })();
  }, [isStudent]);

  const heroProgress = useMemo(() => {
    if (!isStudent) return null;
    const value = topProgress?.pct ?? 72;
    return Math.max(0, Math.min(100, value));
  }, [topProgress, isStudent]);

  // Resolve next lesson title from course outline if backend analytics doesn't include it
  useEffect(() => {
    const shouldResolve =
      isStudent &&
      topProgress &&
      (!topProgress.nextLessonTitle || topProgress.nextLessonTitle.startsWith("Bài ")) &&
      topProgress.totalLessons &&
      topProgress.totalLessons > 0;
    if (!shouldResolve) return;
    const run = async () => {
      try {
        const outline: any = await fetchCourseOutline(topProgress.courseId);
        const modules: any[] = outline?.modules ?? [];
        const lessons = modules
          .map((m, idx) => ({
            moduleOrder: m.order ?? idx,
            lessons: [...(m.lessons ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          }))
          .sort((a, b) => (a.moduleOrder ?? 0) - (b.moduleOrder ?? 0))
          .flatMap((m) =>
            m.lessons.map((ls: any, lessonIdx: number) => ({
              title: ls.title,
              lessonOrder: ls.order ?? lessonIdx,
              moduleOrder: m.moduleOrder ?? 0,
            }))
          )
          .sort((a, b) => {
            const moduleOrderDiff = (a.moduleOrder ?? 0) - (b.moduleOrder ?? 0);
            if (moduleOrderDiff !== 0) return moduleOrderDiff;
            return (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0);
          });
        if (!lessons.length) return;
        const completed = topProgress.completedLessons ?? 0;
        const idx = Math.min(Math.max(0, completed), lessons.length - 1);
        const resolved = lessons[idx]?.title;
        if (resolved) {
          setTopProgress((prev) => (prev ? { ...prev, nextLessonTitle: resolved } : prev));
        }
      } catch {
        // ignore errors; keep fallback
      }
    };
    run();
  }, [isStudent, topProgress]);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Lộ trình cá nhân kèm tiến độ thời gian thực</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Không gian học tập{" "}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                thân thiện và dễ sử dụng
              </span>
            </h1>

            <p className="max-w-2xl text-base text-white/70 md:text-lg">
              Lộ trình gợi ý, nhắc học thông minh và gợi ý giúp bạn đi tiếp. Mỗi bài học, quiz và recap đều được thống kê rõ ràng, chi tiết.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/courses"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              >
                Xem khóa học
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 active:translate-y-0"
              >
                Bắt đầu miễn phí
                <PlayCircle className="h-4 w-4" />
              </Link>

              <div className="flex items-center gap-2 text-xs text-white/70">
                <ShieldCheck className="h-4 w-4" />
                <span>Bảo mật, ưu tiên người học</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_1px_0_rgba(255,255,255,0.08)] backdrop-blur"
                >
                  <p className="text-2xl font-semibold tracking-tight text-white">{item.value}</p>
                  <p className="mt-1 text-xs uppercase text-white/60">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-4 backdrop-blur transition hover:border-white/25 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                      {item.icon}
                    </span>
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {isStudent && heroProgress !== null ? (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur"
          >
            <div className="absolute -top-20 -right-10 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-8 h-60 w-60 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative space-y-4">
              {isStudent && heroProgress !== null ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-white/60">Tiến độ trực tiếp</p>
                      <p className="text-lg font-semibold text-white">Chặng hôm nay</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đồng bộ
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60 p-4 shadow-inner backdrop-blur">
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span className="truncate">{topProgress?.title || "Khoá học đang theo"}</span>
                      <span className="text-xs text-white/60">{heroProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-label="Tiến độ cao nhất">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400"
                        style={{ width: `${heroProgress}%` }}
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Streak duy trì</span>
                      <span>12 ngày</span>
                    </div>
                  </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between text-sm text-white/80">
                        <span>Bài tiếp theo</span>
                        <Clock className="h-4 w-4 text-white/60" />
                      </div>
                      <p className="mt-2 text-white">{topProgress?.nextLessonTitle || "Mở khóa học để tiếp tục"}</p>
                      <p className="text-xs text-white/60">Tiếp tục ngay trong khóa</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between text-sm text-white/80">
                        <span>Số bài tập chưa làm</span>
                        <ArrowRight className="h-4 w-4 text-white/60" />
                      </div>
                      <p className="mt-2 text-white">
                        {typeof topProgress?.pendingQuizzes === "number" ? `${topProgress.pendingQuizzes} bài` : "0 bài"}
                      </p>
                      <p className="text-xs text-white/60">Trong các bài đã hoàn thành</p>
                    </div>
                    </div>

                  <Link
                    href={`/courses/${topProgress?.courseId ?? ""}`}
                    className="block rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-white/10 p-4 text-center text-sm font-semibold text-white transition hover:border-white/25 hover:shadow-lg"
                  >
                    Đi tới khóa học
                  </Link>
                </>
              ) : null}
            </div>
          </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
