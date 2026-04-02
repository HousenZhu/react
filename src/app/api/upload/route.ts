// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { uploadFile, validateMimeType, ALLOWED_CONTENT_MIMES } from "@/lib/storage";
import { MAX_FILE_SIZE } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!validateMimeType(file.type, ALLOWED_CONTENT_MIMES)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to storage
    const validFolders = [
      "courses",
      "assignments",
      "submissions",
      "certificates",
      "profiles",
    ] as const;
    
    const uploadFolder = validFolders.includes(folder as typeof validFolders[number])
      ? (folder as typeof validFolders[number])
      : "courses";

    const result = await uploadFile(buffer, file.name, uploadFolder, file.type);

    return NextResponse.json({
      url: result.url,
      key: result.key,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
