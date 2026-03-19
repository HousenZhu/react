"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";

interface StudentsListClientProps {
  enrollments: { student: { id: string; name: string; email: string } }[];
}

export default function StudentsListClient({ enrollments }: StudentsListClientProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? enrollments : enrollments.slice(0, 5);
  return (
    <div className="space-y-2">
      {displayed.map((enrollment) => (
        <div key={enrollment.student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">{enrollment.student.name}</p>
            <p className="text-sm text-gray-500">{enrollment.student.email}</p>
          </div>
          <Badge variant="secondary">Student</Badge>
        </div>
      ))}
      {enrollments.length > 5 && !showAll && (
        <Button className="w-full mt-2" variant="outline" onClick={() => setShowAll(true)}>
          View all students
        </Button>
      )}
      {enrollments.length > 5 && showAll && (
        <Button className="w-full mt-2" variant="outline" onClick={() => setShowAll(false)}>
          Show less
        </Button>
      )}
    </div>
  );
}