'use client';
// giúp lưu tình trạng đăng nhập, đăng xuất ở cấp độ toàn cục
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiMe, apiLogin, apiLogout, apiRegister } from '@/lib/auth';

export type CurrentUser = {
  id: number; name: string; email: string; role: 'student'|'instructor'|'admin';
};

type AuthCtx = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: CurrentUser | null) => void; // tiện nếu cần
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy phiên hiện tại khi app mount (đọc cookie -> /auth/me)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await apiMe();
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password); // BE set cookie
    setUser(u);                                // cập nhật navbar ngay
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const u = await apiRegister(name, email, password); // BE set cookie
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();   // xoá cookie ở BE
    setUser(null);       // cập nhật ngay UI
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
