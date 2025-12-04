'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-context';
import { ROLES } from '@/lib/constants';
import clsx from 'clsx';
import { useState } from 'react';
import {
  Menu, X, LogOut, LogIn, UserPlus,
  BookOpen, GraduationCap, LayoutDashboard,
  Info, Shield, Phone, Sparkles, Route, Award,
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    await logout();
    router.push('/');
  }

  const linkBase = 'text-sm rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap';
  const makeLink = (href: string) =>
    clsx(
      linkBase,
      pathname.startsWith(href)
        ? 'border border-blue-500/50 bg-blue-500/10 text-white font-medium'
        : 'text-white/80 hover:text-white hover:bg-white/10'
    );

  const NavLinks = () => (
    <>
      <Link href="/courses" className={makeLink('/courses')}>
        <span className="inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Khóa học
        </span>
      </Link>
      <Link href="/learning-paths" className={makeLink('/learning-paths')}>
        <span className="inline-flex items-center gap-2">
          <Route className="h-4 w-4" /> Lộ trình học
        </span>
      </Link>

      {/* Info / policy / contact */}
      <Link href="/guide" className={makeLink('/guide')}>
        <span className="inline-flex items-center gap-2">
          <Info className="h-4 w-4" /> Giới thiệu
        </span>
      </Link>
      <Link href="/policy" className={makeLink('/policy')}>
        <span className="inline-flex items-center gap-2">
          <Shield className="h-4 w-4" /> Chính sách
        </span>
      </Link>
      <Link href="/contact" className={makeLink('/contact')}>
        <span className="inline-flex items-center gap-2">
          <Phone className="h-4 w-4" /> Liên hệ
        </span>
      </Link>
      {user && (
        <Link href="/certificates" className={makeLink('/certificates')}>
          <span className="inline-flex items-center gap-2">
            <Award className="h-4 w-4" /> Chứng chỉ
          </span>
        </Link>
      )}

      {user?.role === ROLES.STUDENT && (
        <Link href="/role-request" className={makeLink('/role-request')}>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Đăng ký GV
          </span>
        </Link>
      )}

      {user?.role === ROLES.INSTRUCTOR && (
        <Link href="/instructor" className={makeLink('/instructor')}>
          <span className="inline-flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Giảng viên
          </span>
        </Link>
      )}
      {user?.role === ROLES.ADMIN && (
        <Link href="/admin" className={makeLink('/admin')}>
          <span className="inline-flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" /> Quản trị
          </span>
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50">
      <div className="w-full border-b border-white/10 bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-black/40">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-semibold tracking-tight text-white">
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              MoveUp
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-1 items-center gap-3">
            <NavLinks />
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 whitespace-nowrap">
            <GlobalSearch />
            {loading && <span className="text-sm text-white/60">Dang tai...</span>}

            {!loading && !user && (
              <>
                <Link href="/auth/login" className={makeLink('/auth/login')}>
                  <span className="inline-flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Đăng nhập
                  </span>
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md bg-white text-black text-sm px-3 py-1.5 hover:-translate-y-0.5 active:translate-y-0 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Đăng ký
                  </span>
                </Link>
              </>
            )}

            {!loading && user && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-white/80">
                  Chào, <span className="font-medium text-white">{user.name}</span>
                </span>
                <span className="rounded-full bg-white/10 text-white text-[11px] px-2 py-0.5 uppercase border border-white/10">
                  {user.role}
                </span>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 text-sm rounded-md px-3 py-1.5 border border-white/15 text-white/90 hover:bg-white/10 transition"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/90 hover:bg-white/10 transition"
              onClick={() => setOpen(v => !v)}
              aria-label="Mo menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-b border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            <NavLinks />
            {!loading && !user && (
              <div className="mt-2 flex gap-2">
                <Link href="/auth/login" className={makeLink('/auth/login')}>Đăng nhập</Link>
                <Link href="/auth/register" className="rounded-md bg-white px-3 py-1.5 text-sm text-black">Đăng ký</Link>
              </div>
            )}
            {!loading && user && (
              <button
                onClick={onLogout}
                className="mt-2 inline-flex items-center gap-2 text-sm rounded-md px-3 py-1.5 border border-white/15 text-white/90 hover:bg-white/10 transition"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
