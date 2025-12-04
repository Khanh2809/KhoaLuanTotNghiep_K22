'use client';

import { useEffect, useState } from 'react';
import { apiMe } from './auth';

export type CurrentUser = { id: number; name: string; email: string; role: 'student'|'instructor'|'admin' };

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  return { user, loading, setUser };
}
