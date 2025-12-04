"use client";

import { useMemo, useState } from "react";
import LessonOpenControl from "@/components/LessonOpenControl";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

type Lesson = {
  id: number;
  title: string;
  quizId?: number | null;
  duration?: string | null;
};

type Module = {
  id?: number | string;
  title?: string;
  lessons?: Lesson[];
};

type Props = {
  courseId: number;
  modules: Module[];
  enrolled: boolean;
  completedLessonIds?: number[];
};

const COLLAPSE_THRESHOLD = 10;

export default function CourseModules({ courseId, modules, enrolled, completedLessonIds }: Props) {
  const completedSet = useMemo(() => new Set(completedLessonIds ?? []), [completedLessonIds]);

  const totalLessons = useMemo(
    () => modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0),
    [modules]
  );
  const shouldCollapse = totalLessons > COLLAPSE_THRESHOLD;
  const [collapsed, setCollapsed] = useState<boolean>(shouldCollapse);

  return (
    <div className="space-y-4">
      {modules.length ? (
        modules.map((m, idx) => {
          const key = String(m.id ?? idx);
          const lessons = m.lessons ?? [];
          let remaining = Infinity;
          if (shouldCollapse && collapsed) {
            remaining = Math.max(
              0,
              COLLAPSE_THRESHOLD -
                modules
                  .slice(0, idx)
                  .reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0)
            );
          }
          if (shouldCollapse && collapsed && remaining <= 0) {
            return null;
          }
          const visibleLessons =
            shouldCollapse && collapsed ? lessons.slice(0, remaining) : lessons;

          return (
            <div
              key={key}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-xs">
                    {idx + 1}
                  </span>
                  <p className="font-medium">{m.title ?? `Module ${idx + 1}`}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  {(m.lessons?.length ?? 0)} bai hoc
                </div>
              </div>

              <ul>
                {visibleLessons.map((ls) => {
                  const completed = completedSet.has(ls.id);
                  return (
                    <li
                      key={ls.id}
                      className="flex items-center justify-between border-t border-white/10 px-4 py-3 transition hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm text-white/90">
                          {completed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Hoan thanh
                            </span>
                          ) : null}
                          {ls.title}
                          {ls.quizId ? (
                            <span className="rounded-full border border-amber-300/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                              Quiz
                            </span>
                          ) : null}
                        </p>
                        {ls.duration && (
                          <p className="mt-0.5 text-xs text-white/50">{ls.duration}</p>
                        )}
                      </div>

                      <LessonOpenControl
                        courseId={courseId}
                        lessonId={ls.id}
                        quizId={ls.quizId}
                        canAccessByEnrollment={enrolled}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
          Chua co noi dung.
        </div>
      )}
      {shouldCollapse ? (
        <div className="flex justify-center">
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/5"
          >
            {collapsed ? (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Hien thi them {totalLessons - COLLAPSE_THRESHOLD} bai
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Thu gon danh sach
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
