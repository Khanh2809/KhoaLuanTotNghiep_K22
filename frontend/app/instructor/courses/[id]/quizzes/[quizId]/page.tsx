import QuizDetailClient from './QuizDetailClient';

export default async function InstructorQuizDetailPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  return <QuizDetailClient courseId={id} quizId={quizId} />;
}

