// src/app/(dashboard)/dashboard/courses/[courseId]/modules/[moduleId]/assignments/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAssignment } from "@/actions/assignment";
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

interface CreateAssignmentPageProps {
  params: { courseId: string; moduleId: string };
}

export default function CreateAssignmentPage({ params }: CreateAssignmentPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [allowLate, setAllowLate] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createAssignment({
        moduleId: params.moduleId,
        title,
        description: description || undefined,
        instructions: instructions || undefined,
        deadline: new Date(deadline).toISOString(),
        maxScore: parseInt(maxScore) || 100,
        allowLate,
      });
      router.push(`/dashboard/courses/${params.courseId}/modules/${params.moduleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment. Please try again.");
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}`}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Module
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                placeholder="e.g., Week 1 Homework"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the assignment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Detailed instructions for students..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  min={today}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxScore">Maximum Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  max="1000"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="allowLate"
                type="checkbox"
                checked={allowLate}
                onChange={(e) => setAllowLate(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="allowLate" className="cursor-pointer">
                Allow late submissions
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}`}>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || !title.trim() || !deadline}>
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
