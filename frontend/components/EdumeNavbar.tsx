'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-context';

const navLinks = [
  { href: '/courses', label: 'Khóa học' },
  { href: '/guide', label: 'Hướng dẫn' },
  { href: '/contact', label: 'Liên hệ' },
  { href: '/policy', label: 'Chính sách' },
];

export default function EdumeNavbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="relative flex items-center justify-between gap-6 border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur">
      <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
        PotatoEdu
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-slate-900 transition">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 text-sm font-semibold">
        {loading && <span className="text-slate-600">Đang tải...</span>}

        {!loading && !user && (
          <>
            <Link href="/auth/login" className="text-slate-700 hover:text-slate-900">
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Đăng ký
            </Link>
          </>
        )}

        {!loading && user && (
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-800 shadow-sm">
              <UserCircle2 className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">{user.name || 'Người dùng'}</span>
              {user.role && (
                <span className="text-[11px] uppercase text-slate-500">({user.role})</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
