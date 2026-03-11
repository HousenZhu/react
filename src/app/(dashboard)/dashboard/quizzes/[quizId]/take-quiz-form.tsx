// src/app/(dashboard)/dashboard/quizzes/[quizId]/take-quiz-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitQuiz } from "@/actions/quiz";
import { Button, Card, CardContent, Alert, AlertDescription, Badge } from "@/components/ui";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface TakeQuizFormProps {
  quizId: string;
  questions: Question[];
}

export function TakeQuizForm({ quizId, questions }: TakeQuizFormProps) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions < questions.length) {
      setError(`Please answer all questions. ${questions.length - answeredQuestions} remaining.`);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const submission = await submitQuiz({
        quizId,
        answers,
      });

      setResult({
        score: submission.results.score,
        passed: submission.results.passed,
        correctAnswers: submission.results.correctAnswers,
        totalQuestions: questions.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit quiz. Please try again.";
      setError(message);
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="text-center py-8">
        <div className={`text-6xl mb-4 ${result.passed ? '?' : '?'}`}>
          {result.passed ? '?' : '?'}
        </div>
        <h3 className="text-2xl font-bold mb-2">
          {result.passed ? "Congratulations!" : "Keep Learning!"}
        </h3>
        <p className="text-gray-600 mb-4">
          You scored {result.score.toFixed(0)}% ({result.correctAnswers}/{result.totalQuestions} correct)
        </p>
        <Badge variant={result.passed ? "success" : "secondary"} className="text-lg px-4 py-2">
          {result.passed ? "PASSED" : "NOT PASSED"}
        </Badge>
        <div className="mt-6 flex justify-center gap-4">
          <Button variant="outline" onClick={() => {
            setStarted(false);
            setAnswers({});
            setResult(null);
          }}>
            Try Again
          </Button>
          <Button onClick={() => router.push("/dashboard/quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-4">Ready to start the quiz?</h3>
        <p className="text-gray-600 mb-6">
          This quiz has {questions.length} questions. Answer all questions to submit.
        </p>
        <Button onClick={() => setStarted(true)}>
          Start Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {questions.map((question, qIndex) => (
          <Card key={question.id} className={answers[question.id] !== undefined ? "border-green-200" : ""}>
            <CardContent className="pt-6">
              <p className="font-medium mb-4">
                {qIndex + 1}. {question.text}
              </p>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[question.id] === option.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[question.id] === option.id}
                      onChange={() => handleAnswer(question.id, option.id)}
                      className="mr-3"
                    />
                    <span>{String.fromCharCode(65 + optIndex)}. {option.text}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg sticky bottom-4">
        <p className="text-sm text-gray-600">
          {Object.keys(answers).length}/{questions.length} questions answered
        </p>
        <Button onClick={handleSubmit} loading={loading}>
          Submit Quiz
        </Button>
      </div>
    </div>
  );
}
