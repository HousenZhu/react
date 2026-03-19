"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createContent } from "@/actions/content";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Alert,
  AlertDescription,
} from "@/components/ui";

interface CreateContentPageProps {
  params: { courseId: string; moduleId: string };
}

type ContentType = "PDF" | "VIDEO" | "LINK" | "IMAGE";

export default function CreateContentPage({ params }: CreateContentPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("PDF");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let uploadedUrl = fileUrl;
    if (file && type !== "LINK") {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "contents");
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          uploadedUrl = data.url;
          setFileUrl(data.url);
        } else {
          throw new Error(data.error || "Upload failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file.");
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);
    }

    try {
      await createContent({
        moduleId: params.moduleId,
        title,
        type,
        fileUrl: type !== "LINK" ? uploadedUrl || undefined : undefined,
        linkUrl: type === "LINK" ? linkUrl || undefined : undefined,
        duration: type === "VIDEO" && duration ? parseInt(duration) : undefined,
      });
      router.push(`/dashboard/courses/${params.courseId}/modules/${params.moduleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create content. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}`}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Module
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add Content</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Content Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction Video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                required
              >
                <option value="PDF">PDF</option>
                <option value="VIDEO">Video</option>
                <option value="IMAGE">Image</option>
                <option value="LINK">External Link</option>
              </select>
            </div>
            {type !== "LINK" ? (
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,video/*"
                  onChange={e => {
                    setFile(e.target.files?.[0] || null);
                  }}
                />
                {fileUrl && (
                  <div className="mt-2">
                    <Label htmlFor="fileUrl">File URL</Label>
                    <Input
                      id="fileUrl"
                      type="url"
                      value={fileUrl}
                      onChange={e => setFileUrl(e.target.value)}
                      readOnly
                    />
                  </div>
                )}
                {uploading && <p className="text-xs text-blue-500">Uploading file...</p>}
                <p className="text-xs text-gray-500">
                  Select a file to upload. The file will be stored in AWS S3 and its URL will be used for content.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="linkUrl">External URL</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  placeholder="https://storage.example.com/file.pdf"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Paste the external file or resource URL here.
                </p>
              </div>
            )}
            {type === "VIDEO" && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="e.g., 15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href={`/dashboard/courses/${params.courseId}/modules/${params.moduleId}`}>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Adding..." : "Add Content"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
