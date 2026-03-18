// src/app/(dashboard)/dashboard/courses/[courseId]/students/page.tsx


import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import StudentsListClient from "./students-list-client";

interface StudentsPageProps {
  params: { courseId: string };
}


export default async function StudentsPage({ params }: StudentsPageProps) {
  const session = await getServerSession();
  if (!session || (session.user as { role?: string }).role !== "TEACHER") {
    redirect("/login");
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      enrollments: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href={`/dashboard/courses/${params.courseId}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Course
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          {course.enrollments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No students enrolled yet.</p>
          ) : (
            <StudentsListClient enrollments={course.enrollments} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
