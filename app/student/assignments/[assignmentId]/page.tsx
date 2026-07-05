import AssignmentRunner from "./AssignmentRunner";

type AssignmentPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { assignmentId } = await params;

  return <AssignmentRunner assignmentId={assignmentId} />;
}