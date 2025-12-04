import 'server-only'
import { cookies } from 'next/headers'
import Link from 'next/link'
import AdminActionButtons from '@/components/AdminActionButtons'
import AdminCreateCourseButton from '@/components/AdminCreateCourseButton'
import DeleteCourseButton from '@/components/DeleteCourseButton'
import { LayoutGrid, Users, FileText, BookOpenCheck, ArrowRight, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function cookieHeader() {
  const jar = await cookies()
  return jar.getAll().map(({ name, value }) => `${name}=${value}`).join('; ')
}

async function fetchAdminCourses() {
  const res = await fetch(`${API}/api/admin/courses`, {
    cache: 'no-store',
    headers: { cookie: await cookieHeader() },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`)
  return res.json()
}

function StatusBadge({ status }: { status: string }) {
  const isPub = status?.toUpperCase() === 'PUBLISHED'
  return (
    <span
      className={[
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs uppercase tracking-wide',
        isPub
          ? 'border-green-500/30 bg-green-500/10 text-green-300'
          : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
      ].join(' ')}
      title={isPub ? 'Đã xuất bản' : 'Bản nháp'}
    >
      {isPub ? 'PUBLISHED' : 'DRAFT'}
    </span>
  )
}

export default async function AdminCoursesPage() {
  let data: any = null
  let errorMsg: string | null = null
  try {
    data = await fetchAdminCourses()
  } catch (e: any) {
    errorMsg = e?.message || 'Không tải được danh sách khoá học'
  }
  const items: any[] = data?.items || []

  const cols = 'grid grid-cols-[2fr_140px_160px_1fr_300px]'

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h1 className="text-base font-semibold text-white">Quản lý khoá học</h1>
          <p className="text-xs text-white/60">Tổng số: <span className="tabular-nums">{items.length}</span></p>
        </div>
        <AdminCreateCourseButton />
      </div>

      {errorMsg ? (
        <div className="p-6 text-sm text-red-200">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 space-y-2">
            <div>{errorMsg}</div>
            <div>
              Vui lòng đăng nhập bằng tài khoản admin hoặc thử lại.
              <Link href="/auth/login" className="ml-1 underline underline-offset-4 text-red-100">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`${cols} bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-white/70`}>
            <div>Tiêu đề</div>
            <div>Trạng thái</div>
            <div>Nổi bật</div>
            <div>Giảng viên</div>
            <div>Hành động</div>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/70">Chưa có khoá học nào.</div>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                className={`${cols} items-center px-4 py-3 border-t border-white/10 text-sm hover:bg-white/[0.06] even:bg-white/[0.03] transition`}
              >
                <div className="min-w-0 truncate">
                  <Link href={`/admin/courses/${c.id}/edit`} className="hover:underline text-white">
                    {c.title}
                  </Link>
                  <div className="text-xs text-white/50">ID: <span className="tabular-nums">{c.id}</span></div>
                </div>

                <div><StatusBadge status={c.status} /></div>

                <div>
                  {c.featured ? (
                    <span className="inline-flex items-center rounded-md border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-xs text-blue-200">
                      Có {typeof c.featuredRank === 'number' ? `(hạng ${c.featuredRank})` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-white/60">Không</span>
                  )}
                </div>

                <div className="truncate text-white/90">{c.instructor?.name ?? '---'}</div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/courses/${c.id}/edit`}
                    className="rounded border border-white/20 px-2 py-1 text-white/90 hover:bg-white/10"
                  >
                    Sửa
                  </Link>
                  <Link
                    href={`/courses/${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-white/20 px-2 py-1 text-white/90 hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Xem (student)
                  </Link>
                  <AdminActionButtons course={c} />
                  <DeleteCourseButton id={c.id} />
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
