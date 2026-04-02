// src/app/(dashboard)/dashboard/certificates/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { generateCertificate } from "@/actions/certificate";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";

export default async function CertificatesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as { id: string; role?: string };

  const certificates = await db.certificate.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          teacher: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { generatedAt: "desc" },
  });

  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        include: {
          teacher: {
            select: { name: true },
          },
          certificates: {
            where: { studentId: user.id },
            select: { id: true },
          },
          modules: {
            include: {
              quizzes: {
                include: {
                  attempts: {
                    where: { studentId: user.id },
                    select: { passed: true },
                  },
                },
              },
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: user.id },
                    select: { status: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const eligibleCourses = enrollments
    .map((enrollment: any) => {
      const totalItems =
        enrollment.course.modules.reduce(
          (sum: number, module: any) => sum + module.assignments.length + module.quizzes.length,
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

      const completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        courseId: enrollment.course.id,
        title: enrollment.course.title,
        teacherName: enrollment.course.teacher.name,
        completionPct,
        hasCertificate: enrollment.course.certificates.length > 0,
      };
    })
    .filter((course) => course.completionPct >= 100 && !course.hasCertificate);

  async function handleGenerateCertificate(formData: FormData) {
    "use server";

    const courseId = String(formData.get("courseId") || "");
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    await generateCertificate(courseId);
    redirect("/dashboard/certificates");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Certificates</h1>
        <p className="text-gray-600">
          Your earned certificates for completed courses
        </p>
      </div>

      {eligibleCourses.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle>Ready to Claim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eligibleCourses.map((course) => (
                <div key={course.courseId} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-lg bg-white p-4">
                  <div>
                    <p className="font-medium text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-500">Instructor: {course.teacherName || "Unknown Instructor"}</p>
                  </div>
                  <form action={handleGenerateCertificate}>
                    <input type="hidden" name="courseId" value={course.courseId} />
                    <Button type="submit">Generate Certificate</Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8m-4-4v4m-5-9h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2zm-2-5H3a1 1 0 00-1 1v1a4 4 0 004 4h1m10-6h2a1 1 0 011 1v1a4 4 0 01-4 4h-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
            <p className="text-gray-600 mb-4">
              Complete courses to earn certificates! Keep learning and you&apos;ll get there.
            </p>
            <Link href="/dashboard/courses">
              <Button>Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert: {
            id: string;
            generatedAt: Date;
            fileUrl: string | null;
            course: {
              id: string;
              title: string;
              description: string | null;
              teacher: { name: string | null };
            };
          }) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <svg className="w-10 h-10 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8m-4-4v4m-5-9h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2zm-2-5H3a1 1 0 00-1 1v1a4 4 0 004 4h1m10-6h2a1 1 0 011 1v1a4 4 0 01-4 4h-1" />
                  </svg>
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    Verified
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{cert.course.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  Instructor: {cert.course.teacher.name || 'Unknown Instructor'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Issue Date</span>
                    <span className="font-medium">
                      {new Date(cert.generatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Certificate ID</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {cert.id.slice(0, 12)}...
                    </span>
                  </div>
                  {cert.fileUrl && (
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full" variant="outline">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Certificate
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {certificates.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Keep Learning!</h3>
                <p className="text-sm text-gray-600">
                  You have earned {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}. 
                  Complete more courses to add to your collection.
                </p>
              </div>
              <Link href="/courses">
                <Button>Explore Courses</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
