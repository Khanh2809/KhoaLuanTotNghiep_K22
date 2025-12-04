'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-context';
import { createRoleRequest, fetchMyRoleRequests } from '@/lib/api';
import { CheckCircle2, Clock, ShieldAlert, Sparkles } from 'lucide-react';

type RoleRequest = {
  id: number;
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string | null;
  adminId?: number | null;
  createdAt: string;
  updatedAt: string;
};

const statusStyles: Record<RoleRequest['status'], string> = {
  PENDING: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  APPROVED: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
};

export default function RoleRequestPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<RoleRequest[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const latest = useMemo(() => items?.[0], [items]);
  const hasPending = latest?.status === 'PENDING';

  useEffect(() => {
    if (!user) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadData() {
    try {
      const data = await fetchMyRoleRequests();
      setItems(Array.isArray(data) ? data : data?.items ?? []);
    } catch (e: any) {
      setError(e?.message || 'Không tải được yêu cầu');
    }
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await createRoleRequest(note.trim() || undefined);
      setSuccess('Đã gửi yêu cầu. Vui lòng đợi quản trị viên duyệt.');
      setNote('');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-white/70">Đang tải...</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        <h1 className="text-2xl font-semibold text-white">Đăng ký giảng viên</h1>
        <p className="text-white/70">
          Bạn cần đăng nhập để gửi yêu cầu.
          <Link href="/auth/login" className="ml-2 text-blue-300 underline underline-offset-4">Đăng nhập</Link>
        </p>
      </div>
    );
  }

  if (user.role === 'instructor' || user.role === 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          <div>
            <h1 className="text-xl font-semibold text-white">Bạn đã có quyền giảng viên</h1>
            <p className="text-sm text-white/70">
              Hãy truy cập <Link href="/instructor" className="underline text-blue-300">khu vực giảng viên</Link> để quản lý khóa học.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-200 flex items-center justify-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Đăng ký trở thành giảng viên</h1>
          <p className="text-white/70 text-sm">
            Gửi yêu cầu để quản trị viên duyệt. Sau khi duyệt, tài khoản của bạn sẽ được nâng role và nhận thông báo.
          </p>
        </div>
      </header>

      {/* Status card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Trạng thái mới nhất</p>
            <p className="text-lg font-semibold text-white">
              {latest ? `#${latest.id} - ${latest.requestedRole}` : 'Chưa có yêu cầu nào'}
            </p>
          </div>
          {latest && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[latest.status]}`}>
              {latest.status}
            </span>
          )}
        </div>
        {latest?.note && (
          <p className="text-sm text-white/70">Ghi chú: {latest.note}</p>
        )}
        {latest && (
          <p className="text-xs text-white/50">
            Gửi lúc {new Date(latest.createdAt).toLocaleString()} • Cập nhật {new Date(latest.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-white">Giới thiệu ngắn / lý do (tuỳ chọn)</label>
          <textarea
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: kinh nghiệm giảng dạy, chứng chỉ, các khoá dự kiến..."
            disabled={submitting || hasPending}
          />
        </div>

        {error && <p className="text-sm text-rose-200">{error}</p>}
        {success && <p className="text-sm text-emerald-200">{success}</p>}

        <button
          disabled={submitting || hasPending}
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {hasPending ? <Clock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {hasPending ? 'Đang chờ duyệt' : submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
        {hasPending && (
          <p className="text-xs text-white/60">Bạn đã có yêu cầu đang chờ duyệt. Vui lòng đợi quản trị viên xử lý.</p>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-base font-semibold text-white mb-3">Lịch sử yêu cầu</h2>
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white">
                  #{r.id} · {r.requestedRole}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[r.status]}`}>
                  {r.status}
                </span>
              </div>
              {r.note && <p className="mt-1 text-sm text-white/70">Ghi chú: {r.note}</p>}
              <p className="mt-1 text-xs text-white/50">
                Gửi {new Date(r.createdAt).toLocaleString()} · Cập nhật {new Date(r.updatedAt).toLocaleString()}
                {r.adminId ? ` · Admin #${r.adminId}` : ''}
              </p>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-white/60">Chưa có yêu cầu nào.</p>}
        </div>
      </div>
    </div>
  );
}
