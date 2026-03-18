// src/app/(dashboard)/dashboard/submissions/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";

export default async function SubmissionsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const user = session.user as { id: string; role?: string };
  if (user.role !== "TEACHER") redirect("/dashboard");

  const pendingSubmissions = await db.submission.findMany({
    where: {
      assignment: {
        module: {
          course: { teacherId: user.id },
        },
      },
      status: "SUBMITTED",
    },
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
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pending Review Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending submissions to review.</p>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{submission.assignment.title}</p>
                    <p className="text-sm text-gray-500">
                      {submission.student.name || "Unknown Student"} ({submission.student.email})
                      {" | "}
                      {submission.assignment.module.course.title}
                    </p>
                  </div>
                  <Link href={`/dashboard/submissions/${submission.id}`}>
                    <Button size="sm">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
