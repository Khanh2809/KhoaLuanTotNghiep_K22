"use client";

import { useEffect, useState } from "react";
import { MessageCircle, SendHorizonal, Trash2, Reply, Shield } from "lucide-react";
import { useAuth } from "@/lib/providers/auth-context";
import { Question, fetchQuestions, createQuestion, deleteQuestion, canModerateQuestion } from "@/lib/questions";
import clsx from "clsx";

type Props = { lessonId: number };

export default function LessonQA({ lessonId }: Props) {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Question[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions(lessonId).then(setItems).catch(() => setItems([]));
  }, [lessonId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Ban can dang nhap de dat cau hoi.");
      return;
    }
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createQuestion(lessonId, content.trim(), replyTo ?? undefined);
      const data = await fetchQuestions(lessonId);
      setItems(data);
      setContent("");
      setReplyTo(null);
    } catch (err: any) {
      if (err?.message === "UNAUTH") setError("Ban can dang nhap de dat cau hoi.");
      else if (typeof err?.message === "string" && err.message.toLowerCase().includes("khong phu hop")) {
        setError("Noi dung chua tu ngu khong phu hop, vui long chinh sua.");
      } else setError(err?.message || "Khong gui duoc cau hoi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteQuestion(lessonId, id);
      const data = await fetchQuestions(lessonId);
      setItems(data);
    } catch (err: any) {
      setError(err?.message || "Xoa that bai");
    }
  }

  const canModerate = canModerateQuestion(user);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4 space-y-4">
      <div className="flex items-center gap-2 text-white">
        <MessageCircle className="h-5 w-5" />
        <div>
          <div className="text-lg font-semibold">Hoi dap / Thao luan</div>
          <div className="text-xs text-white/60">Dat cau hoi hoac binh luan ve bai hoc nay.</div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          <Shield className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            <span>Tra loi binh luan #{replyTo}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-white/60 hover:text-white">Huy</button>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={user ? "Viet binh luan hoac cau hoi..." : "Dang nhap de thao luan"}
          className="w-full min-h-[80px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/30 focus:outline-none"
          disabled={submitting}
        />
        <div className="flex items-center justify-between text-xs text-white/60">
          <div>{loading ? "Dang tai..." : user ? `Dang nhap: ${user.email}` : "Chua dang nhap"}</div>
          <button
            type="submit"
            disabled={submitting || !user || !content.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <SendHorizonal className="h-4 w-4" />
            Gui
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-white/60">Chua co thao luan.</div>}
        {items.map((q) => (
          <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <QuestionRow
              data={q}
              canModerate={canModerate || q.user?.id === user?.id}
              onReply={() => setReplyTo(q.id)}
              onDelete={() => onDelete(q.id)}
            />
            {q.replies && q.replies.length > 0 && (
              <div className="space-y-2 rounded-lg border border-white/5 bg-black/20 p-2">
                {q.replies.map((r) => (
                  <QuestionRow
                    key={r.id}
                    data={r}
                    canModerate={canModerate || r.user?.id === user?.id}
                    onReply={() => setReplyTo(q.id)}
                    onDelete={() => onDelete(r.id)}
                    isReply
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionRow({
  data,
  canModerate,
  onReply,
  onDelete,
  isReply,
}: {
  data: Question;
  canModerate: boolean;
  onReply: () => void;
  onDelete: () => void;
  isReply?: boolean;
}) {
  return (
    <div className={clsx("flex items-start gap-3", isReply && "pl-2")}>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm text-white">
          <span className="font-semibold">{data.user?.name || "Nguoi dung"}</span>
          {data.user?.role && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-white/70">{data.user.role}</span>}
          {data.createdAt && <span className="text-xs text-white/50">{new Date(data.createdAt).toLocaleString("vi-VN")}</span>}
        </div>
        <p className="mt-1 whitespace-pre-line text-sm text-white/80">{data.content}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
          <button onClick={onReply} className="inline-flex items-center gap-1 hover:text-white">
            <Reply className="h-3.5 w-3.5" /> Tra loi
          </button>
          {canModerate && (
            <button onClick={onDelete} className="inline-flex items-center gap-1 hover:text-red-200 text-red-300">
              <Trash2 className="h-3.5 w-3.5" /> Xoa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
