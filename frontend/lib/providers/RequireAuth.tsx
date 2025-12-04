// Bảo vệ quyền FE
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-context';

export default function RequireAuth({
  children,
  roles,                // optional: ['instructor','admin']
}: { children: React.ReactNode; roles?: Array<'student'|'instructor'|'admin'> }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login');
      else if (roles && !roles.includes(user.role)) router.replace('/');
    }
  }, [user, loading, roles, router]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (!user) return null; // đang redirect
  if (roles && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
