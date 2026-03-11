// src/actions/certificate.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { generateCertificatePdf, generateCertificateNumber } from "@/lib/pdf";
import { uploadFile } from "@/lib/storage";

/**
 * Generate a certificate for course completion
 */
export async function generateCertificate(courseId: string) {
  const user = await requireAuth();

  // Check enrollment and completion
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
    include: {
      course: true,
    },
  });

  if (!enrollment) {
    throw new Error("Not enrolled in this course");
  }

  if (!enrollment.completed && enrollment.progress < 100) {
    throw new Error("Course not completed yet");
  }

  // Check if certificate already exists
  const existingCertificate = await db.certificate.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId,
      },
    },
  });

  if (existingCertificate) {
    return existingCertificate;
  }

  // Generate certificate
  const certificateNumber = generateCertificateNumber();
  const pdfBytes = await generateCertificatePdf({
    studentName: user.name,
    courseName: enrollment.course.title,
    completedAt: new Date(),
    certificateNumber,
  });

  // Upload to storage
  const { url } = await uploadFile(
    Buffer.from(pdfBytes),
    `certificate-${certificateNumber}.pdf`,
    "certificates",
    "application/pdf"
  );

  // Save certificate record
  const certificate = await db.certificate.create({
    data: {
      certificateNumber,
      fileUrl: url,
      courseName: enrollment.course.title,
      studentName: user.name,
      completedAt: new Date(),
      studentId: user.id,
      courseId,
    },
  });

  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/certificates");

  return certificate;
}

/**
 * Get user's certificates
 */
export async function getMyCertificates() {
  const user = await requireAuth();

  const certificates = await db.certificate.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          teacher: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { generatedAt: "desc" },
  });

  return certificates;
}

/**
 * Get a single certificate
 */
export async function getCertificate(certificateId: string) {
  const certificate = await db.certificate.findUnique({
    where: { id: certificateId },
    include: {
      student: {
        select: { id: true, name: true },
      },
      course: {
        select: {
          id: true,
          title: true,
          teacher: {
            select: { name: true },
          },
        },
      },
    },
  });

  return certificate;
}

/**
 * Verify a certificate by its number
 */
export async function verifyCertificate(certificateNumber: string) {
  const certificate = await db.certificate.findUnique({
    where: { certificateNumber },
    include: {
      student: {
        select: { name: true },
      },
      course: {
        select: {
          title: true,
          teacher: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!certificate) {
    return { valid: false, certificate: null };
  }

  return {
    valid: true,
    certificate: {
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      completedAt: certificate.completedAt,
      generatedAt: certificate.generatedAt,
      teacherName: certificate.course.teacher.name,
    },
  };
}
