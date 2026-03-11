// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("? Seeding database...");

  // Create a teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@example.com" },
    update: {},
    create: {
      name: "John Teacher",
      email: "teacher@example.com",
      role: Role.TEACHER,
      emailVerified: true,
    },
  });

  // Create students
  const student1 = await prisma.user.upsert({
    where: { email: "student1@example.com" },
    update: {},
    create: {
      name: "Alice Student",
      email: "student1@example.com",
      role: Role.STUDENT,
      emailVerified: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student2@example.com" },
    update: {},
    create: {
      name: "Bob Student",
      email: "student2@example.com",
      role: Role.STUDENT,
      emailVerified: true,
    },
  });

  // Create a course
  const course = await prisma.course.upsert({
    where: { id: "seed-course-1" },
    update: {},
    create: {
      id: "seed-course-1",
      title: "Introduction to Web Development",
      description:
        "Learn the fundamentals of web development including HTML, CSS, and JavaScript.",
      published: true,
      teacherId: teacher.id,
    },
  });

  // Create modules
  const module1 = await prisma.module.upsert({
    where: { id: "seed-module-1" },
    update: {},
    create: {
      id: "seed-module-1",
      title: "Getting Started with HTML",
      description: "Learn the basics of HTML structure and elements.",
      order: 1,
      courseId: course.id,
    },
  });

  const module2 = await prisma.module.upsert({
    where: { id: "seed-module-2" },
    update: {},
    create: {
      id: "seed-module-2",
      title: "Styling with CSS",
      description: "Master CSS for beautiful web designs.",
      order: 2,
      courseId: course.id,
    },
  });

  // Create content
  await prisma.content.upsert({
    where: { id: "seed-content-1" },
    update: {},
    create: {
      id: "seed-content-1",
      title: "HTML Basics Video",
      type: "VIDEO",
      linkUrl: "https://www.youtube.com/watch?v=example",
      duration: 30,
      order: 1,
      moduleId: module1.id,
    },
  });

  // Create a quiz
  const quiz = await prisma.quiz.upsert({
    where: { id: "seed-quiz-1" },
    update: {},
    create: {
      id: "seed-quiz-1",
      title: "HTML Fundamentals Quiz",
      description: "Test your knowledge of HTML basics.",
      timeLimit: 15,
      passingScore: 70,
      moduleId: module1.id,
    },
  });

  // Create questions
  await prisma.question.upsert({
    where: { id: "seed-question-1" },
    update: {},
    create: {
      id: "seed-question-1",
      text: "What does HTML stand for?",
      type: "MULTIPLE_CHOICE",
      options: JSON.stringify([
        { id: "a", text: "Hyper Text Markup Language", isCorrect: true },
        { id: "b", text: "High Tech Modern Language", isCorrect: false },
        { id: "c", text: "Home Tool Markup Language", isCorrect: false },
        { id: "d", text: "Hyperlinks Text Mark Language", isCorrect: false },
      ]),
      points: 1,
      order: 1,
      quizId: quiz.id,
    },
  });

  await prisma.question.upsert({
    where: { id: "seed-question-2" },
    update: {},
    create: {
      id: "seed-question-2",
      text: "Which tag is used for the largest heading?",
      type: "MULTIPLE_CHOICE",
      options: JSON.stringify([
        { id: "a", text: "<h6>", isCorrect: false },
        { id: "b", text: "<heading>", isCorrect: false },
        { id: "c", text: "<h1>", isCorrect: true },
        { id: "d", text: "<head>", isCorrect: false },
      ]),
      points: 1,
      order: 2,
      quizId: quiz.id,
    },
  });

  // Create an assignment
  await prisma.assignment.upsert({
    where: { id: "seed-assignment-1" },
    update: {},
    create: {
      id: "seed-assignment-1",
      title: "Create Your First HTML Page",
      description: "Build a simple HTML page with proper structure.",
      instructions:
        "Create an HTML page that includes a heading, paragraph, image, and a list.",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      maxScore: 100,
      moduleId: module1.id,
    },
  });

  // Create enrollments
  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: student1.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      courseId: course.id,
      progress: 25,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: student2.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      studentId: student2.id,
      courseId: course.id,
      progress: 0,
    },
  });

  console.log("? Database seeded successfully!");
  console.log({
    teacher: teacher.email,
    students: [student1.email, student2.email],
    course: course.title,
  });
}

main()
  .catch((e) => {
    console.error("? Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
