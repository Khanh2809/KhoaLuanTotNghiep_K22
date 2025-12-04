'use client';

import Link from 'next/link';
import EnrollButton from '@/components/EnrollButton';
import { ROLES } from '@/lib/constants';
import { useAuth } from '@/lib/providers/auth-context';

export default function CourseCTA({
  courseId,
  firstLessonId,
  defaultEnrolled,
}: {
  courseId: number;
  firstLessonId?: number;
  defaultEnrolled: boolean;
}) {
  const { user, loading } = useAuth();
  const isInstructorOrAdmin = user?.role === ROLES.INSTRUCTOR || user?.role === ROLES.ADMIN;

  if (loading) return null;

  // Instructor/Admin: chỉ thấy "See lessons"
  if (isInstructorOrAdmin) {
    const disabled = !firstLessonId;
    return (
      <Link
        href={disabled ? '#' : `/lessons/${firstLessonId}`}
        aria-disabled={disabled}
        className={`rounded-md border border-white/20 px-4 py-2 ${
          disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
      >
        Xem bài học
      </Link>
    );
  }

  // Student: giữ nguyên Enroll + Start learning
  return (
    <>
      <EnrollButton courseId={courseId} defaultEnrolled={defaultEnrolled} />
      {defaultEnrolled && firstLessonId ? (
        <Link
          href={`/lessons/${firstLessonId}`}
          className="rounded-md border border-white/20 px-4 py-2 hover:bg-white/10"
        >
          Bắt đầu học
        </Link>
      ) : (
        <button
          className="rounded-md border border-white/20 px-4 py-2 text-gray-400 cursor-not-allowed"
          disabled
          title={defaultEnrolled ? 'Chưa có bài học' : 'Đăng ký khóa học để bắt đầu học'}
        >
          Bắt đầu học
        </button>
      )}
    </>
  );
}
