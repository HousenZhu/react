// src/app/(dashboard)/dashboard/courses/[courseId]/modules/[moduleId]/contents/[contentId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";

interface ContentPageProps {
  params: { courseId: string; moduleId: string; contentId: string };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const content = await db.content.findUnique({
    where: { id: params.contentId },
    include: {
      module: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!content) notFound();

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
          <CardTitle>{content.title}</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{content.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.type === "PDF" && content.fileUrl && (
            <iframe src={content.fileUrl} className="w-full h-[600px] border rounded" title="PDF Preview" />
          )}
          {content.type === "IMAGE" && content.fileUrl && (
            <img src={content.fileUrl} alt={content.title} className="max-w-full rounded shadow" />
          )}
          {content.type === "VIDEO" && content.fileUrl && (
            <video src={content.fileUrl} controls className="w-full rounded shadow" />
          )}
          {content.type === "LINK" && content.linkUrl && (
            <a href={content.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Link</a>
          )}
          {content.fileUrl && (content.type === "PDF" || content.type === "IMAGE" || content.type === "VIDEO") && (
            <a href={content.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Download File</Button>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
