"use client";

import { useState } from "react";
import { gradeSubmission } from "@/actions/submission";
import { Button, Textarea, Alert, AlertDescription, Input } from "@/components/ui";

interface GradeFormProps {
  submissionId: string;
  maxScore: number;
}

export function GradeForm({ submissionId, maxScore }: GradeFormProps) {
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await gradeSubmission({
        submissionId,
        grade: Number(grade),
        feedback,
      });
      setSuccess(true);
    } catch {
      setError("Failed to submit grade. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>Grade submitted successfully!</AlertDescription>
        </Alert>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Grade (out of {maxScore})</label>
        <Input
          type="number"
          min={0}
          max={maxScore}
          value={grade}
          onChange={e => setGrade(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback (optional)</label>
        <Textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Leave comments for the student..."
          rows={4}
        />
      </div>
      <Button type="submit" loading={loading}>
        Submit Grade
      </Button>
    </form>
  );
}
