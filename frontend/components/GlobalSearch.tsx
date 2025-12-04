"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchGlobalSearch, GlobalSearchResult } from "@/lib/search";
import { Command, Search, X, ShieldAlert } from "lucide-react";

type SearchState = {
  open: boolean;
  query: string;
  loading: boolean;
  results: GlobalSearchResult;
  error: string | null;
  feedback: string | null;
};

const initialResults: GlobalSearchResult = { courses: [], lessons: [] };

export default function GlobalSearch() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<SearchState>({
    open: false,
    query: "",
    loading: false,
    results: initialResults,
    error: null,
    feedback: null,
  });

  // Avoid hydration mismatch by rendering only after mount
  useEffect(() => setMounted(true), []);

  // Hotkeys: Cmd/Ctrl+K to open, Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        setState((s) => ({ ...s, open: true }));
      }
      if (key === "escape") {
        setState((s) => ({ ...s, open: false }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!state.open) return;
    const q = state.query.trim();
    if (q.length < 2) {
      setState((s) => ({ ...s, results: initialResults, error: null, feedback: null, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const t = setTimeout(() => {
      fetchGlobalSearch(q)
        .then((results) => setState((s) => ({ ...s, results, loading: false, error: null })))
        .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message || "Search failed" })));
    }, 200);
    return () => {
      clearTimeout(t);
    };
  }, [state.query, state.open]);

  const totalResults = useMemo(
    () => state.results.courses.length + state.results.lessons.length,
    [state.results],
  );

  function close() {
    setState((s) => ({ ...s, open: false, feedback: null }));
  }

  async function onSelectLesson(lesson: { id: number; courseId: number | null }) {
    if (!lesson.courseId) return;
    try {
      // Check enrollment status; if not enrolled, show feedback and do not navigate
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enrollments/status/${lesson.courseId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setState((s) => ({ ...s, feedback: "Bạn cần đăng ký khóa học trước khi xem bài học này." }));
        return;
      }
      const data = await res.json();
      if (!data.enrolled) {
        setState((s) => ({ ...s, feedback: "Bạn cần đăng ký khóa học trước khi xem bài học này." }));
        return;
      }
      router.push(`/lessons/${lesson.id}`);
      close();
    } catch {
      setState((s) => ({ ...s, feedback: "Không kiểm tra được trạng thái đăng ký. Thử lại." }));
    }
  }

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setState((s) => ({ ...s, open: true }))}
        className="hidden md:inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:border-white/20 hover:text-white transition"
        aria-label="Mở tìm kiếm (Ctrl/Cmd + K)"
      >
        <Search className="h-4 w-4" />
        <span></span>
        <kbd className="ml-2 inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70 border border-white/15">
          <Command className="h-3 w-3" /> K
        </kbd>
      </button>

      {state.open && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm">
          <div className="mx-auto mt-16 w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900/95 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 text-white/60" />
              <input
                autoFocus
                value={state.query}
                onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
                placeholder="Tìm khóa học, bài học..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
              />
              <button
                onClick={close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3">
              {state.loading && <div className="text-sm text-white/60 px-2">Đang tìm...</div>}
              {state.error && <div className="text-sm text-red-300 px-2">Lỗi: {state.error}</div>}

              {!state.loading && !state.error && state.query.trim().length >= 2 && totalResults === 0 && (
                <div className="text-sm text-white/60 px-2">Không tìm thấy kết quả.</div>
              )}

              {state.results.courses.length > 0 && (
                <Section title="Khóa học">
                  {state.results.courses.map((c) => (
                    <ResultRow
                      key={`course-${c.id}`}
                      title={c.title}
                      subtitle={c.instructor ? `Giảng viên: ${c.instructor}` : c.description || ""}
                      onClick={() => {
                        router.push(`/courses/${c.id}`);
                        close();
                      }}
                    />
                  ))}
                </Section>
              )}

              {state.results.lessons.length > 0 && (
                <Section title="Bài học">
                  {state.results.lessons.map((l) => (
                    <ResultRow
                      key={`lesson-${l.id}`}
                      title={l.title}
                      subtitle={l.courseTitle ? `Thuộc khóa: ${l.courseTitle}` : ""}
                      onClick={() => onSelectLesson({ id: l.id, courseId: l.courseId })}
                    />
                  ))}
                </Section>
              )}

              {state.feedback && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  <ShieldAlert className="h-4 w-4" />
                  <span>{state.feedback}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="px-2 text-xs uppercase tracking-wide text-white/50">{title}</div>
      <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/5">{children}</div>
    </div>
  );
}

function ResultRow({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left hover:bg-white/10 transition"
    >
      <div className="text-sm font-semibold text-white line-clamp-1">{title}</div>
      {subtitle && <div className="text-xs text-white/60 line-clamp-1">{subtitle}</div>}
    </button>
  );
}
