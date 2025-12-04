import QuizListClient from './QuizListClient';

export default async function QuizListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuizListClient courseId={id} />;
}

