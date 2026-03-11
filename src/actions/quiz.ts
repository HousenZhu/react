// src/actions/quiz.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireTeacher } from "@/lib/auth-server";
import {
  createQuizSchema,
  updateQuizSchema,
  createQuestionSchema,
  updateQuestionSchema,
  submitQuizSchema,
  type CreateQuizInput,
  type UpdateQuizInput,
  type CreateQuestionInput,
  type UpdateQuestionInput,
  type SubmitQuizInput,
} from "@/lib/validations";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// ==================== QUIZ CRUD ====================

/**
 * Create a new quiz
 */
export async function createQuiz(input: CreateQuizInput) {
  const user = await requireTeacher();

  const validated = createQuizSchema.parse(input);

  const module = await db.module.findUnique({
    where: { id: validated.moduleId },
    include: { course: true },
  });

  if (!module || module.course.teacherId !== user.id) {
    throw new Error("Module not found or access denied");
  }

  const quiz = await db.quiz.create({
    data: validated,
  });

  revalidatePath(`/dashboard/courses/${module.courseId}`);

  return quiz;
}

/**
 * Update a quiz
 */
export async function updateQuiz(quizId: string, input: UpdateQuizInput) {
  const user = await requireTeacher();

  const validated = updateQuizSchema.parse(input);

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!quiz || quiz.module.course.teacherId !== user.id) {
    throw new Error("Quiz not found or access denied");
  }

  const updated = await db.quiz.update({
    where: { id: quizId },
    data: validated,
  });

  revalidatePath(`/dashboard/courses/${quiz.module.courseId}`);

  return updated;
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(quizId: string) {
  const user = await requireTeacher();

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!quiz || quiz.module.course.teacherId !== user.id) {
    throw new Error("Quiz not found or access denied");
  }

  await db.quiz.delete({
    where: { id: quizId },
  });

  revalidatePath(`/dashboard/courses/${quiz.module.courseId}`);

  return { success: true };
}

/**
 * Get a quiz with questions (for taking/viewing)
 */
export async function getQuiz(quizId: string) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      module: {
        include: {
          course: {
            select: { id: true, title: true, teacherId: true },
          },
        },
      },
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  return quiz;
}

// ==================== QUESTION CRUD ====================

/**
 * Create a question
 */
export async function createQuestion(input: CreateQuestionInput) {
  const user = await requireTeacher();

  const validated = createQuestionSchema.parse(input);

  const quiz = await db.quiz.findUnique({
    where: { id: validated.quizId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!quiz || quiz.module.course.teacherId !== user.id) {
    throw new Error("Quiz not found or access denied");
  }

  // Get next order
  const lastQuestion = await db.question.findFirst({
    where: { quizId: validated.quizId },
    orderBy: { order: "desc" },
  });

  const question = await db.question.create({
    data: {
      ...validated,
      options: JSON.stringify(validated.options),
      order: validated.order ?? (lastQuestion ? lastQuestion.order + 1 : 0),
    },
  });

  revalidatePath(`/dashboard/courses/${quiz.module.courseId}`);

  return question;
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  input: UpdateQuestionInput
) {
  const user = await requireTeacher();

  const validated = updateQuestionSchema.parse(input);

  const question = await db.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        include: {
          module: {
            include: { course: true },
          },
        },
      },
    },
  });

  if (!question || question.quiz.module.course.teacherId !== user.id) {
    throw new Error("Question not found or access denied");
  }

  const updated = await db.question.update({
    where: { id: questionId },
    data: {
      ...validated,
      options: validated.options ? JSON.stringify(validated.options) : undefined,
    },
  });

  revalidatePath(`/dashboard/courses/${question.quiz.module.courseId}`);

  return updated;
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string) {
  const user = await requireTeacher();

  const question = await db.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        include: {
          module: {
            include: { course: true },
          },
        },
      },
    },
  });

  if (!question || question.quiz.module.course.teacherId !== user.id) {
    throw new Error("Question not found or access denied");
  }

  await db.question.delete({
    where: { id: questionId },
  });

  revalidatePath(`/dashboard/courses/${question.quiz.module.courseId}`);

  return { success: true };
}

// ==================== QUIZ ATTEMPTS ====================

/**
 * Start a quiz attempt
 */
export async function startQuizAttempt(quizId: string) {
  const user = await requireAuth();

  // Check if quiz exists and user has access
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: quiz.module.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error("Not enrolled in this course");
  }

  // Create attempt
  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      studentId: user.id,
      answers: {},
    },
  });

  return attempt;
}

/**
 * Submit quiz answers
 */
export async function submitQuiz(input: SubmitQuizInput) {
  const user = await requireAuth();

  const validated = submitQuizSchema.parse(input);

  // Get quiz with questions
  const quiz = await db.quiz.findUnique({
    where: { id: validated.quizId },
    include: {
      questions: true,
      module: true,
    },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Calculate score
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const question of quiz.questions) {
    const options: QuizOption[] =
      typeof question.options === "string"
        ? JSON.parse(question.options)
        : question.options;

    totalPoints += question.points;

    const selectedOptionId = validated.answers[question.id];
    const correctOption = options.find((opt: QuizOption) => opt.isCorrect);

    if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
      correctAnswers++;
      earnedPoints += question.points;
    }
  }

  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = score >= quiz.passingScore;

  // Find existing attempt or create new one
  let attempt = await db.quizAttempt.findFirst({
    where: {
      quizId: validated.quizId,
      studentId: user.id,
      submittedAt: null,
    },
  });

  if (attempt) {
    attempt = await db.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: validated.answers,
        score,
        passed,
        submittedAt: new Date(),
      },
    });
  } else {
    attempt = await db.quizAttempt.create({
      data: {
        quizId: validated.quizId,
        studentId: user.id,
        answers: validated.answers,
        score,
        passed,
        submittedAt: new Date(),
      },
    });
  }

  revalidatePath(`/dashboard/courses/${quiz.module.courseId}`);

  return {
    attempt,
    results: {
      score,
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      earnedPoints,
      totalPoints,
    },
  };
}

/**
 * Get quiz attempts for a student
 */
export async function getQuizAttempts(quizId: string) {
  const user = await requireAuth();

  const attempts = await db.quizAttempt.findMany({
    where: {
      quizId,
      studentId: user.id,
    },
    orderBy: { submittedAt: "desc" },
  });

  return attempts;
}

/**
 * Get all attempts for a quiz (teacher view)
 */
export async function getAllQuizAttempts(quizId: string) {
  const user = await requireTeacher();

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!quiz || quiz.module.course.teacherId !== user.id) {
    throw new Error("Quiz not found or access denied");
  }

  const attempts = await db.quizAttempt.findMany({
    where: { quizId },
    include: {
      student: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return attempts;
}
