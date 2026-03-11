// src/app/courses/[courseId]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth-server";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { EnrollButton } from "./enroll-button";

interface CoursePageProps {
  params: { courseId: string };
}

export default async function PublicCoursePage({ params }: CoursePageProps) {
  const session = await getServerSession();
  const userId = session?.user?.id;

  const course = await db.course.findUnique({
    where: { id: params.courseId, published: true },
    include: {
      teacher: { select: { name: true } },
      modules: {
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          _count: {
            select: { contents: true, quizzes: true, assignments: true },
          },
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { enrollments: true } },
      enrollments: userId ? {
        where: { studentId: userId },
        select: { id: true },
      } : false,
    },
  });

  if (!course) {
    notFound();
  }

  const isEnrolled = course.enrollments && course.enrollments.length > 0;

  // If enrolled, redirect to dashboard course view
  if (isEnrolled) {
    redirect(`/dashboard/courses/${params.courseId}`);
  }

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
        <div className="max-w-4xl mx-auto">
          <Link href="/courses" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Courses
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-500">by {course.teacher.name || 'Unknown Instructor'}</p>
              </div>

              {course.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">About This Course</h2>
                  <p className="text-gray-600">{course.description}</p>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-4">Course Content</h2>
                <div className="space-y-3">
                  {course.modules.map((module: {
                    id: string;
                    title: string;
                    description: string | null;
                    order: number;
                    _count: { contents: number; quizzes: number; assignments: number };
                  }, index: number) => (
                    <Card key={module.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">
                              Module {index + 1}: {module.title}
                            </h3>
                            {module.description && (
                              <p className="text-sm text-gray-500">{module.description}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {module._count.contents + module._count.quizzes + module._count.assignments} items
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Enroll Now</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Students enrolled</span>
                    <span className="font-medium">{course._count.enrollments}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                    <span className="font-medium">{course.modules.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Price</span>
                    <Badge variant="success">Free</Badge>
                  </div>
                  
                  {session ? (
                    <EnrollButton courseId={course.id} />
                  ) : (
                    <Link href={`/login?callbackUrl=/courses/${course.id}`}>
                      <Button className="w-full">Sign In to Enroll</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
