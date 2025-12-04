'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchQuiz, startQuizAttempt, submitQuiz } from '@/lib/api';
import { toast } from 'sonner';
import { logActivity, type ActivityEventType } from '@/lib/log-activity';
import type { QuizAttempt } from '@/lib/api';

type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_TEXT';

type Option = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  text: string;
  type: QuestionType;
  points?: number | null;
  order: number;
  options: Option[];
};

type Quiz = {
  id: number;
  lessonId?: number | null;
  title: string;
  description?: string | null;
  timeLimit?: number | null;
  attemptsAllowed?: number | null;
  attemptsLeft?: number | null;
  deadline?: string | null;
  questions: Question[];
  lesson?: {
    id: number;
  } | null;
};

type AnswersState = Record<number, number[] | string>;

const AUTOSAVE_INTERVAL_MS = 10_000;
const IDLE_THRESHOLD_MS = 30_000;

export default function TakeQuizClient({ courseId, quizId }: { courseId: string; quizId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [startError, setStartError] = useState<string>('');
  const router = useRouter();
  const [submission, setSubmission] = useState<{ id: number; attemptNumber?: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');

  const localStorageKey = useMemo(() => `quizAnswers-${quizId}`, [quizId]);
  const courseIdForLog = useMemo(() => {
    const parsed = Number(courseId);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [courseId]);
  const quizIdForLog = useMemo(() => {
    const parsed = Number(quizId);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [quizId]);
  const lessonIdForLog = useMemo(() => {
    const id = quiz?.lessonId ?? quiz?.lesson?.id;
    if (id === null || id === undefined) return undefined;
    const parsed = Number(id);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [quiz]);
  const answersRef = useRef<AnswersState>({});
  const warningPlayedRef = useRef(false);
  const timeLeftRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const idleLoggedRef = useRef(false);
  const lastTabOutAtRef = useRef(0);
  const tabOutCountRef = useRef(0);
  const startAtRef = useRef<number | null>(null);
  const [tabOutCount, setTabOutCount] = useState(0);

  const logQuizEvent = useCallback(
    async (eventType: ActivityEventType, metadata?: Record<string, any>) => {
      const combinedMetadata =
        quizIdForLog !== undefined ? { quizId: quizIdForLog, ...(metadata ?? {}) } : metadata;
      await logActivity({
        eventType,
        courseId: courseIdForLog,
        lessonId: lessonIdForLog,
        metadata: combinedMetadata,
      });
    },
    [courseIdForLog, lessonIdForLog, quizIdForLog]
  );

  const logTabOutEvent = useCallback(() => {
    if (!startedRef.current) return;
    const now = Date.now();
    if (now - lastTabOutAtRef.current < 750) {
      return;
    }
    lastTabOutAtRef.current = now;
    tabOutCountRef.current += 1;
    setTabOutCount(tabOutCountRef.current);
    void logQuizEvent('TAB_OUT', {
      timeLeftSeconds: timeLeftRef.current ?? undefined,
    });
  }, [logQuizEvent]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    startedRef.current = started;
    if (started) {
      lastInteractionRef.current = Date.now();
      idleLoggedRef.current = false;
    }
  }, [started]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setAnswers(parsed);
        }
      }
    } catch {
      // ignore corrupted draft
    }
  }, [localStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleInteraction = () => {
      lastInteractionRef.current = Date.now();
      idleLoggedRef.current = false;
    };
    const interactionEvents = ['pointerdown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleInteraction)
    );
    return () => {
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleInteraction)
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setInterval(() => {
      if (!startedRef.current) return;
      const now = Date.now();
      const idleForMs = now - lastInteractionRef.current;
      if (!idleLoggedRef.current && idleForMs >= IDLE_THRESHOLD_MS) {
        idleLoggedRef.current = true;
        const idleForSeconds = Math.round(idleForMs / 1000);
        void logQuizEvent('IDLE', {
          idleForSeconds,
          idleThresholdSeconds: IDLE_THRESHOLD_MS / 1000,
          timeLeftSeconds: timeLeftRef.current ?? undefined,
        });
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [logQuizEvent]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        logTabOutEvent();
      } else if (document.visibilityState === 'visible') {
        lastInteractionRef.current = Date.now();
        idleLoggedRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [logTabOutEvent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBlur = () => {
      logTabOutEvent();
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [logTabOutEvent]);

  const clearAutosave = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(localStorageKey);
    } catch {
      // ignore
    }
    setLastSavedAt('');
  }, [localStorageKey]);

  useEffect(() => {
    let mounted = true;
    setSubmission(null);
    setStarted(false);
    setTimeLeft(null);
    setTimerActive(false);
    setStartError('');
    setSubmitError('');
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data: Quiz = await fetchQuiz(Number(quizId));
        if (mounted) setQuiz(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Không tải được quiz');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [quizId, reloadKey]);

  const handleOption = (
    questionId: number,
    optionId: number,
    type: QuestionType,
    checked: boolean
  ) => {
    if (!started) return;
    setAnswers((prev) => {
      const cur: AnswersState = { ...prev };
      if (type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE') {
        cur[questionId] = [optionId];
      } else if (type === 'MULTIPLE_CHOICE') {
        const current = (cur[questionId] as number[] | undefined) ?? [];
        const set = new Set<number>(current);
        checked ? set.add(optionId) : set.delete(optionId);
        cur[questionId] = Array.from(set.values());
      }
      return cur;
    });
  };

  const handleStartAttempt = async () => {
    if (!quiz) return;
    if (typeof quiz.attemptsLeft === 'number' && quiz.attemptsLeft <= 0) {
      setStartError('Bạn đã dùng hết lượt làm bài cho quiz này.');
      toast.error('Bạn đã dùng hết lượt làm quiz này.');
      return;
    }
    try {
      setStartError('');
      const sub = await startQuizAttempt(Number(quizId));
      sub.attemptNumber;
      setSubmission(sub);
      setStarted(true);
      startAtRef.current = Date.now();
      tabOutCountRef.current = 0;
      setTabOutCount(0);
      setQuiz((prev) =>
        prev
          ? {
              ...prev,
              attemptsLeft:
                typeof prev.attemptsLeft === 'number'
                  ? Math.max(prev.attemptsLeft - 1, 0)
                  : prev.attemptsLeft ?? null,
            }
          : prev
      );
      if (quiz.timeLimit) {
        setTimeLeft(quiz.timeLimit * 60);
        setTimerActive(true);
      } else {
        setTimeLeft(null);
        setTimerActive(false);
      }
      await logQuizEvent('QUIZ_START', {
        submissionId: sub?.id,
        attemptNumber: sub?.attemptNumber,
        timeLimitSeconds: quiz.timeLimit ? quiz.timeLimit * 60 : null,
      });
    } catch (e: any) {
      const msg = e?.message || 'Không thể bắt đầu quiz';
      setStartError(msg);
      if (msg.includes('ATTEMPT_LIMIT_REACHED')) {
        toast.error('Bạn đã dùng hết lượt làm quiz này.');
      } else {
        toast.error(msg);
      }
    }
  };

  const handleSubmit = useCallback(
    async (options?: { auto?: boolean }) => {
      if (!submission) {
        setSubmitError('Bạn cần bấm "Bắt đầu làm bài" trước khi nộp.');
        return;
      }
      try {
        if (options?.auto) setAutoSubmitting(true);
        setSubmitting(true);
        setSubmitError('');
        const payload = {
          submissionId: submission.id,
          answers: Object.entries(answersRef.current).map(([qid, sel]) => ({
            questionId: Number(qid),
            selectedOptionIds: Array.isArray(sel) ? (sel as number[]) : undefined,
            textAnswer: typeof sel === 'string' ? (sel as string) : undefined,
          })),
        };
        const result = await submitQuiz(Number(quizId), payload);
        setTimerActive(false);
        clearAutosave();
        await logQuizEvent('QUIZ_SUBMIT', {
          submissionId: submission.id,
          answersCount: payload.answers.length,
          autoSubmitted: !!options?.auto,
          timeLeftSeconds: timeLeftRef.current ?? undefined,
          score: result?.score,
          total: result?.total,
          tabOutCount: tabOutCountRef.current,
          timeSpentSeconds: startAtRef.current ? Math.round((Date.now() - startAtRef.current) / 1000) : undefined,
        });
        const percent = result.total ? Math.round((result.score / result.total) * 100) : 0;
        const timeSpentSeconds = startAtRef.current ? Math.round((Date.now() - startAtRef.current) / 1000) : undefined;
        router.push(
          `/courses/${courseId}/quizzes/${quizId}/result?score=${result.score}` +
            `&total=${result.total}` +
            `&submissionId=${submission.id}` +
            `&percent=${percent}` +
            `&tabOuts=${tabOutCountRef.current}` +
            (timeSpentSeconds !== undefined ? `&time=${timeSpentSeconds}` : '')
        );
      } catch (e: any) {
        const msg = e?.message || 'Nộp bài thất bại';
        setSubmitError(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
        setAutoSubmitting(false);
      }
    },
    [clearAutosave, courseId, logQuizEvent, quizId, router, submission]
  );

  useEffect(() => {
    if (!timerActive || timeLeft === null) return;
    if (timeLeft <= 0) {
      setTimerActive(false);
      handleSubmit({ auto: true });
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, handleSubmit]);

  const playWarningTone = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch {
      // ignore autoplay issues
    }
  }, []);

  useEffect(() => {
    if (!timerActive || timeLeft === null) {
      warningPlayedRef.current = false;
      setShowTimeWarning(false);
      return;
    }
    if (timeLeft <= 60) {
      setShowTimeWarning(true);
      if (!warningPlayedRef.current) {
        warningPlayedRef.current = true;
        playWarningTone();
      }
    } else {
      setShowTimeWarning(false);
      warningPlayedRef.current = false;
    }
  }, [timeLeft, timerActive, playWarningTone]);

  useEffect(() => {
    if (!started) return;
    const persist = () => {
      try {
        window.localStorage.setItem(localStorageKey, JSON.stringify(answersRef.current));
        setLastSavedAt(new Date().toLocaleTimeString('vi-VN'));
      } catch {
        // ignore quota errors
      }
    };
    persist();
    const id = window.setInterval(persist, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [localStorageKey, started]);

  useEffect(
    () => () => {
      if (!started) return;
      try {
        window.localStorage.setItem(localStorageKey, JSON.stringify(answersRef.current));
      } catch {
        // ignore
      }
    },
    [localStorageKey, started]
  );

  const formattedTime = useMemo(() => {
    if (timeLeft === null) return null;
    const minutes = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  if (loading) return <div className="p-6 text-white">Đang tải...</div>;
  if (error)
    return (
      <div className="p-6 text-white">
        <div className="mb-3 text-red-400">{error}</div>
        <button
          onClick={() => {
            setError('');
            setReloadKey((key) => key + 1);
          }}
          className="rounded bg-blue-500 px-3 py-1.5 text-black"
        >
          Thử lại
        </button>
      </div>
    );
  if (!quiz) return <div className="p-6 text-white">Không có dữ liệu quiz.</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="mb-2 text-2xl font-bold">{quiz.title}</h1>
      <p className="mb-4 text-gray-400">{quiz.description ?? ''}</p>

      <div className="mb-6 rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">
              {quiz.timeLimit ? `Thời gian: ${quiz.timeLimit} phút` : 'Không giới hạn thời gian'}
            </p>
            <p className="text-sm text-white/70">
              {quiz.attemptsAllowed
                ? `Số lần làm tối đa: ${quiz.attemptsAllowed}`
                : 'Không giới hạn số lần làm'}
            </p>
            {typeof quiz.attemptsLeft === 'number' && (
              <p className="text-sm text-white/70">
                Lượt làm còn lại: {quiz.attemptsLeft} {quiz.attemptsLeft === 0 && '(Đã hết)'}
              </p>
            )}
          </div>
          {quiz.timeLimit && started && formattedTime && (
            <div className="rounded border border-white/30 px-4 py-2 text-lg font-semibold">
              Thời gian còn lại: {formattedTime}
            </div>
          )}
          {!started && (
            <button
              onClick={handleStartAttempt}
              disabled={typeof quiz.attemptsLeft === 'number' && quiz.attemptsLeft <= 0}
              className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              Bắt đầu làm bài
            </button>
          )}
        </div>
        {showTimeWarning && (
          <p className="text-sm font-semibold text-yellow-300">
            Còn dưới 1 phút! Vui lòng kiểm tra và nộp bài sớm.
          </p>
        )}
        {lastSavedAt && started && (
          <p className="text-xs text-white/60">
            Câu trả lời tự lưu 10 giây/lần. Lần lưu gần nhất: {lastSavedAt}.
          </p>
        )}
        {startError && <p className="text-sm text-red-400">{startError}</p>}
      </div>

      {started ? (
        <>
          {quiz.questions.map((q) => {
            const selection = answers[q.id];
            return (
              <div key={q.id} className="mb-6 rounded-xl border border-white/5 bg-black/20 p-4">
                <p className="mb-2 font-semibold">
                  {q.order}. {q.text}
                </p>

                {q.type !== 'SHORT_TEXT' ? (
                  q.options.map((o) => (
                    <label key={o.id} className="mb-1 flex items-center gap-2">
                      <input
                        type={q.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                        name={`q-${q.id}`}
                        disabled={!started || submitting}
                        checked={
                          Array.isArray(selection)
                            ? (selection as number[]).includes(o.id)
                            : false
                        }
                        onChange={(e) => handleOption(q.id, o.id, q.type, e.target.checked)}
                      />
                      <span>{o.text}</span>
                    </label>
                  ))
                ) : (
                  <input
                    type="text"
                    className="w-full rounded-lg border border-white/10 bg-black/40 p-2"
                    placeholder="Nhập câu trả lời..."
                    disabled={!started || submitting}
                    value={typeof selection === 'string' ? (selection as string) : ''}
                    onChange={(e) => {
                      if (!started) return;
                      const value = e.target.value;
                      setAnswers((prev) => ({ ...prev, [q.id]: value }));
                    }}
                  />
                )}
              </div>
            );
          })}

          {submitError && (
            <div className="mb-2 text-sm text-red-400">{submitError}</div>
          )}
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="mt-4 rounded-lg bg-green-500 px-4 py-2 font-semibold text-black hover:bg-green-600 disabled:opacity-60"
          >
            {submitting
              ? autoSubmitting
                ? 'Đang tự động nộp...'
                : 'Đang nộp...'
              : 'Nộp bài'}
          </button>
        </>
      ) : (
        <p className="rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-white/70">
          Bấm "Bắt đầu làm bài" để mở câu hỏi. Đồng hồ đếm, lưu nháp và giới hạn lượt sẽ được áp dụng
          ngay sau khi bạn bắt đầu.
        </p>
      )}
    </div>
  );
}
