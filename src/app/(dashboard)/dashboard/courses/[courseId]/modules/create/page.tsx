// src/app/(dashboard)/dashboard/courses/[courseId]/modules/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createModule } from "@/actions/module";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Alert,
  AlertDescription,
} from "@/components/ui";

interface CreateModulePageProps {
  params: { courseId: string };
}

export default function CreateModulePage({ params }: CreateModulePageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createModule({
        courseId: params.courseId,
        title,
        description: description || undefined,
      });
      router.push(`/dashboard/courses/${params.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/courses/${params.courseId}`}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Course
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Module</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Module Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to the Basics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this module covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href={`/dashboard/courses/${params.courseId}`}>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Module"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
