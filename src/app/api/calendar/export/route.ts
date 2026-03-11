// src/app/api/calendar/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { generateIcsCalendar } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    // Get user's enrolled courses
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: session.user.id,
        ...(courseId ? { courseId } : {}),
      },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    if (courseIds.length === 0) {
      return new NextResponse("No enrolled courses found", { status: 404 });
    }

    // Get all assignments from enrolled courses
    const assignments = await db.assignment.findMany({
      where: {
        module: {
          courseId: { in: courseIds },
        },
        deadline: { gte: new Date() }, // Only future deadlines
      },
      include: {
        module: {
          include: {
            course: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { deadline: "asc" },
    });

    // Convert to calendar events
    const deadlines = assignments.map((a) => ({
      title: a.title,
      description: a.description || undefined,
      deadline: a.deadline,
      courseTitle: a.module.course.title,
    }));

    // Generate ICS content
    const icsContent = await generateIcsCalendar(deadlines);

    // Return as downloadable file
    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="deadlines.ics"',
      },
    });
  } catch (error) {
    console.error("Calendar export error:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar" },
      { status: 500 }
    );
  }
}
