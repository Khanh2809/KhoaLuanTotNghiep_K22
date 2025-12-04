// app/admin/logs/page.tsx
import 'server-only';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function cookieHeader() {
  const jar = await cookies();
  return jar.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
}

async function fetchLogs() {
  const res = await fetch(`${API}/api/admin/logs?pageSize=50`, {
    cache: 'no-store',
    headers: { cookie: await cookieHeader() },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Failed (${res.status}) ${t}`);
  }
  return res.json();
}

export default async function AdminLogsPage() {
  const data = await fetchLogs();
  const rows: Array<any> = data.items || [];

  // Cấu hình cột cố định để thẳng hàng giữa header/body
  const cols = 'grid grid-cols-[180px_220px_140px_1fr]';

  // Helper gán màu nhẹ theo group action (USER/COURSE/MODULE/LESSON/…)
  const badgeClass = (action: string) => {
    const g = (action || '').split('.')[0];
    if (g === 'USER') return 'bg-blue-500/15 text-blue-300 border-blue-500/20';
    if (g === 'COURSE') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    if (g === 'MODULE') return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
    if (g === 'LESSON') return 'bg-purple-500/15 text-purple-300 border-purple-500/20';
    return 'bg-white/10 text-gray-300 border-white/15';
  };

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="text-sm text-gray-300">Audit Logs</div>
        <div className="text-xs text-gray-400">{rows.length} items</div>
      </div>

      {/* Table head */}
      <div className={`${cols} bg-white/5 px-4 py-2 text-sm text-gray-300`}>
        <div>Time</div>
        <div>Actor</div>
        <div>Action</div>
        <div>Target / Meta</div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-400">
          No audit logs yet.
        </div>
      ) : (
        rows.map((r, i) => (
          <div
            key={r.id}
            className={`${cols} items-center px-4 py-2.5 border-t border-white/10 text-sm
                        hover:bg-white/5 even:bg-white/[0.03]`}
          >
            {/* Time */}
            <div className="font-mono text-xs opacity-80">
              {new Date(r.createdAt).toLocaleString()}
            </div>

            {/* Actor */}
            <div className="truncate">
              {r.actor?.name || r.actor?.email || '—'}
            </div>

            {/* Action */}
            <div>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] uppercase tracking-wide ${badgeClass(
                  r.action
                )}`}
                title={r.action}
              >
                {r.action}
              </span>
            </div>

            {/* Target / Meta */}
            <div className="opacity-90 flex items-center gap-2 min-w-0">
              <span className="shrink-0">
                <span className="opacity-70">{r.targetType}</span>
                <span className="opacity-40">#</span>
                {r.targetId}
              </span>
              {r.meta ? (
                <code
                  className="truncate rounded bg-white/5 px-2 py-0.5 text-xs"
                  title={JSON.stringify(r.meta)}
                >
                  {JSON.stringify(r.meta)}
                </code>
              ) : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
