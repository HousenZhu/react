// src/actions/assignment.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireTeacher } from "@/lib/auth-server";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
} from "@/lib/validations";

// ==================== ASSIGNMENT CRUD ====================

/**
 * Create a new assignment
 */
export async function createAssignment(input: CreateAssignmentInput) {
  const user = await requireTeacher();

  const validated = createAssignmentSchema.parse(input);

  const module = await db.module.findUnique({
    where: { id: validated.moduleId },
    include: { course: true },
  });

  if (!module || module.course.teacherId !== user.id) {
    throw new Error("Module not found or access denied");
  }

  const assignment = await db.assignment.create({
    data: {
      ...validated,
      deadline: new Date(validated.deadline),
    },
  });

  revalidatePath(`/dashboard/courses/${module.courseId}`);

  return assignment;
}

/**
 * Update an assignment
 */
export async function updateAssignment(
  assignmentId: string,
  input: UpdateAssignmentInput
) {
  const user = await requireTeacher();

  const validated = updateAssignmentSchema.parse(input);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!assignment || assignment.module.course.teacherId !== user.id) {
    throw new Error("Assignment not found or access denied");
  }

  const updated = await db.assignment.update({
    where: { id: assignmentId },
    data: {
      ...validated,
      deadline: validated.deadline ? new Date(validated.deadline) : undefined,
    },
  });

  revalidatePath(`/dashboard/courses/${assignment.module.courseId}`);

  return updated;
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(assignmentId: string) {
  const user = await requireTeacher();

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!assignment || assignment.module.course.teacherId !== user.id) {
    throw new Error("Assignment not found or access denied");
  }

  await db.assignment.delete({
    where: { id: assignmentId },
  });

  revalidatePath(`/dashboard/courses/${assignment.module.courseId}`);

  return { success: true };
}

/**
 * Get assignment details
 */
export async function getAssignment(assignmentId: string) {
  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        include: {
          course: {
            select: { id: true, title: true, teacherId: true },
          },
        },
      },
    },
  });

  return assignment;
}

/**
 * Get assignment with submission for current student
 */
export async function getAssignmentWithSubmission(assignmentId: string) {
  const user = await requireAuth();

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        include: {
          course: {
            select: { id: true, title: true, teacherId: true },
          },
        },
      },
      submissions: {
        where: { studentId: user.id },
        take: 1,
      },
    },
  });

  if (!assignment) return null;

  return {
    ...assignment,
    submission: assignment.submissions[0] || null,
  };
}

/**
 * Get all upcoming deadlines for a student
 */
export async function getUpcomingDeadlines() {
  const user = await requireAuth();

  // Get enrolled courses
  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });

  const courseIds = enrollments.map((e) => e.courseId);

  // Get upcoming assignments
  const assignments = await db.assignment.findMany({
    where: {
      module: {
        courseId: { in: courseIds },
      },
      deadline: { gte: new Date() },
    },
    include: {
      module: {
        include: {
          course: {
            select: { id: true, title: true },
          },
        },
      },
      submissions: {
        where: { studentId: user.id },
      },
    },
    orderBy: { deadline: "asc" },
    take: 10,
  });

  return assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    deadline: a.deadline,
    courseId: a.module.course.id,
    courseTitle: a.module.course.title,
    moduleTitle: a.module.title,
    isSubmitted: a.submissions.length > 0,
    submission: a.submissions[0] || null,
  }));
}

/**
 * Get all assignments for a course (teacher view)
 */
export async function getCourseAssignments(courseId: string) {
  const user = await requireTeacher();

  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  const assignments = await db.assignment.findMany({
    where: {
      module: { courseId },
    },
    include: {
      module: {
        select: { id: true, title: true },
      },
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { deadline: "asc" },
  });

  return assignments;
}
