'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';

type AdminUser = { id: number; name: string | null; email: string; role: string };
type Role = { id: number; name: string };

export default function AdminEditUserButton({ user }: { user: AdminUser }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState({
    name: user.name ?? '',
    email: user.email,
    password: '',
    role: user.role,
  });

  useEffect(() => {
    if (!open || roles.length) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/roles`, { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRoles(data || []);
        if (data?.[0]?.name && !form.role) {
          setForm((f) => ({ ...f, role: data[0].name }));
        }
      } catch (e: any) {
        toast.error(e?.message || 'Không tải được danh sách role');
      }
    })();
  }, [open, roles.length, form.role]);

  async function editUser() {
    setBusy(true);
    try {
      const payload: any = {
        name: form.name || undefined,
        email: form.email || undefined,
        role: form.role || undefined,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      location.reload();
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật người dùng thất bại');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={busy}
        className="rounded border border-white/20 px-2 py-1 hover:bg-white/10"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/80 p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">Sửa người dùng #{user.id}</h3>
            <div className="grid gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded border border-white/10 bg-black/30 px-3 py-2 text-white"
                placeholder="Name"
              />
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded border border-white/10 bg-black/30 px-3 py-2 text-white"
                placeholder="Email"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="rounded border border-white/10 bg-black/30 px-3 py-2 text-white"
                placeholder="New password (optional)"
              />
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="rounded border border-white/10 bg-black/30 px-3 py-2 text-white"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                onClick={editUser}
                disabled={busy}
                className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-black hover:-translate-y-0.5 transition disabled:opacity-60"
              >
                {busy ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
