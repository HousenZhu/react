// src/actions/submission.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireTeacher } from "@/lib/auth-server";
import {
  createSubmissionSchema,
  gradeSubmissionSchema,
  type CreateSubmissionInput,
  type GradeSubmissionInput,
} from "@/lib/validations";
import { SubmissionStatus } from "@prisma/client";

/**
 * Submit an assignment
 */
export async function submitAssignment(input: CreateSubmissionInput) {
  const user = await requireAuth();

  const validated = createSubmissionSchema.parse(input);

  // Get assignment
  const assignment = await db.assignment.findUnique({
    where: { id: validated.assignmentId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: assignment.module.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error("Not enrolled in this course");
  }

  // Determine if late
  const isLate = new Date() > assignment.deadline;
  if (isLate && !assignment.allowLate) {
    throw new Error("This assignment no longer accepts submissions");
  }

  // Check for existing submission
  const existingSubmission = await db.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: validated.assignmentId,
        studentId: user.id,
      },
    },
  });

  let submission;

  if (existingSubmission) {
    // Update existing submission
    submission = await db.submission.update({
      where: { id: existingSubmission.id },
      data: {
        content: validated.content,
        fileUrl: validated.fileUrl,
        fileName: validated.fileName,
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        // Reset grade if resubmitting
        grade: null,
        feedback: null,
        gradedAt: null,
      },
    });
  } else {
    // Create new submission
    submission = await db.submission.create({
      data: {
        ...validated,
        studentId: user.id,
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
      },
    });
  }

  revalidatePath(`/dashboard/courses/${assignment.module.courseId}`);
  revalidatePath(`/dashboard/assignments/${assignment.id}`);

  return submission;
}

/**
 * Grade a submission
 */
export async function gradeSubmission(input: GradeSubmissionInput) {
  const user = await requireTeacher();

  const validated = gradeSubmissionSchema.parse(input);

  // Get submission and verify access
  const submission = await db.submission.findUnique({
    where: { id: validated.submissionId },
    include: {
      assignment: {
        include: {
          module: {
            include: { course: true },
          },
        },
      },
    },
  });

  if (!submission || submission.assignment.module.course.teacherId !== user.id) {
    throw new Error("Submission not found or access denied");
  }

  // Validate grade is within range
  if (validated.grade > submission.assignment.maxScore) {
    throw new Error(`Grade cannot exceed ${submission.assignment.maxScore}`);
  }

  const updated = await db.submission.update({
    where: { id: validated.submissionId },
    data: {
      grade: validated.grade,
      feedback: validated.feedback,
      status: SubmissionStatus.GRADED,
      gradedAt: new Date(),
    },
  });

  revalidatePath(`/dashboard/courses/${submission.assignment.module.courseId}`);

  return updated;
}

/**
 * Get all submissions for an assignment (teacher view)
 */
export async function getAssignmentSubmissions(assignmentId: string) {
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

  const submissions = await db.submission.findMany({
    where: { assignmentId },
    include: {
      student: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return {
    assignment,
    submissions,
  };
}

/**
 * Get a single submission
 */
export async function getSubmission(submissionId: string) {
  const user = await requireAuth();

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: {
        select: { id: true, name: true, email: true, image: true },
      },
      assignment: {
        include: {
          module: {
            include: {
              course: {
                select: { id: true, title: true, teacherId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  // Check access: student can view their own, teacher can view course submissions
  const isOwner = submission.studentId === user.id;
  const isTeacher = submission.assignment.module.course.teacherId === user.id;

  if (!isOwner && !isTeacher) {
    throw new Error("Access denied");
  }

  return submission;
}

/**
 * Get student's submissions across all courses
 */
export async function getMySubmissions() {
  const user = await requireAuth();

  const submissions = await db.submission.findMany({
    where: { studentId: user.id },
    include: {
      assignment: {
        include: {
          module: {
            include: {
              course: {
                select: { id: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return submissions;
}

/**
 * Get submissions pending grading (teacher view)
 */
export async function getPendingSubmissions() {
  const user = await requireTeacher();

  const submissions = await db.submission.findMany({
    where: {
      status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
      assignment: {
        module: {
          course: {
            teacherId: user.id,
          },
        },
      },
    },
    include: {
      student: {
        select: { id: true, name: true, email: true, image: true },
      },
      assignment: {
        include: {
          module: {
            include: {
              course: {
                select: { id: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  return submissions;
}
