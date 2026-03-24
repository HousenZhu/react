// src/app/(dashboard)/dashboard/analytics/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";

export default async function AnalyticsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const user = session.user as { id: string; role?: string };
  if (user.role !== "TEACHER") redirect("/dashboard");

  const [
    totalCourses,
    publishedCourses,
    totalEnrollments,
    completedEnrollments,
    totalSubmissions,
    gradedSubmissions,
    pendingSubmissions,
    totalQuizAttempts,
    passedQuizAttempts,
    totalDiscussions,
    totalCertificates,
  ] = await Promise.all([
    db.course.count({ where: { teacherId: user.id } }),
    db.course.count({ where: { teacherId: user.id, published: true } }),
    db.enrollment.count({ where: { course: { teacherId: user.id } } }),
    db.enrollment.count({ where: { course: { teacherId: user.id }, completed: true } }),
    db.submission.count({ where: { assignment: { module: { course: { teacherId: user.id } } } } }),
    db.submission.count({ where: { assignment: { module: { course: { teacherId: user.id } } }, status: "GRADED" } }),
    db.submission.count({ where: { assignment: { module: { course: { teacherId: user.id } } }, status: "SUBMITTED" } }),
    db.quizAttempt.count({ where: { quiz: { module: { course: { teacherId: user.id } } } } }),
    db.quizAttempt.count({ where: { quiz: { module: { course: { teacherId: user.id } } }, passed: true } }),
    db.discussionPost.count({ where: { course: { teacherId: user.id } } }),
    db.certificate.count({ where: { course: { teacherId: user.id } } }),
  ]);

  const courses = await db.course.findMany({
    where: { teacherId: user.id },
    include: {
      _count: {
        select: { enrollments: true, modules: true, certificates: true },
      },
      enrollments: { select: { completed: true, progress: true } },
      modules: {
        include: {
          assignments: {
            include: {
              submissions: { select: { status: true, grade: true, assignment: { select: { maxScore: true } } } },
            },
          },
          quizzes: {
            include: {
              attempts: { select: { passed: true, score: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const gradedWithScores = await db.submission.findMany({
    where: {
      assignment: { module: { course: { teacherId: user.id } } },
      status: "GRADED",
      grade: { not: null },
    },
    select: { grade: true, assignment: { select: { maxScore: true } } },
  });

  const avgGradePct =
    gradedWithScores.length > 0
      ? Math.round(
          gradedWithScores.reduce(
            (sum: number, s: { grade: number | null; assignment: { maxScore: number } }) =>
              sum + ((s.grade ?? 0) / s.assignment.maxScore) * 100,
            0
          ) / gradedWithScores.length
        )
      : null;

  const avgQuizScore =
    passedQuizAttempts > 0 || totalQuizAttempts > 0
      ? Math.round((passedQuizAttempts / Math.max(totalQuizAttempts, 1)) * 100)
      : null;

  const completionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : null;

  const gradingRate =
    totalSubmissions > 0
      ? Math.round((gradedSubmissions / totalSubmissions) * 100)
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Overview of your courses and student activity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Courses" value={totalCourses} sub={`${publishedCourses} published`} color="blue" />
        <StatCard label="Enrolled Students" value={totalEnrollments} sub={completionRate !== null ? `${completionRate}% completed` : "No data"} color="purple" />
        <StatCard label="Submissions" value={totalSubmissions} sub={`${pendingSubmissions} pending`} color="orange" />
        <StatCard label="Quiz Attempts" value={totalQuizAttempts} sub={avgQuizScore !== null ? `${avgQuizScore}% pass rate` : "No data"} color="green" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricTile label="Grading Rate" value={gradingRate !== null ? `${gradingRate}%` : "N/A"} desc={`${gradedSubmissions} / ${totalSubmissions} graded`} />
        <MetricTile label="Avg Assignment Grade" value={avgGradePct !== null ? `${avgGradePct}%` : "N/A"} desc="Across all graded work" />
        <MetricTile label="Quiz Pass Rate" value={avgQuizScore !== null ? `${avgQuizScore}%` : "N/A"} desc={`${passedQuizAttempts} / ${totalQuizAttempts} passed`} />
        <MetricTile label="Certificates Issued" value={String(totalCertificates)} desc={`${totalDiscussions} discussion posts`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No courses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-left">
                    <th className="pb-3 font-medium">Course</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-center">Students</th>
                    <th className="pb-3 font-medium text-center">Completed</th>
                    <th className="pb-3 font-medium text-center">Avg Progress</th>
                    <th className="pb-3 font-medium text-center">Submissions</th>
                    <th className="pb-3 font-medium text-center">Quiz Pass</th>
                    <th className="pb-3 font-medium text-center">Certificates</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courses.map((course: any) => {
                    const allSubmissions = course.modules.flatMap((m: any) =>
                      m.assignments.flatMap((a: any) => a.submissions)
                    );
                    const allAttempts = course.modules.flatMap((m: any) =>
                      m.quizzes.flatMap((q: any) => q.attempts)
                    );

                    const totalLearningItems =
                      course._count.modules +
                      allSubmissions.length +
                      allAttempts.length;

                    const completedItems =
                      (course.enrollments.length > 0
                        ? course.enrollments.filter((e: any) => e.completed).length
                        : 0) +
                      allSubmissions.filter((s: any) => s.status === "GRADED").length +
                      allAttempts.filter((a: any) => a.passed).length;

                    const courseCompletionPct =
                      totalLearningItems > 0
                        ? Math.round((completedItems / totalLearningItems) * 100)
                        : 0;

                    const completedCount = course.enrollments.filter((e: any) => e.completed).length;
                    const passedAttempts = allAttempts.filter((a: any) => a.passed).length;
                    const quizPassPct =
                      allAttempts.length > 0
                        ? Math.round((passedAttempts / allAttempts.length) * 100)
                        : null;

                    return (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/courses/${course.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {course.title}
                          </Link>
                          <p className="text-xs text-gray-400">{course._count.modules} modules</p>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={course.published ? "success" : "secondary"}>
                            {course.published ? "Published" : "Draft"}
                          </Badge>
                        </td>
                        <td className="py-3 text-center font-medium">{course._count.enrollments}</td>
                        <td className="py-3 text-center text-gray-600">{completedCount}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${courseCompletionPct}%` }}
                              />
                            </div>
                            <span className="text-gray-600 text-xs font-medium">{courseCompletionPct}%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{completedItems} of {totalLearningItems}</p>
                        </td>
                        <td className="py-3 text-center text-gray-600">
                          {allSubmissions.filter((s: any) => s.status === "GRADED").length}
                          <span className="text-gray-400"> / {allSubmissions.length}</span>
                        </td>
                        <td className="py-3 text-center text-gray-600">
                          {quizPassPct !== null ? `${quizPassPct}%` : "N/A"}
                        </td>
                        <td className="py-3 text-center text-gray-600">{course._count.certificates}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      <p className="text-xs opacity-70 mt-1">{sub}</p>
    </div>
  );
}

function MetricTile({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="border rounded-xl p-5 bg-white">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}
