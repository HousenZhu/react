"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

interface TeacherStudent {
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher/students");
        const data = await res.json();
        setStudents(data.students || []);
      } catch {
        setStudents([]);
      }
      setLoading(false);
    }
    fetchStudents();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Students</h1>
      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <p>No students enrolled in your courses yet.</p>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <Card key={student.studentId + student.courseId}>
              <CardHeader>
                <CardTitle>{student.studentName || "Unnamed Student"}</CardTitle>
                <Badge>{student.studentEmail}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Course: {student.courseTitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
