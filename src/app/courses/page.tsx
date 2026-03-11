// src/app/courses/page.tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { getServerSession } from "@/lib/auth-server";

export default async function PublicCoursesPage() {
  const session = await getServerSession();
  const userId = session?.user?.id;

  const courses = await db.course.findMany({
    where: { published: true },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true, modules: true } },
      enrollments: userId ? {
        where: { studentId: userId },
        select: { id: true },
      } : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              LearnHub
            </Link>
            <div className="flex items-center gap-4">
              {session ? (
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Courses</h1>
          <p className="text-gray-600">Discover courses to enhance your skills</p>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No courses available yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: {
              id: string;
              title: string;
              description: string | null;
              teacher: { name: string };
              _count: { enrollments: number; modules: number };
              enrollments?: { id: string }[];
            }) => {
              const isEnrolled = course.enrollments && course.enrollments.length > 0;
              
              return (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {isEnrolled && <Badge variant="success">Enrolled</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">by {course.teacher.name || 'Unknown Instructor'}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                      {course.description || "No description available"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>{course._count.enrollments} students</span>
                      <span>{course._count.modules} modules</span>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button variant={isEnrolled ? "outline" : "default"} className="w-full">
                        {isEnrolled ? "Continue Learning" : "View Course"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
