'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-context';

type Props = {
  courseId: number;
  lessonId: number;
  quizId?: number | null;
  canAccessByEnrollment: boolean;
};

export default function LessonOpenControl({
  courseId,
  lessonId,
  quizId,
  canAccessByEnrollment,
}: Props) {
  const { user, loading } = useAuth();
  const isInstructorOrAdmin = user?.role === 'instructor' || user?.role === 'admin';

  if (loading) return null;

  const canAccessContent = isInstructorOrAdmin || canAccessByEnrollment;

  return (
    <div className="flex items-center gap-3 text-sm">
      {canAccessContent ? (
        <Link href={`/lessons/${lessonId}`} className="text-blue-500 hover:underline">
          Xem bài
        </Link>
      ) : (
        <span className="cursor-not-allowed text-gray-500" title="Đăng ký khoá học để mở bài học">
          Khoá
        </span>
      )}

      {quizId ? (
        canAccessContent ? (
          <Link
            href={`/courses/${courseId}/quizzes/${quizId}`}
            className="text-amber-400 hover:underline"
          >
            Làm quiz
          </Link>
        ) : (
          <span className="cursor-not-allowed text-gray-500" title="Đăng ký để làm quiz">
            Quiz
          </span>
        )
      ) : null}
    </div>
  );
}

