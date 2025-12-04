'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';

export default function AdminCreateCourseButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function createCourse() {
    const title = prompt('Course title') ?? '';
    if (!title) return;
    setBusy(true);
    const res = await fetch(`${API_BASE_URL}/api/admin/courses`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ title }),
    });
    setBusy(false);
    const data = await res.json().catch(()=> ({}));
    if (!res.ok) {
      toast.error(data?.error || 'Tạo khoá học thất bại');
      return;
    }
    toast.success('Đã tạo khoá học mới');
    router.push(`/admin/courses/${data.id}/edit`);
  }

  return (
    <button
      onClick={createCourse}
      disabled={busy}
      className="rounded border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50">
      {busy ? 'Creating…' : '+ Create course'}
    </button>
  );
}
