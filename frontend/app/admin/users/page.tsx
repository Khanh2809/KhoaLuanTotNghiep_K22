// app/admin/users/page.tsx
import 'server-only';
import { cookies } from 'next/headers';
import AdminRoleButton from '@/components/AdminRoleButton';
import AdminCreateUserButton from '@/components/AdminCreateUserButton';
import AdminEditUserButton from '@/components/AdminEditUserButton';
import AdminDeleteUserButton from '@/components/AdminDeleteUserButton';

export const dynamic = 'force-dynamic';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function cookieHeader() {
  const jar = await cookies();
  return jar.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
}

async function fetchUsers() {
  const res = await fetch(`${API}/api/admin/users`, {
    cache: 'no-store',
    headers: { cookie: await cookieHeader() },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Failed (${res.status}) ${t}`);
  }
  return res.json(); // { items: [...] }
}

type RowUser = { id: number; name: string | null; email: string; role: string };

export default async function AdminUsersPage() {
  const data = await fetchUsers();
  const items: RowUser[] = (data.items || []).map((u: any) => ({
    id: u.id,
    name: u.name ?? null,
    email: u.email,
    role: typeof u.role === 'string' ? u.role : (u.role?.name ?? '-'),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Quản lý người dùng</h1>
          <p className="text-sm text-white/60">Tổng số: <span className="tabular-nums">{items.length}</span> tài khoản</p>
        </div>
        <div className="flex items-center gap-2">
          {/* chừa chỗ cho filter/search sau này nếu cần */}
          <AdminCreateUserButton />
        </div>
      </div>

      {/* Bảng */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            {/* Cố định độ rộng từng cột để thẳng hàng */}
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[32%]" />
              <col className="w-[140px]" />
              <col className="w-[240px]" />
            </colgroup>

            <thead className="sticky top-0 z-10 bg-white/5 text-xs uppercase tracking-wide text-white/70">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {items.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-t border-white/10 ${i % 2 === 1 ? 'bg-white/[0.03]' : ''} hover:bg-white/[0.06] transition`}
                >
                  {/* Name + avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar seed={u.name || u.email} />
                      <div className="min-w-0">
                        <div className="truncate text-white">{u.name ?? '—'}</div>
                        <div className="text-xs text-white/50">ID: <span className="tabular-nums">{u.id}</span></div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <div className="truncate font-medium text-white/90">{u.email}</div>
                  </td>

                  {/* Role badge */}
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <AdminRoleButton uid={u.id} />
                      <AdminEditUserButton user={{ id: u.id, name: u.name, email: u.email, role: u.role }} />
                      <AdminDeleteUserButton uid={u.id} email={u.email} />
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10">
                    <div className="text-center">
                      <p className="text-sm text-white/70">Không có người dùng nào.</p>
                      <div className="mt-3 inline-block">
                        <AdminCreateUserButton />
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ Small UI helpers (server components đơn giản) ============ */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left font-normal text-white/70">{children}</th>
  );
}

/** Avatar tròn với chữ cái đầu (tạo từ name/email) */
function Avatar({ seed }: { seed: string }) {
  const initials = getInitials(seed);
  const hue = hashHue(seed);
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ background: `hsl(${hue} 70% 45% / 0.9)` }}
      aria-hidden
      title={seed}
    >
      {initials}
    </div>
  );
}

function getInitials(s: string) {
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (s[0] || '?').toUpperCase();
}

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** Badge vai trò, viết hoa vừa phải */
function RoleBadge({ role }: { role: string }) {
  const r = (role || '-').toLowerCase();
  const cls =
    r === 'admin'
      ? 'border-red-400/40 bg-red-500/15 text-red-200'
      : r === 'instructor'
      ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
      : r === 'student'
      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
      : 'border-white/20 bg-white/10 text-white/80';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs uppercase ${cls}`}>
      {role || '-'}
    </span>
  );
}
