import "server-only";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  LayoutGrid,
  Users,
  FileText,
  BookOpenCheck,
  ArrowRight,
  GraduationCap,
  Gauge,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Stats = {
  courses: number;
  publishedCourses?: number;
  draftCourses?: number;
  users: number;
  instructors?: number;
  lessons: number;
  enrollments?: number;
  logsToday: number;
  pendingRoleRequests?: number;
  topCourses?: Array<{ id: number; title: string; enrollments: number; status?: string }>;
  recentLogs?: Array<{
    id: number;
    action: string;
    targetType?: string | null;
    targetId?: number | null;
    createdAt: string;
    actor?: { id: number; name: string | null; email: string | null } | null;
  }>;
};

async function cookieHeader() {
  const jar = await cookies();
  return jar
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API}/api/admin/stats`, {
    cache: "no-store",
    headers: { cookie: await cookieHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed (${res.status}) ${t}`);
  }
  return res.json() as Promise<Stats>;
}

export default async function AdminHome() {
  let stats: Stats | null = null;
  let errorMsg: string | null = null;
  try {
    stats = await fetchStats();
  } catch (e: any) {
    errorMsg = e?.message || "Không tải được thống kê";
  }

  const card =
    "group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 hover:-translate-y-0.5";
  const title = "text-base font-semibold text-white flex items-center gap-2";
  const desc = "mt-1 text-sm text-white/70";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
        <span>Chức năng quản trị</span>
      </div>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/courses" className={card}>
          <div className={title}>
            <LayoutGrid className="h-5 w-5 text-white/90" />
            Quản lý khóa học
            <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100" />
          </div>
          <p className={desc}>Duyệt, publish/unpublish, gắn nổi bật, SEO.</p>
        </Link>

        <Link href="/admin/users" className={card}>
          <div className={title}>
            <Users className="h-5 w-5 text-white/90" />
            Quản lý người dùng
            <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100" />
          </div>
          <p className={desc}>Phân quyền, tìm kiếm tài khoản, đặt mật khẩu.</p>
        </Link>

        <Link href="/admin/logs" className={card}>
          <div className={title}>
            <FileText className="h-5 w-5 text-white/90" />
            Nhật ký hoạt động
            <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100" />
          </div>
          <p className={desc}>Theo dõi các hành động quản trị và sự kiện hệ thống.</p>
        </Link>
      </section>

      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
        <span>Bảng thống kê</span>
      </div>
      {errorMsg ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 space-y-2">
          <div>{errorMsg}</div>
          <div>
            Vui lòng đăng nhập bằng tài khoản admin.{" "}
            <Link href="/auth/login" className="underline underline-offset-4 text-red-100">
              Đăng nhập
            </Link>
          </div>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            title="Khóa học"
            value={(stats?.courses ?? 0).toLocaleString("vi-VN")}
            hint="Tổng số khóa học"
            icon={<LayoutGrid className="h-5 w-5" />}
          />
          <Stat
            title="Published / Draft"
            value={`${(stats?.publishedCourses ?? 0).toLocaleString("vi-VN")} / ${(stats?.draftCourses ?? 0).toLocaleString("vi-VN")}`}
            hint="Trạng thái khóa"
            icon={<Gauge className="h-5 w-5" />}
          />
          <Stat
            title="Người dùng"
            value={(stats?.users ?? 0).toLocaleString("vi-VN")}
            hint="Tổng tài khoản"
            icon={<Users className="h-5 w-5" />}
          />
          <Stat
            title="Giảng viên"
            value={(stats?.instructors ?? 0).toLocaleString("vi-VN")}
            hint="Tổng giảng viên"
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <Stat
            title="Bài học"
            value={(stats?.lessons ?? 0).toLocaleString("vi-VN")}
            hint="Tổng bài học"
            icon={<BookOpenCheck className="h-5 w-5" />}
          />
          <Stat
            title="Enrollments"
            value={(stats?.enrollments ?? 0).toLocaleString("vi-VN")}
            hint="Đang theo học"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <Stat
            title="Nhật ký hôm nay"
            value={(stats?.logsToday ?? 0).toLocaleString("vi-VN")}
            hint="Sự kiện hệ thống"
            icon={<FileText className="h-5 w-5" />}
          />
          <Stat
            title="Role request pending"
            value={(stats?.pendingRoleRequests ?? 0).toLocaleString("vi-VN")}
            hint="Chờ duyệt giảng viên"
            icon={<AlertTriangle className="h-5 w-5" />}
            cta={{ label: "Xem", href: "/admin/role-requests" }}
          />
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Top courses theo lượt đăng ký</h3>
            <Link href="/admin/courses" className="text-xs text-blue-300 underline underline-offset-4">
              Quản lý
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.topCourses ?? []).map((c, idx) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
                <div className="flex items-center justify-between text-sm text-white">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-white/70">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-[11px] uppercase text-white/50">{c.status}</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white/80">{c.enrollments.toLocaleString("vi-VN")} HV</div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (c.enrollments / Math.max(1, stats?.topCourses?.[0]?.enrollments || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(stats?.topCourses?.length ?? 0) === 0 && (
              <p className="text-sm text-white/60">Chưa có dữ liệu số lượt đăng ký.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Hoạt động gần đây</h3>
            <Link href="/admin/logs" className="text-xs text-blue-300 underline underline-offset-4">
              Xem tất cả
            </Link>
          </div>
          <ul className="space-y-3 text-sm text-white/80">
            {(stats?.recentLogs ?? []).map((log) => (
              <li key={log.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{log.action}</span>
                  <span className="text-[11px] text-white/50">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {log.actor?.email ? `By ${log.actor.email}` : "By system"}
                  {log.targetType ? ` · Target: ${log.targetType}${log.targetId ? ` #${log.targetId}` : ""}` : ""}
                </div>
              </li>
            ))}
            {(stats?.recentLogs?.length ?? 0) === 0 && (
              <li className="text-sm text-white/60">Chưa có log.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stat({
  title,
  value,
  hint,
  icon,
  cta,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-white">
        <div className="rounded-lg border border-white/10 bg-white/10 p-2">{icon}</div>
        <div className="text-sm text-white/80">{title}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint && <div className="text-xs text-white/50">{hint}</div>}
      {cta && (
        <Link href={cta.href} className="mt-2 inline-block text-xs text-blue-300 underline underline-offset-4">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
