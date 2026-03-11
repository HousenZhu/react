// src/app/(dashboard)/dashboard/courses/[courseId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateCourse, deleteCourse, toggleCoursePublish, getCourse } from "@/actions/course";
import { Button, Input, Label, Textarea, Card, CardHeader, CardTitle, CardContent, CardFooter, Alert, AlertDescription, Badge } from "@/components/ui";

interface EditCoursePageProps {
  params: { courseId: string };
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        const result = await getCourse(params.courseId);
        if (!result) {
          setError("Course not found");
          return;
        }
        setTitle(result.title);
        setDescription(result.description || "");
        setIsPublished(result.isPublished);
      } catch {
        setError("Failed to load course");
      }
    }
    loadCourse();
  }, [params.courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await updateCourse(params.courseId, { title, description });
      router.push(`/dashboard/courses/${params.courseId}`);
    } catch {
      setError("Failed to update course. Please try again.");
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const result = await toggleCoursePublish(params.courseId);
      setIsPublished(result.isPublished);
    } catch {
      setError("Failed to change publish status");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await deleteCourse(params.courseId);
      router.push("/dashboard/courses");
    } catch {
      setError("Failed to delete course");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/courses/${params.courseId}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Course
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Course</CardTitle>
          <Badge variant={isPublished ? "success" : "secondary"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Web Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn in this course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={deleteConfirm ? "destructive" : "outline"}
                onClick={handleDelete}
                disabled={loading}
              >
                {deleteConfirm ? "Confirm Delete" : "Delete Course"}
              </Button>
              {deleteConfirm && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePublish}
                disabled={loading}
              >
                {isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
