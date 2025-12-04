'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type QuizQuestion = {
  id: number;
  text: string;
  type: string;
  points?: number | null;
};

type LessonInfo = {
  id: number;
  title: string;
  module?: { id: number; title: string; courseId?: number };
};

type QuizDetail = {
  id: number;
  title: string;
  description?: string | null;
  timeLimit?: number | null;
  attemptsAllowed?: number | null;
  lesson?: LessonInfo | null;
  outline?: { modules?: Array<{ id: number; title: string }> };
  questions: QuizQuestion[];
};

export default function QuizDetailClient({ courseId, quizId }: { courseId: string; quizId: string }) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setQuiz(data);
          setError('');
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Không tải được quiz');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizId, reloadKey]);

  if (loading) return <div className="p-6 text-white">Đang tải...</div>;
  if (error) {
    return (
      <div className="p-6 text-white">
        <p className="mb-3 text-red-400">{error}</p>
        <button
          className="rounded bg-blue-500 px-3 py-1.5 text-black"
          onClick={() => {
            setError('');
            setReloadKey((key) => key + 1);
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (!quiz) return <div className="p-6 text-white">Không có dữ liệu quiz.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase text-white/60">Quiz</p>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-white/70">{quiz.description ?? 'Chưa có mô tả'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/instructor/courses/${courseId}/quizzes/${quizId}/edit`}
            className="rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
          >
            Chỉnh sửa thông tin
          </Link>
          <Link
            href={`/instructor/courses/${courseId}/quizzes/${quizId}/questions`}
            className="rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
          >
            Quản lý câu hỏi
          </Link>
          <Link
            href={`/courses/${courseId}/quizzes/${quizId}`}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-black hover:-translate-y-0.5 transition"
          >
            Xem như học viên
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase text-white/60">Thời gian</p>
          <p className="text-xl font-semibold">
            {quiz.timeLimit ? `${quiz.timeLimit} phút` : 'Không giới hạn'}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase text-white/60">Số lần làm</p>
          <p className="text-xl font-semibold">
            {quiz.attemptsAllowed ? `${quiz.attemptsAllowed} lần` : 'Không giới hạn'}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase text-white/60">Số câu hỏi</p>
          <p className="text-xl font-semibold">{quiz.questions?.length ?? 0}</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/30 p-4 space-y-2">
        <p className="text-xs uppercase text-white/60">Bài học</p>
        {quiz.lesson ? (
          <>
            <Link
              href={`/lessons/${quiz.lesson.id}`}
              className="text-lg font-semibold text-blue-300 hover:underline"
            >
              {quiz.lesson.title}
            </Link>
            {quiz.lesson.module && (
              <p className="text-sm text-white/70">
                Thuộc chương: {quiz.lesson.module.title}
              </p>
            )}
          </>
        ) : (
          <p className="text-white/70">Không có thông tin bài học</p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30">
        <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold uppercase text-white/70">
          Danh sách câu hỏi
        </div>
        {quiz.questions?.length ? (
          <ul className="divide-y divide-white/10">
            {quiz.questions.map((q, idx) => (
              <li key={q.id} className="px-4 py-3">
                <p className="font-medium">
                  {idx + 1}. {q.text}
                </p>
                <p className="text-sm text-white/60">
                  Kiểu: {q.type} · Điểm: {q.points ?? 1}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-6 text-center text-white/60">Chưa có câu hỏi nào.</div>
        )}
      </div>
    </div>
  );
}
