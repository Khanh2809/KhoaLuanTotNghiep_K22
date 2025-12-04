"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/providers/auth-context";
import { fetchMyEnrollments, fetchStudentCourseAnalytics } from "@/lib/api";
import { BookOpen, Heart, Play, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

type EnrollRow = {
  id: number;
  course: { id: number; title: string };
  progressPct?: number;
  updatedAt?: string;
};

type ProgressMap = Record<number, number>;

type EnrollmentWithProgress = EnrollRow & { computedPct: number };

export default function StudentStrip() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<EnrollRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});

  useEffect(() => {
    if (!user || user.role !== "student") return;
    (async () => {
      try {
        setFetching(true);
        const list = await fetchMyEnrollments();
        setRows(list);
      } catch (e: any) {
        setErr(e?.message || "Không tải được danh sách khóa học, thử lại sau.");
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  // Fetch completion rate per course using student analytics as fallback
  useEffect(() => {
    if (!rows.length || !user || user.role !== "student") return;
    (async () => {
      try {
        const entries = await Promise.all(
          rows.map(async (r) => {
            let pct: number | null =
              typeof r.progressPct === "number" ? Math.max(0, Math.min(100, r.progressPct)) : null;
            try {
              const analytics = await fetchStudentCourseAnalytics(Number(r.course.id));
              const rate = analytics?.userCompletion?.completionRate;
              if (rate !== null && rate !== undefined) {
                pct = Math.round(Math.max(0, Math.min(1, rate)) * 100);
              }
            } catch {
              // ignore analytics errors, use enrollment progress
            }
            return [r.course.id, pct] as const;
          })
        );
        const next: ProgressMap = {};
        entries.forEach(([cid, pct]) => {
          if (pct !== null && pct !== undefined) next[cid] = pct;
        });
        setProgressMap(next);
      } catch {
        // ignore
      }
    })();
  }, [rows, user]);

  if (loading) return null;
  if (!user || user.role !== "student") return null;

  const enriched: EnrollmentWithProgress[] = rows.map((r) => {
    const pct = progressMap[r.course.id];
    const fallbackPct = typeof r.progressPct === "number" ? Math.max(0, Math.min(100, r.progressPct)) : 0;
    return { ...r, computedPct: pct ?? fallbackPct };
  });

  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-14">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-black/40 p-6 shadow-2xl backdrop-blur md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Lộ trình của bạn
            </div>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Tiếp tục tiến độ</h2>
            <p className="text-sm text-white/70 md:text-base">Quay lại khóa đã ghi danh, xem streak và học tiếp.</p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
          >
            Khám phá thêm
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {err && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
            <AlertCircle className="h-4 w-4" />
            {err}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-inner">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-white">Đã ghi danh</h3>
              {fetching && <span className="text-xs text-white/60">Đang tải...</span>}
            </div>

            {fetching && (
              <ul className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-white/15" />
                    <div className="mt-2 h-2 w-full animate-pulse rounded bg-white/10" />
                  </li>
                ))}
              </ul>
            )}

            {!fetching && !rows.length && (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-white/70">
                Chưa có khóa học nào. Bắt đầu một lộ trình, tiến độ sẽ hiển thị tại đây.
                <div className="mt-3">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:-translate-y-0.5 hover:shadow"
                  >
                    Xem danh sách
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {!fetching && enriched.length > 0 && (
              <ul className="space-y-3">
                {enriched.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{r.course?.title}</p>
                        {r.updatedAt && (
                          <p className="mt-1 text-xs text-white/60">
                            Cập nhật: {new Date(r.updatedAt).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <Link
                          href={`/courses/${r.course?.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:-translate-y-0.5 hover:shadow"
                          title="Học tiếp"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Học tiếp
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10" aria-label="Tiến độ">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400"
                          style={{ width: `${Math.max(0, Math.min(100, r.computedPct))}%` }}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(r.computedPct)}
                          role="progressbar"
                        />
                      </div>
                      <div className="mt-1 text-right text-xs text-white/60">{Math.round(r.computedPct)}%</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-inner">
            <div className="mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-white/80" />
              <h3 className="font-semibold text-white">Yêu thích</h3>
            </div>
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.04] p-5 text-sm text-white/70">
              Sắp ra mắt: ghim khóa học, lưu bài và đồng bộ đa thiết bị.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
