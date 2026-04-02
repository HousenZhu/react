// src/actions/enrollment.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { Role } from "@prisma/client";

/**
 * Enroll the current user in a course
 */
export async function enrollInCourse(courseId: string) {
  const user = await requireAuth();

  // Verify course exists and is published
  const course = await db.course.findFirst({
    where: { id: courseId, published: true },
  });

  if (!course) {
    throw new Error("Course not found or not available");
  }

  // Teachers cannot enroll in their own courses
  if (course.teacherId === user.id) {
    throw new Error("You cannot enroll in your own course");
  }

  // Check if already enrolled
  const existingEnrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new Error("Already enrolled in this course");
  }

  const enrollment = await db.enrollment.create({
    data: {
      studentId: user.id,
      courseId,
    },
  });

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");

  return enrollment;
}

/**
 * Unenroll the current user from a course
 */
export async function unenrollFromCourse(courseId: string) {
  const user = await requireAuth();

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error("Not enrolled in this course");
  }

  await db.enrollment.delete({
    where: { id: enrollment.id },
  });

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Update enrollment progress
 */
export async function updateEnrollmentProgress(
  courseId: string,
  progress: number
) {
  const user = await requireAuth();

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error("Not enrolled in this course");
  }

  const updated = await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress: Math.min(100, Math.max(0, progress)),
      completed: progress >= 100,
    },
  });

  revalidatePath(`/dashboard/courses/${courseId}`);

  return updated;
}

/**
 * Calculate and update progress based on completions
 */
export async function recalculateProgress(courseId: string) {
  const user = await requireAuth();

  // Get course modules with all assessments
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          quizzes: true,
          assignments: true,
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  // Count total items and completed items
  let totalItems = 0;
  let completedItems = 0;

  for (const module of course.modules) {
    // Count quizzes
    for (const quiz of module.quizzes) {
      totalItems++;
      const attempt = await db.quizAttempt.findFirst({
        where: {
          quizId: quiz.id,
          studentId: user.id,
          passed: true,
        },
      });
      if (attempt) completedItems++;
    }

    // Count assignments
    for (const assignment of module.assignments) {
      totalItems++;
      const submission = await db.submission.findFirst({
        where: {
          assignmentId: assignment.id,
          studentId: user.id,
        },
      });
      if (submission) completedItems++;
    }
  }

  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const enrollment = await db.enrollment.update({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
    data: {
      progress,
      completed: progress >= 100,
    },
  });

  revalidatePath(`/dashboard/courses/${courseId}`);

  return enrollment;
}

/**
 * Get enrolled students for a course (teacher only)
 */
export async function getCourseEnrollments(courseId: string) {
  const user = await requireAuth();

  // Verify teacher owns the course
  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });

  if (!course && user.role !== Role.TEACHER) {
    throw new Error("Access denied");
  }

  const enrollments = await db.enrollment.findMany({
    where: { courseId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return enrollments;
}

/**
 * Remove a student from a course (teacher only)
 */
export async function removeStudentFromCourse(
  courseId: string,
  studentId: string
) {
  const user = await requireAuth();

  // Verify teacher owns the course
  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  await db.enrollment.delete({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  revalidatePath(`/dashboard/courses/${courseId}/students`);

  return { success: true };
}
