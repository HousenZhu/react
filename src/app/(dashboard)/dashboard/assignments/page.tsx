// src/app/(dashboard)/dashboard/assignments/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";

export default async function AssignmentsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as { id: string; role?: string };
  const isTeacher = user.role === "TEACHER";

  if (isTeacher) {
    // Teacher view - assignments from their courses
    const assignments = await db.assignment.findMany({
      where: {
        module: {
          course: { teacherId: user.id },
        },
      },
      include: {
        module: {
          include: {
            course: { select: { title: true } },
          },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: { deadline: "asc" },
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-600">View and manage assignments across your courses.</p>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No assignments yet. Create assignments in your course modules.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment: {
              id: string;
              title: string;
              deadline: Date;
              maxScore: number;
              module: { course: { title: string } };
              _count: { submissions: number };
            }) => (
              <Card key={assignment.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <Link href={`/dashboard/assignments/${assignment.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {assignment.title}
                    </Link>
                    <p className="text-sm text-gray-500">{assignment.module.course.title}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{new Date(assignment.deadline).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Submissions</p>
                      <p className="font-medium">{assignment._count.submissions}</p>
                    </div>
                    <Link href={`/dashboard/assignments/${assignment.id}/submissions`}>
                      <Button variant="outline" size="sm">View Submissions</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student view - their assignments
  const assignments = await db.assignment.findMany({
    where: {
      module: {
        course: {
          enrollments: {
            some: { studentId: user.id },
          },
        },
      },
    },
    include: {
      module: {
        include: {
          course: { select: { title: true } },
        },
      },
      submissions: {
        where: { studentId: user.id },
      },
    },
    orderBy: { deadline: "asc" },
  });

  const now = new Date();
  const upcoming = assignments.filter((a: { deadline: Date }) => new Date(a.deadline) >= now);
  const past = assignments.filter((a: { deadline: Date }) => new Date(a.deadline) < now);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
        <p className="text-gray-600">View and submit your assignments.</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No assignments yet. Enroll in courses to see assignments.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upcoming</h3>
              {upcoming.map((assignment: {
                id: string;
                title: string;
                deadline: Date;
                maxScore: number;
                module: { course: { title: string } };
                submissions: Array<{ id: string; status: string; grade: number | null }>;
              }) => {
                const submission = assignment.submissions[0];
                return (
                  <Card key={assignment.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <Link href={`/dashboard/assignments/${assignment.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {assignment.title}
                        </Link>
                        <p className="text-sm text-gray-500">{assignment.module.course.title}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Due</p>
                          <p className="font-medium">{new Date(assignment.deadline).toLocaleDateString()}</p>
                        </div>
                        {submission ? (
                          <Badge variant={submission.status === "GRADED" ? "success" : "secondary"}>
                            {submission.status === "GRADED" ? `${submission.grade}/${assignment.maxScore}` : "Submitted"}
                          </Badge>
                        ) : (
                          <Link href={`/dashboard/assignments/${assignment.id}`}>
                            <Button size="sm">Submit</Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-500">Past Due</h3>
              {past.map((assignment: {
                id: string;
                title: string;
                deadline: Date;
                maxScore: number;
                module: { course: { title: string } };
                submissions: Array<{ id: string; status: string; grade: number | null }>;
              }) => {
                const submission = assignment.submissions[0];
                return (
                  <Card key={assignment.id} className="opacity-75">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <Link href={`/dashboard/assignments/${assignment.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {assignment.title}
                        </Link>
                        <p className="text-sm text-gray-500">{assignment.module.course.title}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="destructive">Past Due</Badge>
                        {submission ? (
                          <Badge variant={submission.status === "GRADED" ? "success" : "secondary"}>
                            {submission.status === "GRADED" ? `${submission.grade}/${assignment.maxScore}` : "Submitted"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Submitted</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
