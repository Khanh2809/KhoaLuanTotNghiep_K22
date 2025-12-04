// app/admin/layout.tsx
'use client';

import RequireAuth from '@/lib/providers/RequireAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Shield, LayoutGrid, Users, FileText } from 'lucide-react';

const navItems = [
  { href: '/admin/courses', label: 'Khóa Học', icon: LayoutGrid },
  { href: '/admin/users', label: 'Người Dùng', icon: Users },
  { href: '/admin/logs', label: 'Nhật Ký', icon: FileText },
  { href: '/admin/role-requests', label: 'Yêu Cầu Quyền', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireAuth roles={['admin']}>
      {/* Topbar glass */}
      <div className="sticky top-14 z-40 border-b border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-white/80" />
            <h1 className="text-base font-semibold text-white">Bảng Điều Khiển</h1>
            <span className="ml-2 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] uppercase text-white/80">
              Admin
            </span>
          </div>

          {/* Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition',
                    active
                      ? 'border border-blue-500/40 bg-blue-500/15 text-white'
                      : 'border border-transparent text-white/80 hover:border-white/15 hover:bg-white/10'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page container */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Secondary nav (mobile pills) */}
        <div className="md:hidden mb-4 flex flex-wrap gap-2">
          {navItems.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'rounded-full px-3 py-1 text-sm transition',
                  active
                    ? 'border border-blue-500/40 bg-blue-500/15 text-white'
                    : 'border border-white/10 text-white/80 hover:bg-white/10'
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Page body in a glass card for coherence */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-5">
          {children}
        </div>
      </div>
    </RequireAuth>
  );
}
