import Link from 'next/link';
import { cookies } from 'next/headers';
import { fetchMyCertificates } from '@/lib/api';
import { Award, Shield, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const cookieHeader = (await cookies()).toString();
  let certs: Awaited<ReturnType<typeof fetchMyCertificates>> = [];
  let error: string | null = null;
  try {
    certs = await fetchMyCertificates(cookieHeader);
  } catch (e: any) {
    error = e?.message || 'Khong tai duoc chung chi';
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Award className="h-4 w-4" /> Chung chi
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Chung chi cua toi</h1>
          <p className="text-sm text-white/70">Kiem tra ma xac thuc, tai link chung chi.</p>
        </div>
        <Link
          href="/certificates/verify"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30"
        >
          Xac thuc ma
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          <Shield className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {certs.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">Chua co chung chi.</div>}
        {certs.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-white">{c.courseTitle ?? 'Khoa hoc'}</div>
                <p className="text-sm text-white/60">Ma xac thuc: <span className="font-mono text-white">{c.verificationCode}</span></p>
                {c.issueDate && <p className="text-xs text-white/50">Cap ngay: {new Date(c.issueDate).toLocaleDateString('vi-VN')}</p>}
                {c.expiresAt && <p className="text-xs text-white/50">Het han: {new Date(c.expiresAt).toLocaleDateString('vi-VN')}</p>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href={`/certificates/verify?code=${c.verificationCode}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-white/80 hover:border-white/30 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" /> Xac thuc
                </Link>
                {c.courseId && (
                  <Link
                    href={`/courses/${c.courseId}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-white/80 hover:border-white/30 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" /> Khoa hoc
                  </Link>
                )}
                {c.certificateUrl && (
                  <Link
                    href={c.certificateUrl}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-white/80 hover:border-white/30 hover:text-white"
                    target="_blank"
                  >
                    <ExternalLink className="h-4 w-4" /> Xem file
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
