// src/lib/pdf.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface CertificateData {
  studentName: string;
  courseName: string;
  completedAt: Date;
  certificateNumber: string;
}

/**
 * Generate a course completion certificate PDF
 */
export async function generateCertificatePdf(
  data: CertificateData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Create a landscape A4 page
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  // Load fonts
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Colors
  const primaryColor = rgb(0.1, 0.3, 0.6); // Dark blue
  const goldColor = rgb(0.72, 0.53, 0.04); // Gold
  const textColor = rgb(0.2, 0.2, 0.2); // Dark gray

  // Draw border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: goldColor,
    borderWidth: 3,
  });

  // Draw inner border
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: primaryColor,
    borderWidth: 1,
  });

  // Title
  const title = "Certificate of Completion";
  const titleFontSize = 36;
  const titleWidth = timesRomanBoldFont.widthOfTextAtSize(title, titleFontSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 120,
    size: titleFontSize,
    font: timesRomanBoldFont,
    color: primaryColor,
  });

  // Subtitle
  const subtitle = "This is to certify that";
  const subtitleFontSize = 16;
  const subtitleWidth = timesRomanFont.widthOfTextAtSize(subtitle, subtitleFontSize);
  page.drawText(subtitle, {
    x: (width - subtitleWidth) / 2,
    y: height - 180,
    size: subtitleFontSize,
    font: timesRomanFont,
    color: textColor,
  });

  // Student name
  const nameFontSize = 32;
  const nameWidth = timesRomanBoldFont.widthOfTextAtSize(
    data.studentName,
    nameFontSize
  );
  page.drawText(data.studentName, {
    x: (width - nameWidth) / 2,
    y: height - 230,
    size: nameFontSize,
    font: timesRomanBoldFont,
    color: goldColor,
  });

  // Achievement text
  const achievementText = "has successfully completed the course";
  const achievementFontSize = 16;
  const achievementWidth = timesRomanFont.widthOfTextAtSize(
    achievementText,
    achievementFontSize
  );
  page.drawText(achievementText, {
    x: (width - achievementWidth) / 2,
    y: height - 280,
    size: achievementFontSize,
    font: timesRomanFont,
    color: textColor,
  });

  // Course name
  const courseNameFontSize = 28;
  const courseNameWidth = timesRomanBoldFont.widthOfTextAtSize(
    data.courseName,
    courseNameFontSize
  );
  page.drawText(data.courseName, {
    x: (width - courseNameWidth) / 2,
    y: height - 330,
    size: courseNameFontSize,
    font: timesRomanBoldFont,
    color: primaryColor,
  });

  // Date
  const dateText = `Completed on ${data.completedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;
  const dateFontSize = 14;
  const dateWidth = helveticaFont.widthOfTextAtSize(dateText, dateFontSize);
  page.drawText(dateText, {
    x: (width - dateWidth) / 2,
    y: height - 400,
    size: dateFontSize,
    font: helveticaFont,
    color: textColor,
  });

  // Certificate number
  const certNumText = `Certificate No: ${data.certificateNumber}`;
  const certNumFontSize = 10;
  const certNumWidth = helveticaFont.widthOfTextAtSize(
    certNumText,
    certNumFontSize
  );
  page.drawText(certNumText, {
    x: (width - certNumWidth) / 2,
    y: 60,
    size: certNumFontSize,
    font: helveticaFont,
    color: textColor,
  });

  // Decorative lines
  page.drawLine({
    start: { x: 200, y: height - 250 },
    end: { x: width - 200, y: height - 250 },
    thickness: 1,
    color: goldColor,
  });

  page.drawLine({
    start: { x: 200, y: height - 350 },
    end: { x: width - 200, y: height - 350 },
    thickness: 1,
    color: goldColor,
  });

  // Save and return the PDF bytes
  return pdfDoc.save();
}

/**
 * Generate a unique certificate number
 */
export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}
