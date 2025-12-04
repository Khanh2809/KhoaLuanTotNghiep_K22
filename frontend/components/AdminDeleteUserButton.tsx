'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';

export default function AdminDeleteUserButton({ uid, email }: { uid: number; email: string }) {
  const [busy, setBusy] = useState(false);

  async function deleteUser() {
    if (!confirm(`Delete user ${email}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${uid}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      location.reload();
    } catch (e: any) {
      toast.error(e?.message || 'Xoá người dùng thất bại');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={deleteUser}
      disabled={busy}
      className="rounded border border-white/20 px-2 py-1 text-red-400 hover:bg-white/10"
    >
      Delete
    </button>
  );
}
