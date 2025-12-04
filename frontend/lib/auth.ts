import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';

export async function apiRegister(name: string, email: string, password: string, role = 'student') {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
    method: 'POST',
    credentials: 'include',               // gửi & nhận cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });

  // cố gắng đọc body JSON, nếu fail thì fallback text
  const payload = await (async () => {
    try { return await res.json(); } catch { return { error: await res.text() }; }
  })();

  if (!res.ok) {
    const msg = payload?.error || payload?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return payload;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await (async () => {
    try { return await res.json(); } catch { return { error: await res.text() }; }
  })();
  if (!res.ok) throw new Error(payload?.error || payload?.message || `HTTP ${res.status}`);
  return payload;
}

export async function apiMe() {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function apiLogout() {
  await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, { method: 'POST', credentials: 'include' });
}
