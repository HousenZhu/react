// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Progress, Badge } from "@/components/ui";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as { id: string; name: string; role?: string };
  const isTeacher = user.role === "TEACHER";

  if (isTeacher) {
    return <TeacherDashboard userId={user.id} />;
  }

  return <StudentDashboard userId={user.id} />;
}

async function StudentDashboard({ userId }: { userId: string }) {
  // Get enrolled courses with progress
  const enrollments = await db.enrollment.findMany({
    where: { studentId: userId },
    include: {
      course: {
        include: {
          teacher: { select: { name: true } },
          modules: {
            include: {
              quizzes: {
                include: {
                  attempts: {
                    where: { studentId: userId },
                    select: { passed: true },
                  },
                },
              },
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: userId },
                    select: { status: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });

  // Get upcoming assignments
  const upcomingAssignments = await db.assignment.findMany({
    where: {
      module: {
        course: {
          enrollments: {
            some: { studentId: userId },
          },
        },
      },
      deadline: { gte: new Date() },
    },
    include: {
      module: {
        include: {
          course: { select: { title: true } },
        },
      },
      submissions: {
        where: { studentId: userId },
      },
    },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  // Get recent quiz attempts
  const recentQuizAttempts = await db.quizAttempt.findMany({
    where: { studentId: userId },
    include: {
      quiz: {
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
    take: 5,
  });

  // Get certificates
  const certificates = await db.certificate.findMany({
    where: { studentId: userId },
    include: {
      course: { select: { title: true } },
    },
    orderBy: { generatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-600">Here's what's happening with your courses.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard title="Enrolled Courses" value={enrollments.length} icon="courses" />
        <StatCard title="Pending Assignments" value={upcomingAssignments.filter((a: { submissions: unknown[] }) => a.submissions.length === 0).length} icon="assignments" />
        <StatCard title="Quiz Attempts" value={recentQuizAttempts.length} icon="quizzes" />
        <StatCard title="Certificates" value={certificates.length} icon="certificates" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Courses</CardTitle>
            <Link href="/dashboard/courses" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No courses enrolled yet.{" "}
                <Link href="/courses" className="text-blue-600 hover:underline">
                  Browse courses
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment: any) => {
                  const totalItems =
                    enrollment.course.modules.reduce(
                      (sum: number, module: any) =>
                        sum + module.assignments.length + module.quizzes.length,
                      0
                    );

                  const completedItems =
                    enrollment.course.modules.reduce((sum: number, module: any) => {
                      const completedAssignments = module.assignments.filter((assignment: any) =>
                        assignment.submissions.length > 0
                      ).length;
                      const completedQuizzes = module.quizzes.filter((quiz: any) =>
                        quiz.attempts.some((attempt: any) => attempt.passed)
                      ).length;
                      return sum + completedAssignments + completedQuizzes;
                    }, 0);

                  const completionPct =
                    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

                  return (
                    <div key={enrollment.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Link
                          href={`/dashboard/courses/${enrollment.course.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {enrollment.course.title}
                        </Link>
                        <p className="text-sm text-gray-500">
                          by {enrollment.course.teacher.name || 'Unknown Instructor'}
                        </p>
                      </div>
                      <div className="w-24">
                        <Progress value={completionPct} />
                        <p className="text-xs text-gray-500 text-right mt-1">
                          {completionPct}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Assignments</CardTitle>
            <Link href="/dashboard/assignments" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming assignments</p>
            ) : (
              <div className="space-y-4">
                {upcomingAssignments.map((assignment: { id: string; title: string; deadline: Date; module: { course: { title: string } }; submissions: unknown[] }) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/dashboard/assignments/${assignment.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {assignment.title}
                      </Link>
                      <p className="text-sm text-gray-500">{assignment.module.course.title}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={assignment.submissions.length > 0 ? "success" : "secondary"}>
                        {assignment.submissions.length > 0 ? "Submitted" : "Pending"}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Due {new Date(assignment.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function TeacherDashboard({ userId }: { userId: string }) {
  // Get teacher's courses
  const courses = await db.course.findMany({
    where: { teacherId: userId },
    include: {
      _count: {
        select: {
          enrollments: true,
          modules: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get pending submissions
  const pendingSubmissions = await db.submission.findMany({
    where: {
      assignment: {
        module: {
          course: { teacherId: userId },
        },
      },
      status: "SUBMITTED",
    },
    include: {
      student: { select: { name: true } },
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
    take: 10,
  });

  // Get reviewed submissions
  const reviewedSubmissions = await db.submission.findMany({
    where: {
      assignment: {
        module: {
          course: { teacherId: userId },
        },
      },
      status: "GRADED",
    },
    include: {
      student: { select: { name: true } },
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
    take: 5,
  });

  // Get total students
  const totalStudents = await db.enrollment.count({
    where: {
      course: { teacherId: userId },
    },
  });

  // Get recent discussions
  const recentDiscussions = await db.discussionPost.findMany({
    where: {
      course: { teacherId: userId },
    },
    include: {
      author: { select: { name: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
          <p className="text-gray-600">Manage your courses and students.</p>
        </div>
        <Link
          href="/dashboard/courses/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Course
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard title="Total Courses" value={courses.length} icon="courses" />
        <StatCard title="Total Students" value={totalStudents} icon="students" />
        <StatCard title="Pending Reviews" value={pendingSubmissions.length} icon="reviews" />
        <StatCard title="Reviewed" value={reviewedSubmissions.length} icon="reviewed" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Courses</CardTitle>
            <Link href="/dashboard/courses" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No courses yet.{" "}
                <Link href="/dashboard/courses/create" className="text-blue-600 hover:underline">
                  Create your first course
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {courses.map((course: { id: string; title: string; published: boolean; _count: { enrollments: number; modules: number } }) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {course.title}
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{course._count.enrollments} students</span>
                        <span>{course._count.modules} modules</span>
                      </div>
                    </div>
                    <Badge variant={course.published ? "success" : "secondary"}>
                      {course.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Reviews</CardTitle>
            <Link href="/dashboard/submissions" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending submissions</p>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.slice(0, 5).map((submission: { id: string; student: { name: string | null }; assignment: { title: string; module: { course: { title: string } } } }) => (
                  <div key={submission.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {submission.assignment.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {submission.student.name || 'Unknown Student'} &bull; {submission.assignment.module.course.title}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/submissions/${submission.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Reviewed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recently Reviewed</CardTitle>
          <Link href="/dashboard/submissions?tab=reviewed" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {reviewedSubmissions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No reviewed submissions yet.</p>
          ) : (
            <div className="divide-y">
              {reviewedSubmissions.map((submission: { id: string; grade: number | null; student: { name: string | null }; assignment: { title: string; maxScore: number; module: { course: { title: string } } }; gradedAt: Date | null }) => (
                <div key={submission.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{submission.assignment.title}</p>
                    <p className="text-sm text-gray-500">
                      by {submission.student.name || "Unknown Student"} &bull; {submission.assignment.module.course.title}
                    </p>
                    {submission.gradedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Reviewed on {new Date(submission.gradedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {submission.grade !== null && (
                      <span className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        {submission.grade} / {submission.assignment.maxScore}
                      </span>
                    )}
                    <Link
                      href={`/dashboard/submissions/${submission.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const icons = {
  courses: (
    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  assignments: (
    <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  quizzes: (
    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  certificates: (
    <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  students: (
    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  reviews: (
    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  discussions: (
    <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  reviewed: (
    <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 4h6a1 1 0 011 1v0a1 1 0 01-1 1H9a1 1 0 01-1-1v0a1 1 0 011-1z" />
    </svg>
  ),
};

function StatCard({ title, value, icon }: { title: string; value: number; icon: keyof typeof icons }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="p-3 bg-gray-100 rounded-lg">{icons[icon]}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
