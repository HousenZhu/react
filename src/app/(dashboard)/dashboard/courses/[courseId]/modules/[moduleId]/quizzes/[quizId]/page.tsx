// src/app/(dashboard)/dashboard/courses/[courseId]/modules/[moduleId]/quizzes/[quizId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getQuiz, updateQuiz, deleteQuiz, createQuestion, deleteQuestion } from "@/actions/quiz";
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

interface QuizPageProps {
  params: { courseId: string; moduleId: string; quizId: string };
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options: string | QuestionOption[];
  points: number;
  order: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  questions: Question[];
}

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("60");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // New question form state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionPoints, setQuestionPoints] = useState("1");
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: "1", text: "", isCorrect: true },
    { id: "2", text: "", isCorrect: false },
  ]);

  useEffect(() => {
    loadQuiz();
  }, [params.quizId]);

  async function loadQuiz() {
    try {
      const result = await getQuiz(params.quizId);
      if (!result) {
        setError("Quiz not found");
        return;
      }
      setQuiz(result as unknown as QuizData);
      setTitle(result.title);
      setDescription(result.description || "");
      setTimeLimit(result.timeLimit?.toString() || "");
      setPassingScore(result.passingScore.toString());
    } catch {
      setError("Failed to load quiz");
    }
  }

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await updateQuiz(params.quizId, {
        title,
        description: description || undefined,
        timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
        passingScore: parseFloat(passingScore),
      });
      await loadQuiz();
      setLoading(false);
    } catch {
      setError("Failed to update quiz");
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
      await deleteQuiz(params.quizId);
      router.push(`/dashboard/courses/${params.courseId}/modules/${params.moduleId}`);
    } catch {
      setError("Failed to delete quiz");
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate at least one correct answer
    const hasCorrect = options.some(opt => opt.isCorrect);
    if (!hasCorrect) {
      setError("Please mark at least one option as correct");
      setLoading(false);
      return;
    }

    // Validate all options have text
    const allHaveText = options.every(opt => opt.text.trim());
    if (!allHaveText) {
      setError("Please fill in all options");
      setLoading(false);
      return;
    }

    try {
      await createQuestion({
        quizId: params.quizId,
        text: questionText,
        type: "MULTIPLE_CHOICE",
        options: options,
        points: parseInt(questionPoints) || 1,
      });
      
      // Reset form
      setQuestionText("");
      setQuestionPoints("1");
      setOptions([
        { id: "1", text: "", isCorrect: true },
        { id: "2", text: "", isCorrect: false },
      ]);
      setShowAddQuestion(false);
      await loadQuiz();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add question");
    }
    setLoading(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    
    try {
      await deleteQuestion(questionId);
      await loadQuiz();
    } catch {
      setError("Failed to delete question");
    }
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { id: Date.now().toString(), text: "", isCorrect: false }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(opt => opt.id !== id));
  };

  const updateOption = (id: string, field: "text" | "isCorrect", value: string | boolean) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const parseOptions = (opts: string | QuestionOption[]): QuestionOption[] => {
    if (typeof opts === "string") {
      try {
        return JSON.parse(opts);
      } catch {
        return [];
      }
    }
    return opts;
  };

  if (!quiz && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quiz Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <form onSubmit={handleUpdateQuiz}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  max="180"
                  placeholder="No limit"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  required
                />
              </div>
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
                {deleteConfirm ? "Confirm Delete" : "Delete Quiz"}
              </Button>
              {deleteConfirm && (
                <Button type="button" variant="ghost" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions ({quiz?.questions.length || 0})</CardTitle>
          {!showAddQuestion && (
            <Button onClick={() => setShowAddQuestion(true)}>Add Question</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Question Form */}
          {showAddQuestion && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">New Question</CardTitle>
              </CardHeader>
              <form onSubmit={handleAddQuestion}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionText">Question</Label>
                    <Textarea
                      id="questionText"
                      placeholder="Enter your question..."
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    {options.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={option.isCorrect}
                          onChange={() => {
                            setOptions(options.map(opt => ({
                              ...opt,
                              isCorrect: opt.id === option.id
                            })));
                          }}
                          className="w-4 h-4"
                        />
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) => updateOption(option.id, "text", e.target.value)}
                          className="flex-1"
                          required
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(option.id)}
                          >
                            ?
                          </Button>
                        )}
                      </div>
                    ))}
                    {options.length < 6 && (
                      <Button type="button" variant="outline" size="sm" onClick={addOption}>
                        + Add Option
                      </Button>
                    )}
                    <p className="text-xs text-gray-500">Select the radio button for the correct answer</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questionPoints">Points</Label>
                    <Input
                      id="questionPoints"
                      type="number"
                      min="1"
                      max="10"
                      value={questionPoints}
                      onChange={(e) => setQuestionPoints(e.target.value)}
                      className="w-24"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddQuestion(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !questionText.trim()}>
                    {loading ? "Adding..." : "Add Question"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Question List */}
          {quiz?.questions.length === 0 && !showAddQuestion ? (
            <p className="text-center text-gray-500 py-8">
              No questions yet. Add your first question to this quiz.
            </p>
          ) : (
            <div className="space-y-4">
              {quiz?.questions.map((question, index) => {
                const opts = parseOptions(question.options);
                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Q{index + 1}.</span>
                          <span>{question.text}</span>
                          <Badge variant="secondary">{question.points} pt{question.points > 1 ? "s" : ""}</Badge>
                        </div>
                        <div className="ml-6 space-y-1">
                          {opts.map((opt, optIndex) => (
                            <div
                              key={opt.id}
                              className={`text-sm ${opt.isCorrect ? "text-green-600 font-medium" : "text-gray-600"}`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {opt.text}
                              {opt.isCorrect && " ?"}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
