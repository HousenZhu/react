// src/app/(dashboard)/dashboard/certificates/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Certificates</h1>
        <p className="text-gray-600">
          Your earned certificates for completed courses
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">?</div>
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
                  <span className="text-4xl">?</span>
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
