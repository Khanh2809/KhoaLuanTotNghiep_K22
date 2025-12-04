'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type ChatItem = { role: 'user' | 'assistant'; content: string };

export default function LessonChat({ lessonId }: { lessonId: number }) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [items, loading]);

  async function send() {
    const prompt = msg.trim();
    if (!prompt || loading) return;

    setItems((prev) => [...prev, { role: 'user', content: prompt }]);
    setMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, message: prompt }),
      });

      const data = await res.json().catch(async () => ({
        error: await res.text(),
      }));

      if (!res.ok || !data || data.error) throw new Error(data?.error || 'Chat failed');

      const pretty = normalizeMarkdown(String(data.reply || ''));
      setItems((prev) => [...prev, { role: 'assistant', content: pretty }]);
    } catch (e) {
      setItems((prev) => [
        ...prev,
        { role: 'assistant', content: '_Xin lỗi, hiện không trả lời được._' },
      ]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
      <div className="px-4 py-3 border-b border-white/10 font-medium text-white">Gia sư AI</div>

      <div className="p-4 space-y-3 max-h-[420px] overflow-auto">
        {items.length === 0 && (
          <div className="text-sm text-white/60">Đặt câu hỏi về nội dung bài học này…</div>
        )}

        {items.map((it, i) =>
          it.role === 'user' ? (
            <div key={i} className="text-right">
              <UserBubble>{it.content}</UserBubble>
            </div>
          ) : (
            <div key={i} className="text-left">
              <AssistantBubble markdown={it.content} />
            </div>
          ),
        )}

        {loading && <div className="text-xs text-white/60">Đang suy nghĩ…</div>}
        <div ref={endRef} />
      </div>

      <div className="gap-2 border-t border-white/10 p-3 sm:flex">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập câu hỏi…"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-400/50"
        />
        <button
          onClick={send}
          disabled={loading || !msg.trim()}
          className="mt-2 w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

/* ============ UI Bubbles ============ */

function UserBubble({ children }: { children: string }) {
  return (
    <div className="inline-block max-w-[85%] rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white whitespace-pre-wrap shadow">
      {children}
    </div>
  );
}

function AssistantBubble({ markdown }: { markdown: string }) {
  // custom render code block có header + nút Copy
  const components = useMemo(
    () => ({
      code({
        inline,
        className,
        children,
        ...props
      }: {
        inline?: boolean;
        className?: string;
        children?: any;
      }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeText = String(children ?? '').replace(/\n$/, '');

        if (inline) {
          return (
            <code className="rounded bg-white/10 px-1 py-0.5" {...props}>
              {children}
            </code>
          );
        }

        return (
          <div className="my-2 overflow-hidden rounded-lg border border-white/10">
            <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <span>{match?.[1] || 'text'}</span>
              <button
                className="rounded border border-white/10 px-2 py-0.5 hover:bg-white/10"
                onClick={() => navigator.clipboard.writeText(codeText)}
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto bg-black/40 p-3 text-sm">
              <code className={className}>{codeText}</code>
            </pre>
          </div>
        );
      },
      a({ href = '', children, ...props }: any) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted hover:text-blue-300"
            {...props}
          >
            {children}
          </a>
        );
      },
      ul({ children, ...props }: any) {
        return (
          <ul className="my-2 list-disc space-y-1 pl-5" {...props}>
            {children}
          </ul>
        );
      },
      ol({ children, ...props }: any) {
        return (
          <ol className="my-2 list-decimal space-y-1 pl-5" {...props}>
            {children}
          </ol>
        );
      },
      p({ children, ...props }: any) {
        return (
          <p className="my-2" {...props}>
            {children}
          </p>
        );
      },
      h1({ children }: any) {
        return <h1 className="mb-2 mt-4 text-xl font-semibold">{children}</h1>;
      },
      h2({ children }: any) {
        return <h2 className="mb-2 mt-4 text-lg font-semibold">{children}</h2>;
      },
      h3({ children }: any) {
        return <h3 className="mb-1.5 mt-3 font-semibold">{children}</h3>;
      },
      table({ children, ...props }: any) {
        return (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm" {...props}>
              {children}
            </table>
          </div>
        );
      },
      th({ children, ...props }: any) {
        return (
          <th className="border border-white/10 bg-white/5 px-2 py-1 text-left" {...props}>
            {children}
          </th>
        );
      },
      td({ children, ...props }: any) {
        return (
          <td className="border border-white/10 px-2 py-1 align-top" {...props}>
            {children}
          </td>
        );
      },
    }),
    []
  );

  return (
    <div className="inline-block max-w-[85%] rounded-2xl bg-white/10 px-3 py-2 text-sm text-white shadow">
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/* ============ Helpers ============ */
function normalizeMarkdown(s: string) {
  return s.trim().replace(/\n{3,}/g, '\n\n').replace(/(^|[^\n])(\n#+\s)/g, (_, a, b) => `${a}\n${b}`);
}
