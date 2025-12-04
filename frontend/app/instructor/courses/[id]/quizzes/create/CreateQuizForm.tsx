'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type QuizCreateForm = {
  title: string;
  description: string;
  timeLimit: number;
  attemptsAllowed: number;
  lessonId?: number;
};

export default function CreateQuizForm({ courseId }: { courseId: string }) {
  const searchParams = useSearchParams();

  const [form, setForm] = useState<QuizCreateForm>({
    title: '',
    description: '',
    timeLimit: 15,
    attemptsAllowed: 1,
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lessons, setLessons] = useState<{ id: number; title: string }[]>([]);

  // Prefill from query ?lessonId=...
  useEffect(() => {
    const qLesson = searchParams.get('lessonId');
    if (qLesson) {
      setForm((f) => ({ ...f, lessonId: Number(qLesson) }));
    }
  }, [searchParams]);

  // Fetch outline and flatten lessons for selection
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`, {
          credentials: 'include',
        });
        if (!res.ok) return; // minimal UX change
        const data = await res.json();
        const ls: { id: number; title: string }[] = (data.modules ?? [])
          .flatMap((m: any) => m?.lessons ?? [])
          .map((l: any) => ({ id: l.id, title: l.title }));
        setLessons(ls);
        if (ls.length && !form.lessonId) {
          setForm((f) => ({ ...f, lessonId: ls[0].id }));
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          timeLimit: Number(form.timeLimit),
          attemptsAllowed: Number(form.attemptsAllowed),
          lessonId: Number(form.lessonId),
        }),
      });

      if (!res.ok) {
        // handle 409 conflict if lesson already has a quiz
        const body = await res.json().catch(() => ({} as any));
        if (res.status === 409 && body?.quizId) {
          setError('Bài học này đã có quiz. Chuyển đến trang chỉnh sửa.');
          router.push(`/instructor/courses/${courseId}/quizzes/${body.quizId}/edit`);
          return;
        }
        throw new Error(body?.error || 'Tạo quiz thất bại');
      }

      router.push(`/instructor/courses/${courseId}/quizzes`);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6 text-white">
      <h1 className="mb-4 text-2xl font-bold">Tạo quiz mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block">Bài học</label>
          <select
            name="lessonId"
            value={form.lessonId ?? ''}
            onChange={(e) => setForm({ ...form, lessonId: Number(e.target.value) })}
            className="w-full rounded border border-white/10 bg-black/30 p-2"
            required
          >
            {lessons.length === 0 && <option value="">Không có bài học</option>}
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block">Tiêu đề</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full rounded border border-white/10 bg-black/30 p-2"
            required
          />
        </div>
        <div>
          <label className="mb-1 block">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded border border-white/10 bg-black/30 p-2"
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="mb-1 block">Thời gian (phút)</label>
            <input
              type="number"
              name="timeLimit"
              value={form.timeLimit}
              onChange={handleChange}
              className="w-24 rounded border border-white/10 bg-black/30 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block">Số lần làm</label>
            <input
              type="number"
              name="attemptsAllowed"
              value={form.attemptsAllowed}
              onChange={handleChange}
              className="w-24 rounded border border-white/10 bg-black/30 p-2"
            />
          </div>
        </div>

        {error && <p className="text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-500 px-4 py-2 font-semibold text-black hover:bg-blue-600"
        >
          {loading ? 'Đang lưu...' : 'Tạo Quiz'}
        </button>
      </form>
    </div>
  );
}

