// src/lib/validations.ts
import { z } from "zod";

// ==================== AUTH VALIDATIONS ====================

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["TEACHER", "STUDENT"]).default("STUDENT"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ==================== COURSE VALIDATIONS ====================

export const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  published: z.boolean().optional(),
});

// ==================== MODULE VALIDATIONS ====================

export const createModuleSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
});

export const updateModuleSchema = createModuleSchema.partial().omit({ courseId: true });

export const reorderModulesSchema = z.object({
  courseId: z.string().cuid(),
  moduleIds: z.array(z.string().cuid()),
});

// ==================== CONTENT VALIDATIONS ====================

export const createContentSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(2).max(100),
  type: z.enum(["PDF", "VIDEO", "LINK", "IMAGE"]),
  fileUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().url().optional().nullable(),
  duration: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional(),
});

export const updateContentSchema = createContentSchema.partial().omit({ moduleId: true });

// ==================== QUIZ VALIDATIONS ====================

export const createQuizSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  timeLimit: z.number().int().min(1).max(180).optional(), // 1-180 minutes
  passingScore: z.number().min(0).max(100).default(60),
});

export const updateQuizSchema = createQuizSchema.partial().omit({ moduleId: true });

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

export const createQuestionSchema = z.object({
  quizId: z.string().cuid(),
  text: z.string().min(5).max(1000),
  type: z.enum(["MULTIPLE_CHOICE"]).default("MULTIPLE_CHOICE"),
  options: z.array(questionOptionSchema).min(2).max(6),
  points: z.number().int().min(1).max(10).default(1),
  order: z.number().int().min(0).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial().omit({ quizId: true });

export const submitQuizSchema = z.object({
  quizId: z.string().cuid(),
  answers: z.record(z.string(), z.string()), // {questionId: selectedOptionId}
});

// ==================== ASSIGNMENT VALIDATIONS ====================

export const createAssignmentSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(3).max(100),
  description: z.string().max(5000).optional(),
  instructions: z.string().max(10000).optional(),
  deadline: z.string().datetime().or(z.date()),
  maxScore: z.number().int().min(1).max(1000).default(100),
  allowLate: z.boolean().default(true),
});

export const updateAssignmentSchema = createAssignmentSchema.partial().omit({ moduleId: true });

// ==================== SUBMISSION VALIDATIONS ====================

export const createSubmissionSchema = z.object({
  assignmentId: z.string().cuid(),
  content: z.string().max(50000).optional(),
  fileUrl: z.string().url().optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().cuid(),
  grade: z.number().min(0),
  feedback: z.string().max(10000).optional(),
});

// ==================== DISCUSSION VALIDATIONS ====================

export const createDiscussionPostSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(3).max(200).optional(), // Only for root posts
  content: z.string().min(1).max(10000),
  parentId: z.string().cuid().optional().nullable(),
});

export const updateDiscussionPostSchema = z.object({
  postId: z.string().cuid(),
  content: z.string().min(1).max(10000),
});

// ==================== ENROLLMENT VALIDATIONS ====================

export const enrollmentSchema = z.object({
  courseId: z.string().cuid(),
});

// ==================== UTILITY TYPES ====================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type CreateDiscussionPostInput = z.infer<typeof createDiscussionPostSchema>;
export type UpdateDiscussionPostInput = z.infer<typeof updateDiscussionPostSchema>;
