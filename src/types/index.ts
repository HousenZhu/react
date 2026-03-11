// src/types/index.ts
import type {
  User,
  Course,
  Module,
  Content,
  Quiz,
  Question,
  Assignment,
  Submission,
  Enrollment,
  DiscussionPost,
  Certificate,
  QuizAttempt,
  Role,
  ContentType,
  QuestionType,
  SubmissionStatus,
} from "@prisma/client";

// Re-export Prisma types
export type {
  User,
  Course,
  Module,
  Content,
  Quiz,
  Question,
  Assignment,
  Submission,
  Enrollment,
  DiscussionPost,
  Certificate,
  QuizAttempt,
};

export { Role, ContentType, QuestionType, SubmissionStatus };

// ==================== EXTENDED TYPES ====================

export type UserWithoutPassword = Omit<User, "password">;

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
}

export interface CourseWithTeacher extends Course {
  teacher: UserPublic;
}

export interface CourseWithDetails extends Course {
  teacher: UserPublic;
  modules: ModuleWithContent[];
  _count: {
    enrollments: number;
  };
  isTeacher?: boolean;
  isEnrolled?: boolean;
}

export interface ModuleWithContent extends Module {
  contents: Content[];
  quizzes: Quiz[];
  assignments: Assignment[];
}

export interface ModuleWithProgress extends ModuleWithContent {
  quizzes: QuizWithAttempt[];
  assignments: AssignmentWithSubmission[];
}

export interface QuizWithQuestions extends Quiz {
  questions: Question[];
}

export interface QuizWithAttempt extends Quiz {
  attempts: QuizAttempt[];
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AssignmentWithSubmission extends Assignment {
  submissions: Submission[];
}

export interface SubmissionWithDetails extends Submission {
  student: UserPublic;
  assignment: Assignment & {
    module: Module & {
      course: Pick<Course, "id" | "title" | "teacherId">;
    };
  };
}

export interface EnrollmentWithCourse extends Enrollment {
  course: CourseWithTeacher;
}

export interface EnrollmentWithStudent extends Enrollment {
  student: UserPublic;
}

export interface DiscussionPostWithAuthor extends DiscussionPost {
  author: UserPublic & { role: Role };
  _count?: {
    replies: number;
  };
}

export interface DiscussionThread extends DiscussionPostWithAuthor {
  replies: DiscussionPostWithAuthor[];
}

export interface CertificateWithDetails extends Certificate {
  student: Pick<User, "id" | "name">;
  course: Pick<Course, "id" | "title"> & {
    teacher: Pick<User, "name">;
  };
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== QUIZ TYPES ====================

export interface QuizSubmitResult {
  attempt: QuizAttempt;
  results: {
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    earnedPoints: number;
    totalPoints: number;
  };
}

// ==================== ANALYTICS TYPES ====================

export interface CourseAnalytics {
  totalStudents: number;
  averageProgress: number;
  completedStudents: number;
  completionRate: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageGrade: number;
}

export interface StudentProgress {
  courseId: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  completedQuizzes: number;
  totalQuizzes: number;
  submittedAssignments: number;
  totalAssignments: number;
  averageQuizScore: number;
  averageAssignmentGrade: number;
}

// ==================== DEADLINE TYPES ====================

export interface Deadline {
  id: string;
  title: string;
  description: string | null;
  deadline: Date;
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  isSubmitted: boolean;
  submission: Submission | null;
}

// ==================== REAL-TIME TYPES ====================

export interface RealtimeMessage {
  type: "new_post" | "update_post" | "delete_post" | "connected";
  payload?: unknown;
  userId?: string;
  userName?: string;
  timestamp?: string;
  courseId?: string;
}

// ==================== UPLOAD TYPES ====================

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
  size: number;
  type: string;
}

// ==================== CALENDAR TYPES ====================

export interface CalendarEvent {
  title: string;
  description?: string;
  deadline: Date;
  courseTitle: string;
}
