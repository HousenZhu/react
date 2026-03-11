// src/actions/analytics.ts
"use server";

import { db } from "@/lib/db";
import { requireAuth, requireTeacher } from "@/lib/auth-server";
import { Role } from "@prisma/client";

/**
 * Get dashboard analytics for the current user
 */
export async function getDashboardAnalytics() {
  const user = await requireAuth();

  if (user.role === Role.TEACHER) {
    return getTeacherDashboardAnalytics(user.id);
  } else {
    return getStudentDashboardAnalytics(user.id);
  }
}

/**
 * Get teacher dashboard analytics
 */
async function getTeacherDashboardAnalytics(teacherId: string) {
  const [
    courses,
    totalStudents,
    pendingSubmissions,
    recentEnrollments,
  ] = await Promise.all([
    // Get course stats
    db.course.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    }),
    // Total unique students
    db.enrollment.findMany({
      where: {
        course: { teacherId },
      },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
    // Pending submissions
    db.submission.count({
      where: {
        status: { in: ["SUBMITTED", "LATE"] },
        assignment: {
          module: {
            course: { teacherId },
          },
        },
      },
    }),
    // Recent enrollments
    db.enrollment.findMany({
      where: {
        course: { teacherId },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, image: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    type: "teacher" as const,
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.published).length,
    totalStudents: totalStudents.length,
    pendingSubmissions,
    recentEnrollments,
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      published: c.published,
      enrollmentCount: c._count.enrollments,
      moduleCount: c._count.modules,
    })),
  };
}

/**
 * Get student dashboard analytics
 */
async function getStudentDashboardAnalytics(studentId: string) {
  const [
    enrollments,
    submissions,
    certificates,
    upcomingDeadlines,
  ] = await Promise.all([
    // Enrolled courses with progress
    db.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teacher: {
              select: { name: true },
            },
            _count: {
              select: { modules: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    // Submission stats
    db.submission.groupBy({
      by: ["status"],
      where: { studentId },
      _count: true,
    }),
    // Earned certificates
    db.certificate.count({
      where: { studentId },
    }),
    // Upcoming deadlines
    db.assignment.findMany({
      where: {
        deadline: { gte: new Date() },
        module: {
          course: {
            enrollments: {
              some: { studentId },
            },
          },
        },
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
          where: { studentId },
          take: 1,
        },
      },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
  ]);

  // Calculate submission stats
  const submissionStats = {
    total: submissions.reduce((sum, s) => sum + s._count, 0),
    submitted: submissions.find((s) => s.status === "SUBMITTED")?._count || 0,
    graded: submissions.find((s) => s.status === "GRADED")?._count || 0,
    late: submissions.find((s) => s.status === "LATE")?._count || 0,
  };

  // Calculate overall progress
  const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
  const averageProgress = enrollments.length > 0 
    ? totalProgress / enrollments.length 
    : 0;

  return {
    type: "student" as const,
    enrolledCourses: enrollments.length,
    completedCourses: enrollments.filter((e) => e.completed).length,
    averageProgress,
    certificatesEarned: certificates,
    submissionStats,
    upcomingDeadlines: upcomingDeadlines.map((a) => ({
      id: a.id,
      title: a.title,
      deadline: a.deadline,
      courseId: a.module.course.id,
      courseTitle: a.module.course.title,
      isSubmitted: a.submissions.length > 0,
    })),
    enrollments: enrollments.map((e) => ({
      courseId: e.course.id,
      courseTitle: e.course.title,
      teacherName: e.course.teacher.name,
      progress: e.progress,
      completed: e.completed,
      moduleCount: e.course._count.modules,
    })),
  };
}

/**
 * Get detailed course analytics (teacher only)
 */
export async function getDetailedCourseAnalytics(courseId: string) {
  const user = await requireTeacher();

  const course = await db.course.findFirst({
    where: { id: courseId, teacherId: user.id },
    include: {
      enrollments: {
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      modules: {
        include: {
          quizzes: {
            include: {
              attempts: {
                where: { submittedAt: { not: null } },
              },
            },
          },
          assignments: {
            include: {
              submissions: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  // Calculate quiz statistics
  const quizStats = course.modules.flatMap((m) =>
    m.quizzes.map((q) => {
      const completedAttempts = q.attempts.filter((a) => a.score !== null);
      const averageScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length
        : 0;
      const passRate = completedAttempts.length > 0
        ? (completedAttempts.filter((a) => a.passed).length / completedAttempts.length) * 100
        : 0;

      return {
        quizId: q.id,
        quizTitle: q.title,
        moduleTitle: m.title,
        totalAttempts: q.attempts.length,
        completedAttempts: completedAttempts.length,
        averageScore,
        passRate,
      };
    })
  );

  // Calculate assignment statistics
  const assignmentStats = course.modules.flatMap((m) =>
    m.assignments.map((a) => {
      const gradedSubmissions = a.submissions.filter((s) => s.status === "GRADED");
      const averageGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
        : 0;

      return {
        assignmentId: a.id,
        assignmentTitle: a.title,
        moduleTitle: m.title,
        totalSubmissions: a.submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        pendingSubmissions: a.submissions.filter((s) => s.status !== "GRADED").length,
        averageGrade,
        deadline: a.deadline,
      };
    })
  );

  // Student progress breakdown
  const studentProgress = course.enrollments.map((e) => ({
    studentId: e.student.id,
    studentName: e.student.name,
    studentEmail: e.student.email,
    progress: e.progress,
    completed: e.completed,
    enrolledAt: e.enrolledAt,
  }));

  return {
    courseId: course.id,
    courseTitle: course.title,
    totalStudents: course.enrollments.length,
    averageProgress: course.enrollments.length > 0
      ? course.enrollments.reduce((sum, e) => sum + e.progress, 0) / course.enrollments.length
      : 0,
    completionRate: course.enrollments.length > 0
      ? (course.enrollments.filter((e) => e.completed).length / course.enrollments.length) * 100
      : 0,
    quizStats,
    assignmentStats,
    studentProgress,
  };
}
