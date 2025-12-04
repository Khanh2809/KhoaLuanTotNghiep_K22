'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';
import { toast } from 'sonner';
import { useAuth } from '@/lib/providers/auth-context';

export default function EnrollButton({ courseId, defaultEnrolled = false }: { courseId: number; defaultEnrolled?: boolean }) {
  const [enrolled, setEnrolled] = useState(defaultEnrolled);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  async function enroll() {
    if (enrolled || loading) return;
    if (!authLoading && !user) {
      toast.info('Bạn cần đăng nhập để đăng ký khoá học.');
      router.push('/auth/login');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ENROLLMENTS.ROOT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.info('Vui lòng đăng nhập để đăng ký.');
          router.push('/auth/login');
          return;
        }
        const msg = await res.text();
        throw new Error(msg || 'Enroll failed');
      }
      setEnrolled(true);
      router.refresh();
      toast.success('Đăng ký khoá học thành công');
    } catch (e) {
      console.error(e);
      toast.error('Đăng ký khoá học thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={enroll}
      disabled={enrolled || loading}
      className={`rounded-md px-4 py-2 ${enrolled ? 'bg-gray-400 text-black cursor-not-allowed' : 'bg-white text-black hover:-translate-y-0.5 hover:shadow transition'}`}
      aria-disabled={enrolled || loading}
      title={enrolled ? 'Already enrolled' : 'Enroll this course'}
    >
      {enrolled ? 'Đã đăng ký' : loading ? 'Đang đăng ký...' : 'Đăng ký'}
    </button>
  );
}
