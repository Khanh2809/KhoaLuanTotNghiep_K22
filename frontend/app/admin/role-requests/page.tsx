'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApproveRoleRequest, adminFetchRoleRequests, adminRejectRoleRequest } from '@/lib/api';
import { ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';

type RoleRequestRow = {
  id: number;
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string | null; email: string; role?: { name?: string } | null };
  admin?: { id: number; name: string | null; email: string } | null;
};

const badge: Record<RoleRequestRow['status'], string> = {
  PENDING: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  APPROVED: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
};

export default function AdminRoleRequestsPage() {
  const [items, setItems] = useState<RoleRequestRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);

  const pendingCount = useMemo(() => items.filter(i => i.status === 'PENDING').length, [items]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchRoleRequests(statusFilter);
      setItems(data?.items ?? []);
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: number) {
    setActioning(id);
    setError(null);
    try {
      await adminApproveRoleRequest(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Duyệt thất bại');
    } finally {
      setActioning(null);
    }
  }

  async function reject(id: number) {
    const note = window.prompt('Ghi chú (tuỳ chọn):') || undefined;
    setActioning(id);
    setError(null);
    try {
      await adminRejectRoleRequest(id, note);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Từ chối thất bại');
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-200 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Yêu cầu lên giảng viên</h1>
            <p className="text-sm text-white/70">Pending: <span className="tabular-nums">{pendingCount}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                statusFilter === s
                  ? 'border border-blue-400/50 bg-blue-500/15 text-white'
                  : 'border border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-100 text-sm">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/70">
              <tr>
                <Th>ID</Th>
                <Th>Người dùng</Th>
                <Th>Role hiện tại</Th>
                <Th>Yêu cầu</Th>
                <Th>Ngày</Th>
                <Th>Ghi chú</Th>
                <Th>Hành động</Th>
              </tr>
            </thead>
            <tbody className="text-white/90">
              {items.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 1 ? 'bg-white/[0.03]' : ''}>
                  <td className="px-4 py-3 text-white/80">#{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{r.user?.name || '(No name)'}</div>
                    <div className="text-xs text-white/60">{r.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase text-white/80">
                      {r.user?.role?.name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${badge[r.status]}`}>
                        {r.status}
                      </span>
                      <span className="text-white/80">{r.requestedRole}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">
                    <div>Gửi: {new Date(r.createdAt).toLocaleString()}</div>
                    <div>Cập nhật: {new Date(r.updatedAt).toLocaleString()}</div>
                    {r.admin && <div>Admin: {r.admin.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">
                    {r.note ? r.note : <span className="text-white/40">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'PENDING' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={actioning === r.id}
                          onClick={() => approve(r.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-black hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-60"
                        >
                          <ThumbsUp className="h-4 w-4" /> Approve
                        </button>
                        <button
                          disabled={actioning === r.id}
                          onClick={() => reject(r.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-60"
                        >
                          <ThumbsDown className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-white/60">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                    Không có yêu cầu nào.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                    Đang tải...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
