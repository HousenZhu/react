// src/actions/course.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireTeacher, getCurrentUser } from "@/lib/auth-server";
import {
  createCourseSchema,
  updateCourseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "@/lib/validations";
import { Role } from "@prisma/client";

// ==================== QUERIES ====================

/**
 * Get all published courses (for students)
 */
export async function getPublishedCourses() {
  const courses = await db.course.findMany({
    where: { published: true },
    include: {
      teacher: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: {
          enrollments: true,
          modules: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses;
}

/**
 * Get courses taught by the current teacher
 */
export async function getTeacherCourses() {
  const user = await requireTeacher();

  const courses = await db.course.findMany({
    where: { teacherId: user.id },
    include: {
      _count: {
        select: {
          enrollments: true,
          modules: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses;
}

/**
 * Get courses the current student is enrolled in
 */
export async function getEnrolledCourses() {
  const user = await requireAuth();

  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        include: {
          teacher: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { modules: true },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return enrollments.map((e) => ({
    ...e.course,
    progress: e.progress,
    completed: e.completed,
    enrolledAt: e.enrolledAt,
  }));
}

/**
 * Get a single course by ID with full details
 */
export async function getCourse(courseId: string) {
  const user = await getCurrentUser();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: {
        select: { id: true, name: true, email: true, image: true },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          contents: { orderBy: { order: "asc" } },
          quizzes: true,
          assignments: true,
        },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  });

  if (!course) return null;

  // Check access
  const isTeacher = user?.role === Role.TEACHER && course.teacherId === user.id;
  const isEnrolled = user
    ? await db.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.id,
            courseId: course.id,
          },
        },
      })
    : null;

  if (!course.published && !isTeacher) {
    return null;
  }

  return {
    ...course,
    isTeacher,
    isEnrolled: !!isEnrolled,
    enrollment: isEnrolled,
  };
}

/**
 * Get course with student progress details
 */
export async function getCourseWithProgress(courseId: string) {
  const user = await requireAuth();

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              contents: { orderBy: { order: "asc" } },
              quizzes: {
                include: {
                  attempts: {
                    where: { studentId: user.id },
                    orderBy: { submittedAt: "desc" },
                    take: 1,
                  },
                },
              },
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: user.id },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return enrollment;
}

// ==================== MUTATIONS ====================

/**
 * Create a new course
 */
export async function createCourse(input: CreateCourseInput) {
  const user = await requireTeacher();

  const validated = createCourseSchema.parse(input);

  const course = await db.course.create({
    data: {
      ...validated,
      teacherId: user.id,
    },
  });

  revalidatePath("/dashboard/courses");

  return course;
}

/**
 * Update a course
 */
export async function updateCourse(courseId: string, input: UpdateCourseInput) {
  const user = await requireTeacher();

  // Verify ownership
  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  const validated = updateCourseSchema.parse(input);

  const updated = await db.course.update({
    where: { id: courseId },
    data: validated,
  });

  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/courses");

  return updated;
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId: string) {
  const user = await requireTeacher();

  // Verify ownership
  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  await db.course.delete({
    where: { id: courseId },
  });

  revalidatePath("/dashboard/courses");

  return { success: true };
}

/**
 * Publish/unpublish a course
 */
export async function toggleCoursePublish(courseId: string) {
  const user = await requireTeacher();

  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  const updated = await db.course.update({
    where: { id: courseId },
    data: { published: !course.published },
  });

  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");

  return updated;
}

/**
 * Get course analytics for teacher
 */
export async function getCourseAnalytics(courseId: string) {
  const user = await requireTeacher();

  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
    include: {
      enrollments: {
        include: {
          student: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      modules: {
        include: {
          assignments: {
            include: {
              submissions: true,
            },
          },
          quizzes: {
            include: {
              attempts: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  // Calculate analytics
  const totalStudents = course.enrollments.length;
  const averageProgress =
    totalStudents > 0
      ? course.enrollments.reduce((sum, e) => sum + e.progress, 0) / totalStudents
      : 0;

  const completedStudents = course.enrollments.filter((e) => e.completed).length;

  // Calculate submission stats
  const allSubmissions = course.modules.flatMap((m) =>
    m.assignments.flatMap((a) => a.submissions)
  );
  const gradedSubmissions = allSubmissions.filter((s) => s.grade !== null);
  const averageGrade =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) /
        gradedSubmissions.length
      : 0;

  return {
    course,
    analytics: {
      totalStudents,
      averageProgress,
      completedStudents,
      completionRate: totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
      totalSubmissions: allSubmissions.length,
      gradedSubmissions: gradedSubmissions.length,
      averageGrade,
    },
  };
}
