"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/lib/providers/auth-context";
import { deleteReview, fetchReviews, submitReview, ReviewItem } from "@/lib/reviews";
import clsx from "clsx";

type Props = {
  courseId: number;
  enrolled: boolean;
};

export default function CourseReviews({ courseId, enrolled }: Props) {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews(courseId).then(setItems).catch(() => setItems([]));
  }, [courseId]);

  const avg = useMemo(() => {
    if (!items.length) return 0;
    const sum = items.reduce((s, r) => s + (r.rating ?? 0), 0);
    return sum / items.length;
  }, [items]);

  const isModerator = user?.role === "admin" || user?.role === "instructor";
  const canWrite = enrolled && !!user && !isModerator;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(courseId, rating, text);
      const data = await fetchReviews(courseId);
      setItems(data);
      setText("");
    } catch (err: any) {
      if (err?.message === "UNAUTH") setError("Ban can dang nhap de danh gia.");
      else if (typeof err?.message === "string" && err.message.toLowerCase().includes("khong phu hop")) {
        setError("Noi dung chua tu ngu khong phu hop, vui long chinh sua.");
      } else setError(err?.message || "Khong gui duoc danh gia.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteReview(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err?.message || "Xoa danh gia that bai");
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Danh gia khoa hoc</h2>
          <p className="text-sm text-white/60">Chia se trai nghiem de giup nguoi hoc khac.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white">
          <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
          <span>{avg.toFixed(1)}</span>
          <span className="text-xs text-white/60">({items.length})</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          <Shield className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {!isModerator ? (
          <>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  className="group"
                  aria-label={`Chon ${v} sao`}
                >
                  <Star
                    className={clsx(
                      "h-7 w-7 transition",
                      v <= rating ? "text-amber-300" : "text-white/20 group-hover:text-white/50"
                    )}
                    fill={v <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
              <span className="text-sm text-white/70">{rating} / 5</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={canWrite ? "Chia se cam nhan cua ban (khong bat buoc)" : "Dang nhap va dang ky khoa hoc de danh gia"}
              className="w-full min-h-[80px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/30 focus:outline-none"
              disabled={!canWrite || submitting}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/60">
                {loading
                  ? "Dang tai thong tin..."
                  : canWrite
                  ? "Ban co the cap nhat danh gia bat cu luc nao."
                  : "Chi hoc vien da dang ky moi duoc danh gia."}
              </div>
              <button
                type="submit"
                disabled={!canWrite || submitting}
                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {submitting ? "Dang gui..." : "Gui danh gia"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
            Ban la {user?.role}, khong can gui danh gia.
          </div>
        )}
      </form>

      <div className="space-y-2">
        {items.length === 0 && <div className="text-sm text-white/60">Chua co danh gia nao.</div>}
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-white">
                  <span className="font-semibold">{r.user?.name || "Nguoi dung"}</span>
                  <span className="text-white/50">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-200">
                    <Star className="h-4 w-4" fill="currentColor" /> {r.rating}/5
                  </span>
                </div>
                {r.createdAt && (
                  <div className="text-xs text-white/50">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</div>
                )}
                {r.review && <p className="mt-2 text-sm text-white/80 whitespace-pre-line">{r.review}</p>}
              </div>
              {(isModerator || r.user?.id === user?.id) && (
                <button
                  onClick={() => handleDelete(r.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/70 hover:bg-white/10"
                  aria-label="Xoa danh gia"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
