'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchQuizSubmission } from '@/lib/api';

export default function QuizResultPage() {
  const params = useSearchParams();
  const fallbackScore = Number(params.get('score') ?? 0);
  const fallbackTotal = Number(params.get('total') ?? 0);
  const submissionId = params.get('submissionId');
  const percentParam = params.get('percent');
  const tabOutsParam = params.get('tabOuts');
  const timeParam = params.get('time');

  const [score, setScore] = useState(fallbackScore);
  const [total, setTotal] = useState(fallbackTotal);
  const [loading, setLoading] = useState<boolean>(!!submissionId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchQuizSubmission(Number(submissionId));
        if (!cancelled) {
          setScore(data.score ?? fallbackScore);
          setTotal(data.total ?? fallbackTotal);
          setError('');
        }
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || 'Không tải được kết quả. Hiện thị điểm tạm thời.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId, fallbackScore, fallbackTotal]);

  const courseId = params.get('courseId');
  const quizId = params.get('quizId');
  const percent =
    percentParam ? Number(percentParam) : total ? Math.round((score / total) * 100) : 0;
  const tabOuts = tabOutsParam ? Number(tabOutsParam) : null;
  const timeSeconds = timeParam ? Number(timeParam) : null;

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <div className="p-10 text-center text-white space-y-6">
      <div>
        <h1 className="mb-4 text-3xl font-bold">Kết quả Quiz</h1>
        {loading ? (
          <p className="text-white/70">Đang tải kết quả...</p>
        ) : (
          <>
            <p className="text-xl">
              Bạn đạt <span className="text-green-400 font-semibold">{score}</span> / {total} điểm
            </p>
            <p className="text-lg text-white/80 mt-1">
              Tỷ lệ: <span className="font-semibold text-white">{percent}%</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
              {typeof tabOuts === 'number' && !Number.isNaN(tabOuts) && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Tab out: {tabOuts} lần
                </span>
              )}
              {typeof timeSeconds === 'number' && !Number.isNaN(timeSeconds) && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Thời gian làm bài: {formatTime(timeSeconds)}
                </span>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-lg border border-white/20 px-4 py-2 text-white transition hover:bg-white/10"
        >
          Về trang chủ
        </Link>
        {courseId && (
          <Link
            href={`/courses/${courseId}`}
            className="rounded-lg border border-white/20 px-4 py-2 text-white transition hover:bg-white/10"
          >
            Quay lại khóa học
          </Link>
        )}
        {courseId && quizId && (
          <Link
            href={`/courses/${courseId}/quizzes/${quizId}`}
            className="rounded-lg bg-white px-4 py-2 font-semibold text-black transition hover:-translate-y-0.5"
          >
            Làm lại quiz
          </Link>
        )}
      </div>
    </div>
  );
}
