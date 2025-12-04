// components/AdminRoleButton.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';

type Props = { uid: number };
type Role = { id: number; name: string };

export default function AdminRoleButton({ uid }: Props) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<string>('instructor');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || roles.length) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/roles`, { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRoles(data || []);
        if (data?.[0]?.name) setSelected(data[0].name);
      } catch (e: any) {
        toast.error(e?.message || 'Không tải được danh sách role');
      }
    })();
  }, [open, roles.length]);

  async function setRole() {
    if (!selected) return;
    setLoading(true);

    const res = await fetch(`${API_BASE_URL}/api/admin/users/${uid}/role`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selected }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      toast.error(t || 'Cập nhật vai trò thất bại');
      setLoading(false);
      return;
    }

    location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-white/20 px-2 py-1 hover:bg-white/10"
      >
        Set role
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/80 p-5 space-y-3">
            <h3 className="text-base font-semibold text-white">Chọn vai trò</h3>
            <p className="text-sm text-white/60">Áp dụng cho user #{uid}</p>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-white"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={setRole}
                disabled={loading}
                className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-black hover:-translate-y-0.5 transition disabled:opacity-60"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
