// src/app/(dashboard)/dashboard/courses/[courseId]/modules/[moduleId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getModule, updateModule, deleteModule } from "@/actions/module";
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
  Badge,
} from "@/components/ui";

interface ModulePageProps {
  params: { courseId: string; moduleId: string };
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  order: number;
  course: { id: string; title: string; teacherId: string };
  contents: Array<{ id: string; title: string; type: string; order: number }>;
  quizzes: Array<{ id: string; title: string }>;
  assignments: Array<{ id: string; title: string; deadline: Date }>;
}

export default function ModulePage({ params }: ModulePageProps) {
  const router = useRouter();
  const [module, setModule] = useState<ModuleData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadModule() {
      try {
        const result = await getModule(params.moduleId);
        if (!result) {
          setError("Module not found");
          return;
        }
        setModule(result as ModuleData);
        setTitle(result.title);
        setDescription(result.description || "");
      } catch {
        setError("Failed to load module");
      }
    }
    loadModule();
  }, [params.moduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await updateModule(params.moduleId, { title, description });
      router.push(`/dashboard/courses/${params.courseId}`);
    } catch {
      setError("Failed to update module. Please try again.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await deleteModule(params.moduleId);
      router.push(`/dashboard/courses/${params.courseId}`);
    } catch {
      setError("Failed to delete module");
      setLoading(false);
    }
  };

  if (!module && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading module...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {/* Module Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Module Settings</CardTitle>
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
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={deleteConfirm ? "destructive" : "outline"}
                onClick={handleDelete}
                disabled={loading}
              >
                {deleteConfirm ? "Confirm Delete" : "Delete Module"}
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
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Module Contents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contents</CardTitle>
          <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}/contents/create`}>
            <Button size="sm">Add Content</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {module?.contents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No content yet. Add your first content to this module.
            </p>
          ) : (
            <div className="space-y-2">
              {module?.contents.map((content, index) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{index + 1}.</span>
                    <span>{content.title}</span>
                    <Badge variant="secondary">{content.type}</Badge>
                  </div>
                  <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}/contents/${content.id}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quizzes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quizzes</CardTitle>
          <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}/quizzes/create`}>
            <Button size="sm">Add Quiz</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {module?.quizzes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No quizzes yet. Add a quiz to test student knowledge.
            </p>
          ) : (
            <div className="space-y-2">
              {module?.quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span>{quiz.title}</span>
                  <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}/quizzes/${quiz.id}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assignments</CardTitle>
          <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}/assignments/create`}>
            <Button size="sm">Add Assignment</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {module?.assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No assignments yet. Add an assignment for students to complete.
            </p>
          ) : (
            <div className="space-y-2">
              {module?.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span>{assignment.title}</span>
                  <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}/assignments/${assignment.id}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
