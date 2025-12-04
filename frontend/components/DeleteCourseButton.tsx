'use client';

import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';

export default function DeleteCourseButton({ id }: { id: number }) {
  async function del() {
    if (!confirm(`Delete course #${id}?`)) return;
    const res = await fetch(`${API_BASE_URL}/api/admin/courses/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const message = await res.text();
      toast.error(message || 'Xoá khoá học thất bại');
    } else {
      toast.success('Đã xoá khoá học');
      location.reload();
    }
  }
  return (
    <button onClick={del} className="text-red-400 hover:underline">Delete</button>
  );
}
