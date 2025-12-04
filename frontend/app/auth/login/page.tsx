'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-context';
import Link from 'next/link';
import { Mail, Lock, LogIn } from 'lucide-react';
import { logActivity } from '@/lib/log-activity';

export default function LoginPage() {
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const router = useRouter();
  const { login, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  if (!loading && user) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-gray-500">
        Đã đăng nhập, đang chuyển hướng…
      </div>
    );
  }

  const emailInvalid =
    !!touched.email && (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
  const passwordInvalid = !!touched.password && (!password || password.length < 6);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setTouched(t => ({ ...t, email: true }));
      return;
    }
    if (!password || password.length < 6) {
      setTouched(t => ({ ...t, password: true }));
      return;
    }
    
    try {
      await login(email, password);
    
      // 🔹 Ghi log LOGIN
      await logActivity({
        eventType: 'LOGIN',
        metadata: { via: 'login_form' },
      });
    
      router.push('/');
    } catch (e: any) {
      setErr('Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Đăng nhập</h1>
          <p className="mt-1 text-sm text-white/60">
            Chào mừng trở lại! Học tiếp tục nào.
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
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40
                 focus:outline-none focus:ring-2 transition
                 ${emailInvalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="email-help" className={`mt-1 text-xs ${emailInvalid ? 'text-red-400' : 'text-white/50'}`}>
              {emailInvalid ? 'Email không hợp lệ. Ví dụ: name@domain.com' : 'Nhập email đã đăng ký.'}
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="password">Mật khẩu</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                placeholder="••••••"
                aria-invalid={passwordInvalid}
                aria-describedby="password-help"
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40
                 focus:outline-none focus:ring-2 transition
                 ${passwordInvalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="password-help" className={`mt-1 text-xs ${passwordInvalid ? 'text-red-400' : 'text-white/50'}`}>
              {passwordInvalid ? 'Mật khẩu tối thiểu 6 ký tự.' : 'Giữ bí mật mật khẩu của bạn.'}
            </p>

            {/* Quên mật khẩu */}
            <div className="mt-2 text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-white/80 underline-offset-4 hover:underline focus:underline focus:outline-none"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          {err && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

          <button
            className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:-translate-y-0.5 hover:shadow"
          >
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-white/70">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="text-white underline-offset-4 hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

