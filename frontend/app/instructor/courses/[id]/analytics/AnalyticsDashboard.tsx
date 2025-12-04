"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { issueCertificate } from "@/lib/api";
import { Award, Loader2 } from "lucide-react";

type Insight = {
  userId: number;
  name?: string | null;
  email?: string | null;
  avgScore?: number | null;
  attempts?: number;
  completionRate?: number | null;
  weakQuizCount?: number;
  riskScore?: number;
  riskLevel?: string;
  verdict?: { label?: string; reason?: string; level?: string };
};

type AnalyticsData = {
  performance?: {
    completion?: { completionRate?: number; completedLessons?: number; totalLessons?: number };
    averageQuizScore?: { averageScore?: number; quizCount?: number; perQuizAverage?: any[] };
  };
  perQuizScores?: any[];
  loginsByUser?: Array<{ userId: number; logins: string[] }>;
  perUserStats?: any[];
  userCompletions?: any[];
  insights?: Insight[];
  engagement?: { loginsLast7Days?: number };
  behavior?: { inactiveDays?: number; tabOutCount?: number; pattern?: string };
};

function pct(val?: number | null) {
  if (val === null || val === undefined) return "0%";
  return `${Math.round(val * 100)}%`;
}

function levelClass(level?: string) {
  const map: Record<string, string> = {
    danger: "bg-red-500/20 text-red-200 border-red-400/30",
    warning: "bg-amber-500/20 text-amber-100 border-amber-400/30",
    success: "bg-green-500/20 text-green-100 border-green-400/30",
    info: "bg-blue-500/20 text-blue-100 border-blue-400/30",
  };
  return map[level || "info"] || map.info;
}

function riskClass(level?: string) {
  const map: Record<string, string> = {
    high: "bg-red-500/20 text-red-200 border-red-400/30",
    medium: "bg-amber-500/20 text-amber-100 border-amber-400/30",
    low: "bg-green-500/20 text-green-100 border-green-400/30",
  };
  return map[level || "low"] || map.low;
}

