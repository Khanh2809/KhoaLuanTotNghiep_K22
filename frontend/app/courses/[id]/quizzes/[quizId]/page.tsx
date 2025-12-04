import TakeQuizClient from './TakeQuizClient';

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  return <TakeQuizClient courseId={id} quizId={quizId} />;
}

