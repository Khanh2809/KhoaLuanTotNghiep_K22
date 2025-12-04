'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_TEXT';

type Option = { id?: number; text: string; isCorrect: boolean; order?: number };
type Question = {
  id?: number;
  text: string;
  type: QuestionType;
  points?: number | null;
  order?: number;
  correctTextAnswer?: string | null;
  options?: Option[];
  _status?: 'clean' | 'dirty' | 'new';
};

export default function QuestionsManager({ courseId, quizId }: { courseId: string; quizId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingAll, setSavingAll] = useState(false);

  const pendingCount = useMemo(
    () => questions.filter((q) => q._status && q._status !== 'clean').length,
    [questions]
  );
  const hasPendingChanges = pendingCount > 0;

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuestions(
        (data?.questions ?? []).map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points ?? 1,
          order: q.order ?? 1,
          correctTextAnswer: q.correctTextAnswer ?? null,
          options: (q.options ?? []).map((o: any) => ({
            id: o.id,
            text: o.text,
            isCorrect: !!o.isCorrect,
            order: o.order,
          })),
          _status: 'clean',
        }))
      );
      setError('');
    } catch (e: any) {
      const message = e?.message || 'Không tải được câu hỏi';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [quizId]);

  function updateQuestion(idx: number, patcher: (q: Question) => Partial<Question>) {
    setQuestions((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it;
        const patch = patcher(it);
        const nextStatus = it.id ? 'dirty' : it._status ?? 'new';
        return { ...it, ...patch, _status: patch._status ?? nextStatus };
      })
    );
  }

  function addQuestion(type: QuestionType) {
    const nextOrder = (questions[questions.length - 1]?.order ?? 0) + 1;
    setQuestions((qs) => [
      ...qs,
      {
        text: '',
        type,
        points: 1,
        order: nextOrder,
        correctTextAnswer: type === 'SHORT_TEXT' ? '' : null,
        options:
          type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE'
            ? type === 'TRUE_FALSE'
              ? [
                  { text: 'Đúng', isCorrect: true },
                  { text: 'Sai', isCorrect: false },
                ]
              : [
                  { text: '', isCorrect: true },
                  { text: '', isCorrect: false },
                ]
            : [],
        _status: 'new',
      },
    ]);
  }

  function buildQuestionPayload(q: Question, mode: 'create' | 'update') {
    const payload: any = {
      text: q.text,
      type: q.type,
      points: q.points ?? 1,
      order: q.order ?? 1,
    };
    if (q.type === 'SHORT_TEXT') {
      payload.correctTextAnswer = q.correctTextAnswer ?? '';
    } else {
      payload.options = (q.options ?? []).map((o, i) => ({
        text: o.text,
        isCorrect: !!o.isCorrect,
        order: o.order ?? i + 1,
      }));
    }
    return payload;
  }

  async function saveNewQuestion(q: Question) {
    const payload = buildQuestionPayload(q, 'create');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}/questions`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async function updateExistingQuestion(q: Question) {
    if (!q.id) return;
    const payload = buildQuestionPayload(q, 'update');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/${q.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async function removeQuestion(qid?: number, idx?: number) {
    if (qid) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/${qid}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    }
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  async function handleSaveAll() {
    const pending = questions.filter((q) => q._status && q._status !== 'clean');
    if (!pending.length) return;
    setSavingAll(true);
    try {
      for (const q of pending) {
        if (q.id) {
          await updateExistingQuestion(q);
        } else {
          await saveNewQuestion(q);
        }
      }
      toast.success('Đã lưu thay đổi câu hỏi');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Lưu câu hỏi thất bại');
    } finally {
      setSavingAll(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 text-white space-y-4">
      <div className="space-y-3 rounded border border-white/10 bg-black/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Câu hỏi của Quiz</h1>
          <button
            onClick={handleSaveAll}
            disabled={!hasPendingChanges || savingAll}
            className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-black hover:-translate-y-0.5 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingAll
              ? 'Đang lưu...'
              : hasPendingChanges
              ? `Lưu tất cả (${pendingCount})`
              : 'Đã lưu tất cả'}
          </button>
        </div>

        {hasPendingChanges && (
          <p className="text-xs text-yellow-300">
            Bạn có {pendingCount} thay đổi chưa được lưu.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addQuestion('SINGLE_CHOICE')}
            className="rounded border border-white/15 px-3 py-1.5 text-sm"
          >
            + Trắc nghiệm 1 đáp án
          </button>
          <button
            onClick={() => addQuestion('MULTIPLE_CHOICE')}
            className="rounded border border-white/15 px-3 py-1.5 text-sm"
          >
            + Trắc nghiệm nhiều đáp án
          </button>
          <button
            onClick={() => addQuestion('TRUE_FALSE')}
            className="rounded border border-white/15 px-3 py-1.5 text-sm"
          >
            + Đúng / Sai
          </button>
          <button
            onClick={() => addQuestion('SHORT_TEXT')}
            className="rounded border border-white/15 px-3 py-1.5 text-sm"
          >
            + Tự luận ngắn
          </button>
        </div>
      </div>

      {loading && <div>Đang tải...</div>}
      {error && <div className="text-red-400">{error}</div>}

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id ?? `new-${idx}`}
            className="space-y-3 rounded border border-white/10 bg-black/30 p-4"
          >
            <div className="flex items-center justify-between text-sm text-white/70">
              <div>
                #{q.order ?? idx + 1} • {q.type}
                {q._status === 'dirty' && (
                  <span className="ml-2 rounded bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-200">
                    Đã chỉnh sửa
                  </span>
                )}
                {q._status === 'new' && (
                  <span className="ml-2 rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-200">
                    Mới
                  </span>
                )}
              </div>
              <button onClick={() => removeQuestion(q.id, idx)} className="text-red-400 text-sm">
                Xoá
              </button>
            </div>

            <input
              value={q.text}
              onChange={(e) => updateQuestion(idx, () => ({ text: e.target.value }))}
              className="w-full rounded border border-white/10 bg-black/20 px-3 py-2"
              placeholder="Nội dung câu hỏi"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-white/70">Điểm</label>
                <input
                  type="number"
                  value={q.points ?? 1}
                  onChange={(e) =>
                    updateQuestion(idx, () => ({ points: Number(e.target.value) || 1 }))
                  }
                  className="w-24 rounded border border-white/10 bg-black/20 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Thứ tự</label>
                <input
                  type="number"
                  value={q.order ?? idx + 1}
                  onChange={(e) =>
                    updateQuestion(idx, () => ({ order: Number(e.target.value) || idx + 1 }))
                  }
                  className="w-24 rounded border border-white/10 bg-black/20 px-3 py-2"
                />
              </div>
            </div>

            {q.type !== 'SHORT_TEXT' ? (
              <div className="space-y-2">
                <div className="text-sm text-white/70">Đáp án</div>
                {(q.options ?? []).map((o, oi) => (
                  <div key={o.id ?? `o-${oi}`} className="flex items-center gap-2">
                    <input
                      type={q.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                      checked={!!o.isCorrect}
                      onChange={(e) =>
                        updateQuestion(idx, (question) => {
                          const opts = [...(question.options ?? [])];
                          if (q.type === 'MULTIPLE_CHOICE') {
                            opts[oi] = { ...opts[oi], isCorrect: e.target.checked };
                          } else {
                            for (let k = 0; k < opts.length; k++) {
                              opts[k] = { ...opts[k], isCorrect: k === oi };
                            }
                          }
                          return { options: opts };
                        })
                      }
                    />
                    <input
                      value={o.text}
                      onChange={(e) =>
                        updateQuestion(idx, (question) => {
                          const opts = [...(question.options ?? [])];
                          opts[oi] = { ...opts[oi], text: e.target.value };
                          return { options: opts };
                        })
                      }
                      className="flex-1 rounded border border-white/10 bg-black/20 px-2 py-1"
                      placeholder={`Phương án ${oi + 1}`}
                    />
                    {(q.options?.length ?? 0) > 2 && (
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:text-red-300"
                        onClick={() =>
                          updateQuestion(idx, (question) => ({
                            options: (question.options ?? []).filter((_, optIdx) => optIdx !== oi),
                          }))
                        }
                      >
                        Xoá
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateQuestion(idx, (question) => ({
                      options: [...(question.options ?? []), { text: '', isCorrect: false }],
                    }))
                  }
                  className="text-sm rounded border border-white/15 px-2 py-1"
                >
                  + Thêm đáp án
                </button>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm text-white/70">Đáp án đúng (văn bản)</label>
                <input
                  value={q.correctTextAnswer ?? ''}
                  onChange={(e) =>
                    updateQuestion(idx, () => ({ correctTextAnswer: e.target.value }))
                  }
                  className="w-full rounded border border-white/10 bg-black/20 px-3 py-2"
                  placeholder="Nhập đáp án đúng"
                />
              </div>
            )}
          </div>
        ))}

        {!questions.length && !loading && (
          <div className="rounded border border-dashed border-white/20 p-6 text-center text-white/60">
            Chưa có câu hỏi nào. Hãy bắt đầu bằng cách thêm câu hỏi bên trên.
          </div>
        )}
      </div>
    </div>
  );
}

