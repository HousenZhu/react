// src/app/(dashboard)/dashboard/courses/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, Button } from "@/components/ui";

export default async function CoursesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as { id: string; role?: string };
  const isTeacher = user.role === "TEACHER";

  if (isTeacher) {
    const courses = await db.course.findMany({
      where: { teacherId: user.id },
      include: {
        _count: {
          select: { enrollments: true, modules: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
            <p className="text-gray-600">Manage your courses and content.</p>
          </div>
          <Link href="/dashboard/courses/create">
            <Button>Create Course</Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
              <Link href="/dashboard/courses/create">
                <Button>Create Your First Course</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: { id: string; title: string; description: string | null; published: boolean; _count: { enrollments: number; modules: number } }) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge variant={course.published ? "success" : "secondary"}>
                      {course.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>{course._count.enrollments} students</span>
                    <span>{course._count.modules} modules</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">Manage</Button>
                    </Link>
                    <Link href={`/dashboard/courses/${course.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Button>
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

  // Student view - enrolled courses
  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        include: {
          teacher: { select: { name: true } },
          _count: { select: { modules: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-600">Continue learning where you left off.</p>
        </div>
        <Link href="/courses">
          <Button variant="outline">Browse More Courses</Button>
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment: { id: string; progress: number; course: { id: string; title: string; description: string | null; teacher: { name: string }; _count: { modules: number } } }) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                <p className="text-sm text-gray-500">by {enrollment.course.teacher.name || 'Unknown Instructor'}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {enrollment.course.description || "No description"}
                </p>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{enrollment.progress}%</span>
                  </div>
                  <Progress value={enrollment.progress} />
                </div>
                <Link href={`/dashboard/courses/${enrollment.course.id}`}>
                  <Button className="w-full">
                    {enrollment.progress > 0 ? "Continue Learning" : "Start Course"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
