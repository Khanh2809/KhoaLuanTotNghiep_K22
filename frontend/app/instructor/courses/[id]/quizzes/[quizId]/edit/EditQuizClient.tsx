'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

type QuizEditable = {
  id: number;
  title: string;
  description?: string | null;
  timeLimit?: number | null;
  attemptsAllowed?: number | null;
};

export default function EditQuizClient({ courseId, quizId }: { courseId: string; quizId: string }) {
  const [quiz, setQuiz] = useState<QuizEditable | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as any;
        setQuiz({
          id: data.id,
          title: data.title,
          description: data.description ?? '',
          timeLimit: data.timeLimit ?? 15,
          attemptsAllowed: data.attemptsAllowed ?? 1,
        });
      } catch (e: any) {
        setError(e?.message || 'Không tải được quiz');
        toast.error(e?.message || 'Không tải được quiz');
      }
    })();
  }, [quizId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quiz),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Đã lưu thông tin quiz');
    } catch (e: any) {
      const message = e?.message || 'Lưu thất bại';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (!quiz) return <div className="p-6 text-white">Đang tải...</div>;

  return (
    <div className="mx-auto max-w-xl p-6 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chỉnh sửa Quiz</h1>
        <Link
          href={`/instructor/courses/${courseId}/quizzes/${quizId}/questions`}
          className="text-sm rounded bg-white text-black px-3 py-1.5"
        >
          Quản lý Câu hỏi
        </Link>
      </div>

      {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block">Tiêu đề</label>
          <input
            value={quiz.title}
            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            className="w-full rounded border border-white/10 bg-black/30 p-2"
          />
        </div>
        <div>
          <label className="mb-1 block">Mô tả</label>
          <textarea
            value={quiz.description ?? ''}
            onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
            className="w-full rounded border border-white/10 bg-black/30 p-2"
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="mb-1 block">Thời gian (phút)</label>
            <input
              type="number"
              value={quiz.timeLimit ?? 15}
              onChange={(e) => setQuiz({ ...quiz, timeLimit: Number(e.target.value) })}
              className="w-24 rounded border border-white/10 bg-black/30 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block">Số lần làm</label>
            <input
              type="number"
              value={quiz.attemptsAllowed ?? 1}
              onChange={(e) => setQuiz({ ...quiz, attemptsAllowed: Number(e.target.value) })}
              className="w-24 rounded border border-white/10 bg-black/30 p-2"
            />
          </div>
        </div>
        <button
          disabled={saving}
          className="rounded bg-green-500 px-4 py-2 font-semibold text-black hover:bg-green-600 disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}

