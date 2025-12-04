"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState, useRef, useCallback } from 'react';
import MarkCompleteButton from '@/components/MarkCompleteButton';
import { touchLessonAccess } from '@/lib/api';
import LessonChat from '@/components/LessonChat';
import { Paperclip, ExternalLink, MessageCircle } from 'lucide-react';
import { logActivity } from '@/lib/log-activity';

function VideoPlayer({ src }: { src: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur">
      <video controls className="w-full rounded-lg">
        <source src={src} />
        Trinh duyet khong ho tro video.
      </video>
    </div>
  );
}

export default function LessonContent({ lesson }: { lesson: any }) {
  const lessonId = lesson.id;
  const lessonTitle = lesson.title;
  const courseTitle = lesson.course?.title;
  const rawCourseId = lesson.course?.id;
  const normalizedCourseId =
    rawCourseId === undefined || rawCourseId === null ? undefined : Number(rawCourseId);
  const courseIdForLog =
    normalizedCourseId !== undefined && Number.isNaN(normalizedCourseId)
      ? undefined
      : normalizedCourseId;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  const logTabOut = useCallback(() => {
    logActivity({
      eventType: 'TAB_OUT',
      lessonId,
      courseId: courseIdForLog,
      metadata: { reason: 'visibility_change_or_unload' },
    }).catch(() => {});
  }, [courseIdForLog, lessonId]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      logActivity({
        eventType: 'IDLE',
        lessonId,
        courseId: courseIdForLog,
        metadata: { idleMs: 5 * 60 * 1000 },
      }).catch(() => {});
    }, 5 * 60 * 1000);
  }, [courseIdForLog, lessonId]);

  useEffect(() => {
    (async () => {
      try {
        await touchLessonAccess(lessonId);
      } catch {}
    })();

    resetIdleTimer();
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        logTabOut();
      } else {
        resetIdleTimer();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', logTabOut);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', logTabOut);
      logTabOut();
    };
  }, [lessonId, resetIdleTimer, logTabOut]);

  useEffect(() => {
    (async () => {
      try {
        await logActivity({
          eventType: 'LESSON_OPEN',
          lessonId,
          courseId: courseIdForLog,
          metadata: {
            lessonTitle,
            courseTitle,
          },
        });
      } catch {}
    })();
  }, [courseIdForLog, courseTitle, lessonId, lessonTitle]);

  return (
    <>
      <div className="space-y-6">
        {/* thanh tac vu nho */}
        <div className="flex items-center gap-3">
          <MarkCompleteButton
            lessonId={lessonId}
            initialCompleted={!!lesson.progress?.isCompleted}
          />
        </div>

        {/* blocks */}
        {lesson.blocks?.map((b: any) => {
          switch (b.blockType) {
            case 'TEXT':
              return (
                <div
                  key={b.id}
                  className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-p:leading-relaxed prose-pre:border prose-pre:border-white/10"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {b.textMarkdown || ''}
                  </ReactMarkdown>
                </div>
              );
            case 'IMAGE':
              return (
                <figure key={b.id} className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.imageUrl}
                    alt={b.imageAlt || 'image'}
                    className="mx-auto rounded-xl border border-white/10"
                  />
                  {b.caption && (
                    <figcaption className="text-center text-xs text-white/60">
                      {b.caption}
                    </figcaption>
                  )}
                </figure>
              );
            case 'VIDEO':
              return <VideoPlayer key={b.id} src={b.videoUrl} />;
            case 'ATTACHMENT':
              return (
                <a
                  key={b.id}
                  href={b.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                >
                  <Paperclip className="h-4 w-4" />
                  Tai tep dinh kem
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
              );
            case 'EMBED':
              return (
                <div
                  key={b.id}
                  className="aspect-video w-full overflow-hidden rounded-xl border border-white/10"
                >
                  <iframe src={b.embedUrl} className="h-full w-full" allowFullScreen />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>

      {/* Floating AI Tutor bubble - only on lesson page */}
      <button
        type="button"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/40 transition hover:-translate-y-0.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Mo chat ho tro bai hoc"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* LessonChat mounted but hidden when bubble closed */}
      <div
        className={`fixed bottom-20 right-6 z-40 w-full max-w-sm sm:max-w-md transition-all duration-200 ${
          isChatOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-hidden={!isChatOpen}
      >
        <LessonChat lessonId={lessonId} />
      </div>
    </>
  );
}
