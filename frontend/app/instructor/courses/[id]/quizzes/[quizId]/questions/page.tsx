import QuestionsManager from './QuestionsManager';

export default async function QuizQuestionsPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = await params;
  return <QuestionsManager courseId={id} quizId={quizId} />;
}

