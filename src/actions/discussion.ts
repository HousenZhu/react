// src/actions/discussion.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireTeacher } from "@/lib/auth-server";
import {
  createDiscussionPostSchema,
  updateDiscussionPostSchema,
  type CreateDiscussionPostInput,
  type UpdateDiscussionPostInput,
} from "@/lib/validations";
import { Role } from "@prisma/client";

/**
 * Create a discussion post or reply
 */
export async function createDiscussionPost(input: CreateDiscussionPostInput) {
  const user = await requireAuth();

  const validated = createDiscussionPostSchema.parse(input);

  // Check enrollment or teacher access
  const course = await db.course.findUnique({
    where: { id: validated.courseId },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const isTeacher = course.teacherId === user.id;
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: validated.courseId,
      },
    },
  });

  if (!isTeacher && !enrollment) {
    throw new Error("Not enrolled in this course");
  }

  // If it's a reply, verify parent exists
  if (validated.parentId) {
    const parent = await db.discussionPost.findUnique({
      where: { id: validated.parentId },
    });
    if (!parent || parent.courseId !== validated.courseId) {
      throw new Error("Parent post not found");
    }
  }

  const post = await db.discussionPost.create({
    data: {
      title: validated.parentId ? null : validated.title, // Only root posts have titles
      content: validated.content,
      courseId: validated.courseId,
      authorId: user.id,
      parentId: validated.parentId,
    },
    include: {
      author: {
        select: { id: true, name: true, image: true, role: true },
      },
    },
  });

  revalidatePath(`/dashboard/courses/${validated.courseId}/discussion`);

  return post;
}

/**
 * Update a discussion post
 */
export async function updateDiscussionPost(input: UpdateDiscussionPostInput) {
  const user = await requireAuth();

  const validated = updateDiscussionPostSchema.parse(input);

  const post = await db.discussionPost.findUnique({
    where: { id: validated.postId },
    include: { course: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Only author or course teacher can edit
  const isAuthor = post.authorId === user.id;
  const isTeacher = post.course.teacherId === user.id;

  if (!isAuthor && !isTeacher) {
    throw new Error("Cannot edit this post");
  }

  const updated = await db.discussionPost.update({
    where: { id: validated.postId },
    data: { content: validated.content },
  });

  revalidatePath(`/dashboard/courses/${post.courseId}/discussion`);

  return updated;
}

/**
 * Delete a discussion post
 */
export async function deleteDiscussionPost(postId: string) {
  const user = await requireAuth();

  const post = await db.discussionPost.findUnique({
    where: { id: postId },
    include: { course: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Only author or course teacher can delete
  const isAuthor = post.authorId === user.id;
  const isTeacher = post.course.teacherId === user.id;

  if (!isAuthor && !isTeacher) {
    throw new Error("Cannot delete this post");
  }

  await db.discussionPost.delete({
    where: { id: postId },
  });

  revalidatePath(`/dashboard/courses/${post.courseId}/discussion`);

  return { success: true };
}

/**
 * Pin/unpin a discussion post (teacher only)
 */
export async function togglePostPin(postId: string) {
  const user = await requireTeacher();

  const post = await db.discussionPost.findUnique({
    where: { id: postId },
    include: { course: true },
  });

  if (!post || post.course.teacherId !== user.id) {
    throw new Error("Post not found or access denied");
  }

  const updated = await db.discussionPost.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
  });

  revalidatePath(`/dashboard/courses/${post.courseId}/discussion`);

  return updated;
}

/**
 * Get discussion posts for a course
 */
export async function getCourseDiscussions(
  courseId: string,
  options?: {
    page?: number;
    limit?: number;
  }
) {
  const user = await requireAuth();

  // Check access
  const course = await db.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const isTeacher = course.teacherId === user.id;
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
  });

  if (!isTeacher && !enrollment) {
    throw new Error("Access denied");
  }

  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  // Get root posts only (threads)
  const [posts, total] = await Promise.all([
    db.discussionPost.findMany({
      where: {
        courseId,
        parentId: null, // Root posts only
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
    }),
    db.discussionPost.count({
      where: { courseId, parentId: null },
    }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single discussion thread with replies
 */
export async function getDiscussionThread(postId: string) {
  const user = await requireAuth();

  const post = await db.discussionPost.findUnique({
    where: { id: postId },
    include: {
      course: true,
      author: {
        select: { id: true, name: true, image: true, role: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, name: true, image: true, role: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Check access
  const isTeacher = post.course.teacherId === user.id;
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: post.courseId,
      },
    },
  });

  if (!isTeacher && !enrollment) {
    throw new Error("Access denied");
  }

  return post;
}
