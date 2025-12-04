// components/AdminActionButtons.tsx
'use client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminActionButtons({ course }: { course: any }) {
  async function publish(publish: boolean) {
    await fetch(`${API}/api/admin/courses/${course.id}/publish`, {
      method: 'PUT', credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ publish }),
    });
    location.reload();
  }
  async function feature() {
    const rank = Number(prompt('Featured rank (optional):', course.featuredRank ?? '')) || undefined;
    const featured = !course.featured;
    await fetch(`${API}/api/admin/courses/${course.id}/feature`, {
      method: 'PUT', credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ featured, rank }),
    });
    location.reload();
  }
  async function seo() {
    const seoTitle = prompt('SEO title:', course.seoTitle ?? '') || null;
    const seoDescription = prompt('SEO description:', course.seoDescription ?? '') || null;
    const slug = prompt('Slug (unique):', course.slug ?? '') || null;
    await fetch(`${API}/api/admin/courses/${course.id}/seo`, {
      method: 'PUT', credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ seoTitle, seoDescription, slug }),
    });
    location.reload();
  }

  return (
    <>
      {course.status === 'PUBLISHED' ? (
        <button onClick={() => publish(false)} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">Unpublish</button>
      ) : (
        <button onClick={() => publish(true)} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">Publish</button>
      )}
      <button onClick={feature} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">
        {course.featured ? 'Unfeature' : 'Feature'}
      </button>
      <button onClick={seo} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">SEO</button>
    </>
  );
}