export default function AnalyticsDashboard({ data, courseId }: { data: AnalyticsData; courseId: number }) {
  const completionRate = data?.performance?.completion?.completionRate ?? 0;
  const completedLessons = data?.performance?.completion?.completedLessons ?? 0;
  const totalLessons = data?.performance?.completion?.totalLessons ?? 0;
  const avgQuiz = data?.performance?.averageQuizScore?.averageScore ?? 0;
  const perQuizAvg = data?.performance?.averageQuizScore?.perQuizAverage || [];
  const perQuizScores = data?.perQuizScores || [];

  const loginsByUser: Array<{ userId: number; logins: string[] }> = data?.loginsByUser || [];
  const perUserStats = data?.perUserStats || [];
  const userCompletions = data?.userCompletions || [];
  const insights: Insight[] = data?.insights || [];

  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [showAllCompletion, setShowAllCompletion] = useState(false);
  const [showAllLogins, setShowAllLogins] = useState(false);
  const [showAllBehavior, setShowAllBehavior] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAllQuizScores, setShowAllQuizScores] = useState<Record<number, boolean>>({});
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const quizChart = useMemo(
    () =>
      perQuizAvg.map((q: any) => ({
        id: q.quizId,
        title: q.quizTitle ?? `Quiz ${q.quizId}`,
        value: Math.round((q.averageScore ?? 0) * 100),
        detail: perQuizScores.find((x: any) => x.quizId === q.quizId) || { scores: [] },
      })),
    [perQuizAvg, perQuizScores],
  );

  const completionList = showAllCompletion ? userCompletions : userCompletions.slice(0, 5);
  const avgScoreMap = useMemo(() => {
    const map = new Map<number, number | null>();
    insights.forEach((i) => map.set(i.userId, i.avgScore ?? null));
    return map;
  }, [insights]);
  const [issuing, setIssuing] = useState<Record<number, boolean>>({});
  const [issued, setIssued] = useState<Record<number, string>>({});
  const [issueError, setIssueError] = useState<Record<number, string>>({});
  const loginsList = showAllLogins ? loginsByUser : loginsByUser.slice(0, 5);
  const behaviorList = showAllBehavior ? perUserStats : perUserStats.slice(0, 5);
  const insightsList = showAllInsights ? insights : insights.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard khóa {courseId}</h1>
          <p className="text-sm text-white/70">Tổng hợp chỉ số khóa học</p>
        </div>
        <Link
          href={`/courses/${courseId}`}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:-translate-y-0.5"
        >
          Xem như học viên
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Hoàn thành" value={pct(completionRate)} subtitle={`${completedLessons}/${totalLessons} bài`} />
        <StatCard title="Điểm quiz TB" value={pct(avgQuiz)} subtitle={`Quiz: ${data?.performance?.averageQuizScore?.quizCount ?? 0}`} />
        <StatCard title="Đăng nhập 7 ngày" value={`${data?.engagement?.loginsLast7Days ?? 0}`} subtitle="Lượt đăng nhập" />
        <StatCard title="Inactive / Tab-out" value={`${data?.behavior?.inactiveDays ?? 0} / ${data?.behavior?.tabOutCount ?? 0}`} subtitle={`Pattern: ${data?.behavior?.pattern ?? "N/A"}`} />
      </div>

      {/* Completion chart */}
      <SectionCard title="Tỉ lệ hoàn thành theo học viên" subtitle="Bar chart + bảng chi tiết">
        {!userCompletions.length ? (
          <EmptyState label="Chưa có dữ liệu học viên" />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60 mb-2">Bar chart (responsive) - click để xem chi tiết</div>
              <div className="space-y-2">
                {completionList.map((u: any) => (
                  <BarRow
                    key={u.userId}
                    label={u.name || `User #${u.userId}`}
                    subLabel={u.email || ""}
                    value={Math.round((u.completionRate ?? 0) * 100)}
                  />
                ))}
              </div>
              {userCompletions.length > 5 && (
                <div className="mt-2 text-right">
                  <button
                    className="text-xs text-white/70 underline underline-offset-4 hover:text-white"
                    onClick={() => setShowAllCompletion((p) => !p)}
                  >
                    {showAllCompletion ? "Thu gọn" : "Hiển thị thêm"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Issue certificates */}
      <SectionCard title="Cấp chứng chỉ" subtitle="Giảng viên/ admin cấp tay cho học viên đủ điều kiện">
        {!completionList.length ? (
          <EmptyState label="Chưa có dữ liệu học viên" />
        ) : (
          <div className="space-y-2">
            {completionList.map((u: any) => {
              const completionPct = Math.round((u.completionRate ?? 0) * 100);
              const avgScore = avgScoreMap.get(u.userId) ?? null;
              const eligible = completionPct >= 100 && (avgScore === null || avgScore >= 0.45);
              const busy = issuing[u.userId];
              const doneMsg = issued[u.userId];
              const errMsg = issueError[u.userId];
              return (
                <div key={u.userId} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <div>
                      <div className="font-semibold text-white">{u.name || `User #${u.userId}`}</div>
                      <div className="text-xs text-white/60">{u.email || ""}</div>
                      <div className="text-xs text-white/60">Hoàn thành: {completionPct}% {avgScore !== null ? `| Quiz TB: ${pct(avgScore)}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {eligible && !doneMsg && (
                        <button
                          onClick={async () => {
                            setIssuing((prev) => ({ ...prev, [u.userId]: true }));
                            setIssueError((prev) => ({ ...prev, [u.userId]: '' }));
                            try {
                              await issueCertificate({
                                userId: u.userId,
                                courseId,
                                score: avgScore ? Math.round(avgScore * 100) : undefined,
                                templateName: 'default',
                              });
                              setIssued((prev) => ({ ...prev, [u.userId]: 'Đã cấp' }));
                            } catch (e: any) {
                              setIssueError((prev) => ({ ...prev, [u.userId]: e?.message || 'Thất bại' }));
                            } finally {
                              setIssuing((prev) => ({ ...prev, [u.userId]: false }));
                            }
                          }}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:border-white/40 disabled:opacity-60"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
                          Cấp chứng chỉ
                        </button>
                      )}
                      {doneMsg && <span className="text-emerald-200 text-[11px] font-semibold">{doneMsg}</span>}
                    </div>
                  </div>
                  {errMsg && <div className="mt-1 text-[11px] text-red-300">{errMsg}</div>}
                  {!eligible && <div className="mt-1 text-[11px] text-white/60">Chưa đủ điều kiện (cần 100% tiến độ và quiz ≥ 45%).</div>}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Quiz scores and per-user scores with drill-down */}
      <SectionCard title="Điểm trung bình từng quiz" subtitle="Bar chart (responsive) + drill-down theo quiz">
        {!quizChart.length ? (
          <EmptyState label="Chưa có dữ liệu quiz" />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60 mb-2">Click một quiz để xem chi tiết điểm học viên</div>
              <div className="space-y-2">
                {quizChart.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setExpandedQuizId((prev) => (prev === q.id ? null : q.id))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{q.title}</div>
                        <div className="text-xs text-white/60">Điểm trung bình</div>
                      </div>
                      <div className="text-white font-semibold">{q.value}%</div>
                    </div>
                    <div className="mt-2">
                      <div className="h-2 w-full rounded bg-white/10">
                        <div
                          className="h-2 rounded bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-300"
                          style={{ width: `${Math.min(100, q.value)}%` }}
                        />
                      </div>
                    </div>
                    {expandedQuizId === q.id && (
                      <div className="mt-3 rounded-lg border border-white/10 bg-black/40 p-3">
                        {!q.detail.scores.length ? (
                          <div className="text-xs text-white/60">Chưa có bài nộp.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs text-white/80">
                              <thead>
                                <tr className="border-b border-white/10 text-white/60">
                                  <th className="px-2 py-1">Học viên</th>
                                  <th className="px-2 py-1 text-right">Điểm</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {(showAllQuizScores[q.id] ? q.detail.scores : q.detail.scores.slice(0, 5)).map((s: any) => (
                                  <tr key={`${s.userId}-${q.id}`}>
                                    <td className="px-2 py-1">
                                      <div className="text-white">{s.name || `User #${s.userId}`}</div>
                                      <div className="text-[11px] text-white/50">{s.email || ""}</div>
                                    </td>
                                    <td className="px-2 py-1 text-right">{pct(s.scorePct)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {q.detail.scores.length > 5 && (
                              <div className="mt-2 text-right">
                                <button
                                  className="text-[11px] text-white/70 underline underline-offset-4 hover:text-white"
                                  onClick={() =>
                                    setShowAllQuizScores((prev) => ({
                                      ...prev,
                                      [q.id]: !prev[q.id],
                                    }))
                                  }
                                >
                                  {showAllQuizScores[q.id] ? "Thu gọn" : "Hiển thị thêm"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Logins per user */}
      <SectionCard title="Đăng nhập gần đây (theo học viên)">
        {!loginsByUser.length ? (
          <EmptyState label="Chưa có log đăng nhập" />
        ) : (
          <div className="space-y-3 text-sm text-white/80">
            {loginsList.map((u: any) => (
              <div key={u.userId} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="font-medium text-white">{perUserStats.find((p: any) => p.userId === u.userId)?.name || `User #${u.userId}`}</div>
                <div className="text-xs text-white/50">{u.logins.length} lượt đăng nhập gần đây</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/60">
                  {u.logins.map((t: string, idx: number) => (
                    <span key={`${u.userId}-${idx}`} className="rounded border border-white/10 px-2 py-0.5">
                      {new Date(t).toLocaleString("vi-VN")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {loginsByUser.length > 5 && (
              <div className="text-right">
                <button
                  className="text-xs text-white/70 underline underline-offset-4 hover:text-white"
                  onClick={() => setShowAllLogins((p) => !p)}
                >
                  {showAllLogins ? "Thu gọn" : "Hiển thị thêm"}
                </button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Behavior table */}
      <SectionCard title="Hành vi (tab-out, inactive, thời gian học)">
        {!perUserStats.length ? (
          <EmptyState label="Chưa có dữ liệu" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-white/60">
                  <th className="px-3 py-2">Học viên</th>
                  <th className="px-3 py-2 text-right">Phút tổng</th>
                  <th className="px-3 py-2 text-right">Phút 7 ngày</th>
                  <th className="px-3 py-2 text-right">Tab-out</th>
                  <th className="px-3 py-2 text-right">Inactive days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {behaviorList.map((u: any) => (
                  <tr key={u.userId}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">{u.name || `User #${u.userId}`}</div>
                      <div className="text-xs text-white/50">{u.email || ""}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{u.studyMinutesTotal ?? 0}</td>
                    <td className="px-3 py-2 text-right">{u.studyMinutesLast7Days ?? 0}</td>
                    <td className="px-3 py-2 text-right">{u.tabOutCount ?? 0}</td>
                    <td className="px-3 py-2 text-right">{u.inactiveDays ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {perUserStats.length > 5 && (
              <div className="mt-2 text-right">
                <button
                  className="text-xs text-white/70 underline underline-offset-4 hover:text-white"
                  onClick={() => setShowAllBehavior((p) => !p)}
                >
                  {showAllBehavior ? "Thu gọn" : "Hiển thị thêm"}
                </button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Insights */}
      <SectionCard title="Insights học viên" subtitle="Nhận định dựa trên thời gian học, quiz, tab-out">
        {!insights.length ? (
          <EmptyState label="Chưa có dữ liệu để phân tích" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-white/60">
                  <th className="px-3 py-2">Học viên</th>
                  <th className="px-3 py-2">Quiz (điểm TB)</th>
                  <th className="px-3 py-2">Rủi ro</th>
                  <th className="px-3 py-2 text-right">Quiz yếu (&lt;50%)</th>
                  <th className="px-3 py-2">Nhận định</th>
                  <th className="px-3 py-2">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {insightsList.map((u) => (
                  <tr key={u.userId}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">{u.name || `User #${u.userId}`}</div>
                      <div className="text-xs text-white/50">{u.email || ""}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{pct(u.avgScore)}</div>
                      <div className="text-xs text-white/50">{u.attempts || 0} lần</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${riskClass(u.riskLevel)}`}>
                        {u.riskLevel || "---"}
                      </span>
                      <div className="text-xs text-white/50">Score: {Math.round((u.riskScore ?? 0) * 100)}%</div>
                    </td>
                    <td className="px-3 py-2 text-right">{u.weakQuizCount ?? 0}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${levelClass(u.verdict?.level)}`}>
                        {u.verdict?.label || "---"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-white/70 text-sm">{u.verdict?.reason || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {insights.length > 5 && (
              <div className="mt-2 text-right">
                <button
                  className="text-xs text-white/70 underline underline-offset-4 hover:text-white"
                  onClick={() => setShowAllInsights((p) => !p)}
                >
                  {showAllInsights ? "Thu gọn" : "Hiển thị thêm"}
                </button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Tổng hợp phân tích" subtitle="Tóm tắt ngắn gọn dựa trên các chỉ số hiện có">
        <div className="flex flex-col gap-3">
          <button
            onClick={async () => {
              try {
                setLoadingSummary(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics/summary`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ courseId }),
                });
                const payload = await res.json();
                if (!res.ok) throw new Error(payload?.error || 'Tóm tắt thất bại');
                setSummary(payload.summary || '');
              } catch (e: any) {
                setSummary('');
                alert(e?.message || 'Tóm tắt thất bại');
              } finally {
                setLoadingSummary(false);
              }
            }}
            className="self-start rounded bg-white px-3 py-1.5 text-sm font-semibold text-black hover:-translate-y-0.5 transition disabled:opacity-60"
            disabled={loadingSummary}
          >
            {loadingSummary ? 'Đang tóm tắt...' : 'Tổng hợp phân tích'}
          </button>
          {summary && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 prose prose-invert max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur space-y-2">
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
      <div className="text-xs uppercase text-white/60">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
      {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
    </div>
  );
}

function BarRow({ label, subLabel, value }: { label: string; subLabel?: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-white/70">
        <div className="truncate">
          <div className="font-semibold text-white">{label}</div>
          {subLabel && <div className="text-white/60">{subLabel}</div>}
        </div>
        <div className="font-semibold text-white">{Math.min(100, Math.max(0, value))}%</div>
      </div>
      <div className="h-2 w-full rounded bg-white/10">
        <div
          className="h-2 rounded bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-sm text-white/60">{label}</div>;
}
