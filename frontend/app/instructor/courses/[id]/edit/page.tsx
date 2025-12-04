import { cookies } from 'next/headers';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchCourse(cookie:string, id:number) {
  const res = await fetch(`${BASE}/api/instructor/courses/${id}`, {
    headers: { cookie }, cache: 'no-store'
  });
  if (!res.ok) throw new Error('Not found or forbidden');
  return res.json();
}

import Editor from './Editor';

export default async function EditCoursePage({ params }:{ params: Promise<{id:string}> }) {
  const { id } = await params;
  const ck = (await cookies()).toString();
  const course = await fetchCourse(ck, Number(id));
  return <Editor course={course} />;
}
