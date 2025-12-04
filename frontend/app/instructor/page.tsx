import Link from "next/link";
import { cookies } from "next/headers";
import { Sparkles, BookOpen, UploadCloud, Clock, ExternalLink } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchMine(cookie: string) {
  const res = await fetch(`${BASE_URL}/api/instructor/courses/mine`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

const statusColor: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
  DRAFT: "bg-amber-500/15 text-amber-200 border border-amber-400/30",
  ARCHIVED: "bg-slate-500/20 text-slate-200 border border-slate-400/30",
};

export default async function InstructorHome() {
  const ck = (await cookies()).toString();
  const rows = await fetchMine(ck);

  const total = rows.length;
  const published = rows.filter((c: any) => c.status === "PUBLISHED").length;
  const drafts = rows.filter((c: any) => c.status !== "PUBLISHED").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Khu vực giảng viên</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Quản lý khóa học</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Giao diện đồng nhất với trang chủ: nền mờ, viền mềm, dễ thao tác. Tạo và theo dõi hiệu quả khoá học của bạn.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/instructor/courses/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Tạo khóa học
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
            >
              Xem trang chủ
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3 text-sm uppercase tracking-wide font-semibold text-white/80">Bảng thống kê</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Tổng khoá học</span>
              <BookOpen className="h-4 w-4 text-white/50" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{total}</p>
            <p className="text-xs text-white/60">Bao gồm nháp & xuất bản</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Đang xuất bản</span>
              <UploadCloud className="h-4 w-4 text-white/50" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{published}</p>
            <p className="text-xs text-white/60">Hiển thị với học viên</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Nháp / đang sửa</span>
              <Clock className="h-4 w-4 text-white/50" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{drafts}</p>
            <p className="text-xs text-white/60">Cần hoàn tất trước khi xuất bản</p>
          </div>
        </div>
      </div>

      {!rows.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 backdrop-blur">
          Chưa có khoá học. Bắt đầu với nút “Tạo khóa học” để dựng lộ trình mới cho học viên.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold text-white/80">
            <div className="flex items-center gap-2">
            <div className="sm:col-span-3 text-sm uppercase tracking-wide text-white/70">Danh sách khóa học</div>            </div>
            <span className="text-xs text-white/60">{rows.length} khóa</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((c: any) => {
              const badge = statusColor[c.status] || "bg-white/10 text-white border border-white/20";
              return (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-white/25 hover:shadow-lg"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-white">{c.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${badge}`}>
                      {c.status || "UNKNOWN"}
                    </span>
                  </div>
                  {c.category ? <p className="text-xs text-white/60">Chủ đề: {c.category}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/instructor/courses/${c.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                    >
                      Sửa
                    </Link>
                    <Link
                      href={`/instructor/courses/${c.id}/analytics`}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                    >
                      Phân tích
                    </Link>
                    {c.status === "PUBLISHED" && (
                      <Link
                        href={`/courses/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Xem (student)
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
