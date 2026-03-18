// src/app/(dashboard)/dashboard/submissions/[submissionId]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { GradeForm } from "./grade-form";

interface SubmissionPageProps {
  params: { submissionId: string };
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const user = session.user as { id: string; role?: string };
  if (user.role !== "TEACHER") redirect("/dashboard");

  const submission = await db.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      student: { select: { name: true, email: true } },
      assignment: {
        include: {
          module: {
            include: {
              course: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  if (!submission) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/dashboard/submissions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pending Reviews
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Review Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{submission.assignment.title}</p>
            <p className="text-sm text-gray-500">
              {submission.student.name || "Unknown Student"} ({submission.student.email})
              {" | "}
              {submission.assignment.module.course.title}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Student Answer</h3>
            <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {submission.content || <span className="text-gray-400">No answer provided.</span>}
            </p>
          </div>
          {submission.fileUrl && (
            <div>
              <h3 className="font-semibold mb-2">Uploaded File</h3>
              <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View File
              </a>
            </div>
          )}
          <GradeForm submissionId={submission.id} maxScore={submission.assignment.maxScore} />
        </CardContent>
      </Card>
    </div>
  );
}
