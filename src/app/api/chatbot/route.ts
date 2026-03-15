import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages,
      }),
    });

    const body = await resp.json();

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