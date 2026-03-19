"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface StudentCourse {
  id: string;
  title: string;
  description: string;
  instructor: { name: string };
}

export default function StudentPage() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch enrolled courses for the student
    async function fetchCourses() {
      setLoading(true);
      try {
        const res = await fetch("/api/student/courses");
        const data = await res.json();
        setCourses(data.courses || []);
      } catch {
        setCourses([]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Courses</h1>
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p>You are not enrolled in any courses yet.</p>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-gray-700">{course.description}</p>
                <p className="text-sm text-gray-500 mb-2">Instructor: {course.instructor?.name || "Unknown"}</p>
                <Link href={`/dashboard/courses/${course.id}`}>
                  <Button>Go to Course</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
