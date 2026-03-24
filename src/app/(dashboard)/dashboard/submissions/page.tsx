// src/app/(dashboard)/dashboard/submissions/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";

interface SubmissionsPageProps {
  searchParams: { tab?: string };
}

export default async function SubmissionsPage({ searchParams }: SubmissionsPageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const user = session.user as { id: string; role?: string };
  if (user.role !== "TEACHER") redirect("/dashboard");

  const activeTab = searchParams.tab === "reviewed" ? "reviewed" : "pending";

  const [pendingSubmissions, reviewedSubmissions] = await Promise.all([
    db.submission.findMany({
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
    }),
    db.submission.findMany({
      where: {
        assignment: {
          module: {
            course: { teacherId: user.id },
          },
        },
        status: "GRADED",
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
      orderBy: { gradedAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-2">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          href="/dashboard/submissions"
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending
          {pendingSubmissions.length > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {pendingSubmissions.length}
            </span>
          )}
        </Link>
        <Link
          href="/dashboard/submissions?tab=reviewed"
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "reviewed"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Reviewed
          {reviewedSubmissions.length > 0 && (
            <span className="ml-2 bg-teal-100 text-teal-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {reviewedSubmissions.length}
            </span>
          )}
        </Link>
      </div>

      {activeTab === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No pending submissions to review.</p>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{submission.assignment.title}</p>
                      <p className="text-sm text-gray-500">
                        {submission.student.name || "Unknown Student"} ({submission.student.email})
                        {" | "}
                        {submission.assignment.module.course.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Submitted {new Date(submission.submittedAt).toLocaleDateString()}
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
      )}

      {activeTab === "reviewed" && (
        <Card>
          <CardHeader>
            <CardTitle>Reviewed Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewedSubmissions.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No reviewed submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {reviewedSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{submission.assignment.title}</p>
                      <p className="text-sm text-gray-500">
                        {submission.student.name || "Unknown Student"} ({submission.student.email})
                        {" | "}
                        {submission.assignment.module.course.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Reviewed{" "}
                        {submission.gradedAt
                          ? new Date(submission.gradedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {submission.grade !== null && (
                        <Badge variant="success">
                          {submission.grade} / {submission.assignment.maxScore}
                        </Badge>
                      )}
                      <Link href={`/dashboard/submissions/${submission.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
