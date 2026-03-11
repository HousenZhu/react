// src/lib/auth-server.ts
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { Role } from "@prisma/client";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getCurrentUser() {
  const session = await getServerSession();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireTeacher() {
  const user = await requireAuth();
  if (user.role !== Role.TEACHER) {
    throw new Error("Forbidden: Teacher access required");
  }
  return user;
}

export async function requireStudent() {
  const user = await requireAuth();
  if (user.role !== Role.STUDENT) {
    throw new Error("Forbidden: Student access required");
  }
  return user;
}

export async function isTeacher() {
  const user = await getCurrentUser();
  return user?.role === Role.TEACHER;
}

export async function isStudent() {
  const user = await getCurrentUser();
  return user?.role === Role.STUDENT;
}
