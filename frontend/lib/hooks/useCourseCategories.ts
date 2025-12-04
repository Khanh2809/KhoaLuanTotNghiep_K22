'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/constants';

export type CourseCategory = {
  id: number;
  name: string;
  description?: string | null;
};

type UseCourseCategories = {
  categories: CourseCategory[];
  loading: boolean;
  error: string | null;
};

export function useCourseCategories(): UseCourseCategories {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/instructor/categories`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancelled) {
          setCategories(data);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load categories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}
