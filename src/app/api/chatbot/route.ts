import { NextRequest, NextResponse } from "next/server";
import { buildUserContext } from "@/lib/ai/context";
import { getServerSession } from "@/lib/auth-server";

const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    const cleanMessages = (messages || []).filter(
      (m: any) =>
        m &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    );

    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userContext = await buildUserContext(session.user.id);

    const systemPrompt = `
      You are a personalized AI learning assistant.

      Here is the user's learning context:
      ${userContext}

      Rules:
      - Adapt explanations to user's level
      - Suggest next steps
      - Warn about deadlines
      - Be concise
      `;

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...cleanMessages,
        ],
      }),
    });

    const body = await resp.json();

    console.log("MESSAGES:", messages);
    console.log("AI RAW RESPONSE:", JSON.stringify(body, null, 2));

    if (!resp.ok) {
      return NextResponse.json(
        { error: body?.error?.message || "DashScope API error" },
        { status: resp.status }
      );
    }

    return NextResponse.json({
      message: body.choices?.[0]?.message?.content || "",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}