import Link from "next/link";
import { cookies } from "next/headers";
import { fetchStudentCourseAnalytics } from "@/lib/api";
import SummaryButton from "./SummaryButton";

export const dynamic = "force-dynamic";

type ModuleStat = {
  moduleId: number;
  moduleTitle: string;
  completedLessons: number;
  totalLessons: number;
};

type Recommendation = {
  quizId: number;
  quizTitle?: string | null;
  lessonTitle?: string | null;
  scorePct?: number | null;
};

type StudentAnalyticsResponse = {
  courseId: number;
  courseTitle?: string;
  userCompletion?: {
    completionRate: number;
    completedLessons: number;
    totalLessons: number;
    modules: ModuleStat[];
  };
  classBenchmark?: {
    completionRate?: number | null;
    averageQuizScore?: number | null;
  };
  lowScoreRecommendations?: Recommendation[];
  userQuizAverage?: number | null;
  insight?: { label?: string; reason?: string; level?: string };
};

function pct(num?: number | null) {
  if (num === null || num === undefined) return "0%";
  return `${Math.round(num * 100)}%`;
}

export default async function StudentCourseAnalytics({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  const cookie = (await cookies()).toString();

  let data: StudentAnalyticsResponse | null = null;
  try {
    data = await fetchStudentCourseAnalytics(courseId, cookie);
  } catch {
    data = null;
  }

  const modules = data?.userCompletion?.modules ?? [];
  const completionRate = data?.userCompletion?.completionRate ?? 0;
  const classCompletion = data?.classBenchmark?.completionRate ?? 0;
  const classAverageQuiz = data?.classBenchmark?.averageQuizScore ?? 0;
  const userQuizAverage = data?.userQuizAverage ?? null;
  const recommendations = data?.lowScoreRecommendations ?? [];
  const insight = data?.insight;
  const weakQuizCount = recommendations.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Tiến độ học tập</h1>
          <p className="text-sm text-white/70">
            Khóa #{courseId} {data?.courseTitle ? `- ${data.courseTitle}` : ""}
          </p>
        </div>
        <Link
          href={`/courses/${courseId}`}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:-translate-y-0.5"
        >
          Tiếp tục học
        </Link>
      </div>

      {!data && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Không tải được dữ liệu. Vui lòng thử lại.
        </div>
      )}

      {insight && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
          <div className="text-sm font-semibold text-white">Đánh giá học tập</div>
          <div className="mt-1 text-xs text-white/60">Nhận định nhanh dựa trên thời gian học và quiz</div>
          <div className="mt-3 text-white text-sm font-medium">{insight.label || "--"}</div>
          <div className="text-xs text-white/60">{insight.reason || ""}</div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur space-y-2">
          <div className="text-sm text-white/70">Hoàn thành cá nhân</div>
          <div className="text-2xl font-semibold text-white">{pct(completionRate)}</div>
          <div className="text-xs text-white/60">
            {data?.userCompletion?.completedLessons ?? 0}/{data?.userCompletion?.totalLessons ?? 0} bài
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur space-y-2">
          <div className="text-sm text-white/70">Điểm quiz TB của bạn</div>
          <div className="text-2xl font-semibold text-white">{pct(userQuizAverage)}</div>
          <div className="text-xs text-white/60">Trung bình các quiz bạn đã làm</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur space-y-2">
          <div className="text-sm text-white/70">Quiz cần ôn thêm</div>
          <div className="text-2xl font-semibold text-white">{weakQuizCount}</div>
          <div className="text-xs text-white/60">
            Số quiz có điểm dưới 50% nên xem lại
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Tiến độ từng module</div>
            <div className="text-xs text-white/60">Bài đã hoàn thành / tổng bài</div>
          </div>
        </div>
        {!modules.length ? (
          <div className="text-sm text-white/60">Chưa có module nào.</div>
        ) : (
          <div className="space-y-3">
            {modules.map((m) => {
              const pctVal = m.totalLessons > 0 ? Math.min(1, m.completedLessons / m.totalLessons) : 0;
              return (
                <div key={m.moduleId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span className="truncate">{m.moduleTitle}</span>
                    <span>
                      {m.completedLessons}/{m.totalLessons}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-green-400"
                      style={{ width: `${pctVal * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">So sánh với lớp</div>
            <div className="text-xs text-white/60">Bạn vs. lớp (completion & quiz)</div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-sm text-white/70 mb-1">Completion</div>
            <div className="flex items-center justify-between text-sm text-white">
              <span>Bạn</span>
              <span className="font-semibold">{pct(completionRate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Lớp</span>
              <span className="font-semibold">{pct(classCompletion)}</span>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-sm text-white/70 mb-1">Điểm quiz trung bình</div>
            <div className="flex items-center justify-between text-sm text-white">
              <span>Bạn</span>
              <span className="font-semibold">{pct(userQuizAverage)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Lớp</span>
              <span className="font-semibold">{pct(classAverageQuiz)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-white">Gợi ý ôn tập</div>
            <div className="text-xs text-white/60">
              Quiz có điểm dưới 50% nên xem lại bài/quiz
            </div>
          </div>
        </div>
        {!recommendations.length ? (
          <div className="text-sm text-white/60">Bạn chưa có quiz cần ôn tập thêm.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {recommendations.map((rec) => (
              <div key={rec.quizId} className="py-3">
                <div className="flex items-center justify-between text-sm text-white">
                  <div>
                    <div className="font-semibold">{rec.quizTitle ?? `Quiz ${rec.quizId}`}</div>
                    <div className="text-xs text-white/60">
                      {rec.lessonTitle ? `Bài: ${rec.lessonTitle}` : "Quiz liên quan"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60">Điểm của bạn</div>
                    <div className="font-semibold text-yellow-300">
                      {pct(rec.scorePct ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SummaryButton courseId={courseId} />
    </div>
  );
}
