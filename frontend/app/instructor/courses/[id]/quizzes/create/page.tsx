import CreateQuizForm from './CreateQuizForm';

export default async function CreateQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreateQuizForm courseId={id} />;
}

