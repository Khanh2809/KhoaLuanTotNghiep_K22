import EditQuizClient from './EditQuizClient';

export default async function EditQuizPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = await params;
  return <EditQuizClient courseId={id} quizId={quizId} />;
}

