'use client';
import { useEffect, useState } from 'react';

export default function BookmarkButton({ courseId }:{courseId:number}) {
  const KEY = 'wishlist';
  const [saved, setSaved] = useState(false);

  useEffect(()=>{
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) as number[] : [];
    setSaved(arr.includes(courseId));
  }, [courseId]);

  const toggle = () => {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) as number[] : [];
    const idx = arr.indexOf(courseId);
    if (idx === -1) arr.push(courseId); else arr.splice(idx,1);
    localStorage.setItem(KEY, JSON.stringify(arr));
    setSaved(!saved);
  };

  return (
    <button onClick={toggle}
      className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10">
      {saved ? 'Saved ✓' : 'Save'}
    </button>
  );
}
