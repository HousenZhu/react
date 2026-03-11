// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;
export const POST = async (request: Request) => {
  // Handle empty body gracefully
  try {
    const clonedRequest = request.clone();
    const text = await clonedRequest.text();
    
    // If body is empty for a POST request, return error
    if (!text && request.method === "POST") {
      const url = new URL(request.url);
      // Allow sign-out with empty body
      if (!url.pathname.includes("sign-out")) {
        return new Response(
          JSON.stringify({ error: "Request body is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  } catch {
    // Ignore clone errors, let handler process
  }
  
  return handler.POST(request);
};
