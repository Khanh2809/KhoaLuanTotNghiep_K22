'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

type QuizSummary = {
  id: number;
  title: string;
  description?: string | null;
};

export default function QuizListClient({ courseId }: { courseId: string }) {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [error, setError] = useState<string>('');

  async function fetchQuizzes() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/quizzes`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        setError(`Lỗi tải danh sách (${res.status})`);
        return;
      }
      const data: QuizSummary[] = await res.json();
      setQuizzes(data);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh sách quiz');
    }
  }

  async function handleDelete(qid: number) {
    if (!confirm('Xóa bài quiz này?')) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${qid}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchQuizzes();
  }

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Bài Quiz của Khóa học</h1>
        <Link
          href={`/instructor/courses/${courseId}/quizzes/create`}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          <PlusCircle className="h-4 w-4" /> Tạo Quiz mới
        </Link>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-3">
        {quizzes.map((q) => (
          <div
            key={q.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">{q.title}</h2>
              <p className="text-sm text-gray-400">{q.description ?? ''}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/instructor/courses/${courseId}/quizzes/${q.id}/edit`}
                className="flex items-center gap-1 text-blue-400 hover:underline"
              >
                <Edit className="h-4 w-4" /> Sửa
              </Link>
              <button
                onClick={() => handleDelete(q.id)}
                className="flex items-center gap-1 text-red-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" /> Xóa
              </button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
            Chưa có quiz nào cho khóa học này.
          </div>
        )}
      </div>
    </div>
  );
}

