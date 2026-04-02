"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.message },
    ]);

    setLoading(false);
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl hover:bg-blue-700 transition-colors"
        aria-label="Expand chatbot"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l-3-3-3 3m0 4l3 3 3-3" />
        </svg>
        <span className="text-sm font-medium">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white shadow-xl rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-500 px-4 py-2">
        <span className="text-white font-semibold text-sm">AI Assistant</span>
        <button
          onClick={() => setMinimized((prev) => !prev)}
          className="text-white hover:text-blue-200 transition-colors"
          aria-label={minimized ? "Expand chatbot" : "Minimize chatbot"}
        >
          {minimized ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      <div className="p-4">
        <div className="h-80 overflow-y-auto mb-3">
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-8">Ask me anything!</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className="mb-2">
              <b>{m.role === "user" ? "You" : "AI"}:</b> {m.content}
            </div>
          ))}
          {loading && <p className="text-gray-400 text-sm">AI is thinking...</p>}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={input}
            placeholder="Type a message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-500 text-white px-3 rounded text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
