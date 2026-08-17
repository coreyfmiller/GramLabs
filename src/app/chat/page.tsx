"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Nav } from "@/components/Nav";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.message },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-[#0a0a0a] text-white">
      <Nav />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && <EmptyState />}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-lime-400/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-lime-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-white/10 text-white"
                    : "bg-white/[0.03] border border-white/10 text-white/90"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                ) : (
                  <div className="text-[14px] leading-relaxed prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-white/60" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-lime-400/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-lime-400" />
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 text-lime-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-4 md:px-8 py-4 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about gear, build a kit, compare items..."
            rows={1}
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-lime-400/50 transition-colors resize-none max-h-[120px]"
            style={{ minHeight: "48px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-lime-400/20 text-lime-400 hover:bg-lime-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="max-w-3xl mx-auto mt-2 text-[10px] text-white/20 text-center">
          HikeMind AI uses community data from 790+ PCT thru-hikers and a database of 70+ verified gear items.
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-lime-400/10 flex items-center justify-center mb-6">
        <Bot className="w-7 h-7 text-lime-400" />
      </div>
      <h2 className="text-[20px] font-bold text-white mb-2">
        HikeMind Gear Advisor
      </h2>
      <p className="text-[14px] text-white/40 max-w-md mb-8">
        Ask me anything about ultralight gear, pack builds, trail conditions, or budget optimization.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            className="text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-[13px] text-white/60 hover:text-white hover:border-white/20 transition-colors"
            onClick={() => {
              const textarea = document.querySelector("textarea");
              if (textarea) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  "value"
                )?.set;
                nativeInputValueSetter?.call(textarea, prompt);
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                textarea.focus();
              }
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  "Build me a PCT kit under $500",
  "What's the lightest 3-season shelter under $200?",
  "Compare the EE Enigma vs Katabatic Palisade",
  "I need a complete beginner UL setup",
];
