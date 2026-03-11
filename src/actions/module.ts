// src/actions/module.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/auth-server";
import {
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  type CreateModuleInput,
  type UpdateModuleInput,
} from "@/lib/validations";

/**
 * Get modules for a course
 */
export async function getCourseModules(courseId: string) {
  const modules = await db.module.findMany({
    where: { courseId },
    include: {
      contents: { orderBy: { order: "asc" } },
      quizzes: true,
      assignments: true,
    },
    orderBy: { order: "asc" },
  });

  return modules;
}

/**
 * Get a single module with all content
 */
export async function getModule(moduleId: string) {
  const module = await db.module.findUnique({
    where: { id: moduleId },
    include: {
      course: {
        select: { id: true, title: true, teacherId: true },
      },
      contents: { orderBy: { order: "asc" } },
      quizzes: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
      assignments: true,
    },
  });

  return module;
}

/**
 * Create a new module
 */
export async function createModule(input: CreateModuleInput) {
  const user = await requireTeacher();

  const validated = createModuleSchema.parse(input);

  // Verify teacher owns the course
  const course = await db.course.findFirst({
    where: { id: validated.courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  // Get the next order number
  const lastModule = await db.module.findFirst({
    where: { courseId: validated.courseId },
    orderBy: { order: "desc" },
  });

  const module = await db.module.create({
    data: {
      ...validated,
      order: validated.order ?? (lastModule ? lastModule.order + 1 : 0),
    },
  });

  revalidatePath(`/dashboard/courses/${validated.courseId}`);

  return module;
}

/**
 * Update a module
 */
export async function updateModule(moduleId: string, input: UpdateModuleInput) {
  const user = await requireTeacher();

  const validated = updateModuleSchema.parse(input);

  // Verify teacher owns the course
  const module = await db.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module || module.course.teacherId !== user.id) {
    throw new Error("Module not found or access denied");
  }

  const updated = await db.module.update({
    where: { id: moduleId },
    data: validated,
  });

  revalidatePath(`/dashboard/courses/${module.courseId}`);

  return updated;
}

/**
 * Delete a module
 */
export async function deleteModule(moduleId: string) {
  const user = await requireTeacher();

  const module = await db.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module || module.course.teacherId !== user.id) {
    throw new Error("Module not found or access denied");
  }

  await db.module.delete({
    where: { id: moduleId },
  });

  // Reorder remaining modules
  const remainingModules = await db.module.findMany({
    where: { courseId: module.courseId },
    orderBy: { order: "asc" },
  });

  await Promise.all(
    remainingModules.map((m, index) =>
      db.module.update({
        where: { id: m.id },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/dashboard/courses/${module.courseId}`);

  return { success: true };
}

/**
 * Reorder modules within a course
 */
export async function reorderModules(input: {
  courseId: string;
  moduleIds: string[];
}) {
  const user = await requireTeacher();

  const validated = reorderModulesSchema.parse(input);

  // Verify teacher owns the course
  const course = await db.course.findFirst({
    where: { id: validated.courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }

  // Update order for each module
  await Promise.all(
    validated.moduleIds.map((moduleId, index) =>
      db.module.update({
        where: { id: moduleId },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/dashboard/courses/${validated.courseId}`);

  return { success: true };
}
