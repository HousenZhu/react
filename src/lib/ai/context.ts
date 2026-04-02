import { db } from "@/lib/db";

export async function buildUserContext(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
      quizAttempts: {
        include: {
          quiz: true,
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      },
      submissions: {
        include: {
          assignment: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return "No user context available.";

  // ======================
  // 🎓 Courses
  // ======================
  const courses = user.enrollments.map((e) => {
    return `- ${e.course.title} (Progress: ${e.progress}%)`;
  });

  // ======================
  // 🧪 Quiz performance
  // ======================
  const quizzes = user.quizAttempts.map((q) => {
    return `- ${q.quiz.title}: ${q.score ?? "N/A"}% ${
      q.passed ? "(Passed)" : "(Failed)"
    }`;
  });

  // ======================
  // 📝 Assignments
  // ======================
  const assignments = user.submissions.map((s) => {
    return `- ${s.assignment.title}: ${
      s.grade !== null ? `Grade ${s.grade}` : "Not graded"
    } (${s.status})`;
  });

  // ======================
  // ⏰ Upcoming deadlines
  // ======================
  const upcomingAssignments = await db.assignment.findMany({
    where: {
      deadline: {
        gte: new Date(),
      },
    },
    take: 3,
    orderBy: { deadline: "asc" },
  });

  const deadlines = upcomingAssignments.map((a) => {
    return `- ${a.title} (Due: ${a.deadline.toDateString()})`;
  });

  // ======================
  // 🧠 Simple insights
  // ======================
  let insights: string[] = [];

  const avgScore =
    user.quizAttempts.reduce((acc, q) => acc + (q.score || 0), 0) /
    (user.quizAttempts.length || 1);

  if (avgScore < 60) {
    insights.push("User is struggling with quizzes.");
  }

  const incompleteCourses = user.enrollments.filter(
    (e) => e.progress < 50
  );
  if (incompleteCourses.length > 0) {
    insights.push("User has low progress in some courses.");
  }

  if (deadlines.length > 0) {
    insights.push("User has upcoming deadlines.");
  }

  // ======================
  // 📦 Final context string
  // ======================
  return `
User: ${user.name} (${user.role})

Enrolled Courses:
${courses.join("\n") || "None"}

Recent Quiz Performance:
${quizzes.join("\n") || "No quiz attempts"}

Recent Assignments:
${assignments.join("\n") || "No submissions"}

Upcoming Deadlines:
${deadlines.join("\n") || "None"}

Insights:
${insights.join("\n") || "No strong signals"}
`;
}