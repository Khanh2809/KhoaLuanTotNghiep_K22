'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('student@demo.com');
  const [touched, setTouched] = useState<{ email?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const emailInvalid =
    !!touched.email && (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setTouched(t => ({ ...t, email: true }));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // không cần credentials vì không dùng cookie ở flow này
          body: JSON.stringify({ email }),
        }
      );

      // BE luôn trả message “If the email exists…” để tránh lộ thông tin
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gửi email thất bại');

      setMsg('Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.');
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
          <h1 className="text-2xl font-bold text-white">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-white/60">
            Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                placeholder="you@example.com"
                aria-invalid={emailInvalid}
                aria-describedby="email-help"
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 transition
                ${emailInvalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="email-help" className={`mt-1 text-xs ${emailInvalid ? 'text-red-400' : 'text-white/50'}`}>
              {emailInvalid ? 'Email không hợp lệ. Ví dụ: name@domain.com' : 'Nhập email đã đăng ký.'}
            </p>
          </div>

          {err && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
          {msg && <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{msg}</div>}

          <button
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:-translate-y-0.5 hover:shadow disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>
      </div>
    </div>
  );
}
