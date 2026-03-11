// src/actions/content.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/auth-server";
import {
  createContentSchema,
  updateContentSchema,
  type CreateContentInput,
  type UpdateContentInput,
} from "@/lib/validations";

/**
 * Create new content in a module
 */
export async function createContent(input: CreateContentInput) {
  const user = await requireTeacher();

  const validated = createContentSchema.parse(input);

  // Verify teacher owns the course
  const module = await db.module.findUnique({
    where: { id: validated.moduleId },
    include: { course: true },
  });

  if (!module || module.course.teacherId !== user.id) {
    throw new Error("Module not found or access denied");
  }

  // Get next order
  const lastContent = await db.content.findFirst({
    where: { moduleId: validated.moduleId },
    orderBy: { order: "desc" },
  });

  const content = await db.content.create({
    data: {
      ...validated,
      order: validated.order ?? (lastContent ? lastContent.order + 1 : 0),
    },
  });

  revalidatePath(`/dashboard/courses/${module.courseId}`);

  return content;
}

/**
 * Update content
 */
export async function updateContent(
  contentId: string,
  input: UpdateContentInput
) {
  const user = await requireTeacher();

  const validated = updateContentSchema.parse(input);

  const content = await db.content.findUnique({
    where: { id: contentId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!content || content.module.course.teacherId !== user.id) {
    throw new Error("Content not found or access denied");
  }

  const updated = await db.content.update({
    where: { id: contentId },
    data: validated,
  });

  revalidatePath(`/dashboard/courses/${content.module.courseId}`);

  return updated;
}

/**
 * Delete content
 */
export async function deleteContent(contentId: string) {
  const user = await requireTeacher();

  const content = await db.content.findUnique({
    where: { id: contentId },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!content || content.module.course.teacherId !== user.id) {
    throw new Error("Content not found or access denied");
  }

  await db.content.delete({
    where: { id: contentId },
  });

  // Reorder remaining content
  const remainingContent = await db.content.findMany({
    where: { moduleId: content.moduleId },
    orderBy: { order: "asc" },
  });

  await Promise.all(
    remainingContent.map((c, index) =>
      db.content.update({
        where: { id: c.id },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/dashboard/courses/${content.module.courseId}`);

  return { success: true };
}

/**
 * Reorder content within a module
 */
export async function reorderContent(moduleId: string, contentIds: string[]) {
  const user = await requireTeacher();

  const module = await db.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module || module.course.teacherId !== user.id) {
    throw new Error("Module not found or access denied");
  }

  await Promise.all(
    contentIds.map((contentId, index) =>
      db.content.update({
        where: { id: contentId },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/dashboard/courses/${module.courseId}`);

  return { success: true };
}
