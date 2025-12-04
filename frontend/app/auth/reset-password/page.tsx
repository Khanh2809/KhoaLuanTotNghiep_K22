'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Check } from 'lucide-react';

function ResetPasswordInner() {
  const search = useSearchParams();
  const router = useRouter();

  const uid = useMemo(() => search.get('uid') || '', [search]);
  const token = useMemo(() => search.get('token') || '', [search]);

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [touched, setTouched] = useState<{ pw?: boolean; pw2?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const pwInvalid = !!touched.pw && (!pw || pw.length < 6);
  const pw2Invalid = !!touched.pw2 && (pw2 !== pw);

  useEffect(() => {
    // Nếu thiếu uid/token thì quay lại Forgot Password
    if (!uid || !token) {
      setErr('Liên kết không hợp lệ hoặc đã hết hạn.');
    }
  }, [uid, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!uid || !token) {
      setErr('Liên kết không hợp lệ.');
      return;
    }
    if (!pw || pw.length < 6) {
      setTouched(t => ({ ...t, pw: true }));
      return;
    }
    if (pw2 !== pw) {
      setTouched(t => ({ ...t, pw2: true }));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, token, newPassword: pw }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Đặt lại mật khẩu thất bại');

      setMsg('Đặt lại mật khẩu thành công. Đang chuyển bạn tới trang đăng nhập…');
      setTimeout(() => router.replace('/auth/login'), 1500);
    } catch (e: any) {
      setErr(e.message || 'Có lỗi xảy ra, thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h1>
          <p className="mt-1 text-sm text-white/60">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* New password */}
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="pw">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                id="pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, pw: true }))}
                placeholder="••••••"
                aria-invalid={pwInvalid}
                aria-describedby="pw-help"
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40
                focus:outline-none focus:ring-2 transition
                ${pwInvalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="pw-help" className={`mt-1 text-xs ${pwInvalid ? 'text-red-400' : 'text-white/50'}`}>
              {pwInvalid ? 'Mật khẩu tối thiểu 6 ký tự.' : 'Chọn mật khẩu mạnh và dễ nhớ.'}
            </p>
          </div>

          {/* Confirm */}
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="pw2">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                id="pw2"
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, pw2: true }))}
                placeholder="••••••"
                aria-invalid={pw2Invalid}
                aria-describedby="pw2-help"
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40
                focus:outline-none focus:ring-2 transition
                ${pw2Invalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="pw2-help" className={`mt-1 text-xs ${pw2Invalid ? 'text-red-400' : 'text-white/50'}`}>
              {pw2Invalid ? 'Mật khẩu nhập lại không khớp.' : 'Nhập lại chính xác để xác nhận.'}
            </p>
          </div>

          {err && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
          {msg && <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{msg}</div>}

          <button
            disabled={loading || !uid || !token}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:-translate-y-0.5 hover:shadow disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {loading ? 'Đang đổi mật khẩu...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
