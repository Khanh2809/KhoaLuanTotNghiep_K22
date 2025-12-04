"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Layers, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

type SidebarProps = {
  outline: any;
  currentLessonId: number;
  completedLessonIds?: number[];
};

const COLLAPSE_THRESHOLD = 10;
const WINDOW_RADIUS = 5;

export default function CourseOutlineSidebar({ outline, currentLessonId, completedLessonIds }: SidebarProps) {
  const completedSet = useMemo(() => new Set(completedLessonIds ?? []), [completedLessonIds]);

  const flat = useMemo(() => {
    const arr: { id: number; title: string }[] = [];
    outline?.modules?.forEach((m: any) => {
      m.lessons?.forEach((ls: any) => arr.push({ id: ls.id, title: ls.title }));
    });
    return arr;
  }, [outline]);

  const currentIdx = useMemo(() => flat.findIndex((x) => x.id === currentLessonId), [flat, currentLessonId]);

  const shouldCollapse = flat.length > COLLAPSE_THRESHOLD;
  const [collapsed, setCollapsed] = useState<boolean>(shouldCollapse);

  const visibleIds = useMemo(() => {
    if (!collapsed) return new Set(flat.map((x) => x.id));
    if (currentIdx >= 0) {
      const start = Math.max(0, currentIdx - WINDOW_RADIUS);
      const end = Math.min(flat.length, currentIdx + WINDOW_RADIUS + 1);
      return new Set(flat.slice(start, end).map((x) => x.id));
    }
    return new Set(flat.slice(0, COLLAPSE_THRESHOLD).map((x) => x.id));
  }, [collapsed, flat, currentIdx]);

  return (
    <div className="w-full overflow-auto rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur">
      <div className="mb-2 flex items-center gap-2">
        <Layers className="h-4 w-4 text-white/70" />
        <h3 className="text-sm font-semibold text-white">Noi dung khoa hoc</h3>
      </div>

      <div className="space-y-4">
        {outline?.modules?.map((m: any, mi: number) => {
          const moduleLessons = (m.lessons ?? []).filter((ls: any) => visibleIds.has(ls.id));
          if (!moduleLessons.length) return null;
          return (
            <div key={m.id ?? mi}>
              <div className="mb-1 text-xs text-white/60">
                {m.title ?? `Phan ${mi + 1}`} · {(m.lessons?.length ?? 0)} bai hoc
              </div>
              <ul className="space-y-1">
                {moduleLessons.map((ls: any, li: number) => {
                  const active = ls.id === currentLessonId;
                  const completed = completedSet.has(ls.id);
                  return (
                    <li key={ls.id ?? li}>
                      <Link
                        href={`/lessons/${ls.id}`}
                        className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition ${
                          active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <span className="inline-block w-5 text-center text-xs opacity-70">{li + 1}</span>
                        <span className="flex-1 truncate">{ls.title}</span>
                        {completed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Da xong
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {shouldCollapse ? (
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/5"
        >
          {collapsed ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Hien thi tat ca {flat.length} bai
            </>
          ) : (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Thu gọn
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
