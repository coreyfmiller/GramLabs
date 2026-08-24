"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Plus, ShoppingCart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Nav } from "@/components/Nav";
import { usePackStore } from "@/store/pack-store";
import { gearDatabase } from "@/data/gear-database";
import { cn } from "@/lib/utils";
import { LimitReached, parseLimitError } from "@/components/limit-reached";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      if (data.limitReached) {
        const limitInfo = parseLimitError(data);
        if (limitInfo) {
          setMessages([...newMessages, { role: "assistant", content: `__LIMIT_REACHED__${JSON.stringify(limitInfo)}` }]);
        } else {
          setMessages([...newMessages, { role: "assistant", content: `Error: ${data.error}` }]);
        }
      } else if (data.error) {
        setMessages([...newMessages, { role: "assistant", content: `Error: ${data.error}` }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
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

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-dvh flex flex-col bg-background text-foreground">
      <Nav />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {messages.length === 0 && <EmptyState onPromptClick={handlePromptClick} />}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="size-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[88%] md:max-w-[78%] rounded-xl px-4 py-3",
                  msg.role === "user"
                    ? "glass border border-white/10"
                    : "bg-transparent"
                )}
              >
                {msg.role === "user" ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : msg.content.startsWith("__LIMIT_REACHED__") ? (
                  (() => {
                    const info = JSON.parse(msg.content.replace("__LIMIT_REACHED__", ""));
                    return <LimitReached feature={info.feature} limit={info.limit} tier={info.tier} />;
                  })()
                ) : (
                  <ChatResponse content={msg.content} />
                )}
              </div>
              {msg.role === "user" && (
                <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="size-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="glass rounded-xl border border-white/10 px-4 py-3">
                <Loader2 className="size-4 text-primary animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 md:px-6 py-4 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about gear, build a kit, compare items..."
            rows={1}
            className="flex-1 bg-white/[0.03] border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/60 transition-colors resize-none max-h-[120px]"
            style={{ minHeight: "48px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-95"
          >
            <Send className="size-4" />
          </button>
        </form>
        <p className="max-w-3xl mx-auto mt-2 text-xs text-muted-foreground/50 text-center">
          Powered by 1500+ verified gear items and PCT thru-hiker survey data
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Sparkles className="size-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Gear Advisor</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-10">
        Get personalized gear recommendations, kit builds, and comparisons backed by real trail data.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onPromptClick(prompt)}
            className="glass text-left px-4 py-3 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  "Build me a complete 3-season kit for $500",
  "What's the best budget shelter under $150?",
  "I have $300 total — what can I actually get?",
  "Compare budget vs premium quilt options",
];

interface GearCard {
  category: string;
  brand: string;
  name: string;
  weight: string;
  price: string;
  reason: string;
}

function ChatResponse({ content }: { content: string }) {
  const gearRegex = /```gear\s*\n([\s\S]*?)```/g;
  const jsonRegex = /```json\s*\n([\s\S]*?)```/g;
  const addItem = usePackStore((s) => s.addItem);
  const addToBuyList = usePackStore((s) => s.addToBuyList);

  let gearItems: GearCard[] = [];
  let textContent = content;

  // Try ```gear format
  let match = gearRegex.exec(content);
  if (match) {
    try {
      gearItems = JSON.parse(match[1]);
      textContent = content.slice(0, match.index).trim() + "\n" + content.slice(match.index + match[0].length).trim();
    } catch { /* ignore */ }
  }

  // Try ```json fallback
  if (gearItems.length === 0) {
    match = jsonRegex.exec(content);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed[0]?.brand && parsed[0]?.name) {
          gearItems = parsed;
          textContent = content.slice(0, match.index).trim() + "\n" + content.slice(match.index + match[0].length).trim();
        }
      } catch { /* ignore */ }
    }
  }

  // Clean remaining code fences
  textContent = textContent.replace(/```[\s\S]*?```/g, "").trim();

  const handleAddToPack = (item: GearCard) => {
    // Try to find the item in our database
    const dbItem = gearDatabase.find(
      (g) => g.brand.toLowerCase() === item.brand.toLowerCase() && g.name.toLowerCase() === item.name.toLowerCase()
    );
    if (dbItem) {
      addItem(dbItem);
    } else {
      // Create a custom item from the card data
      const weightOz = parseFloat(item.weight) || 0;
      const priceUsd = parseFloat(item.price.replace("$", "")) || 0;
      addItem({
        id: `advisor-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: item.name,
        brand: item.brand,
        category: "accessories",
        tier: "mid",
        weightOz,
        priceUsd,
        description: item.reason,
      });
    }
  };

  const handleAddToBuyList = (item: GearCard) => {
    const dbItem = gearDatabase.find(
      (g) => g.brand.toLowerCase() === item.brand.toLowerCase() && g.name.toLowerCase() === item.name.toLowerCase()
    );
    if (dbItem) {
      addToBuyList(dbItem);
    } else {
      const weightOz = parseFloat(item.weight) || 0;
      const priceUsd = parseFloat(item.price.replace("$", "")) || 0;
      addToBuyList({
        id: `advisor-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: item.name,
        brand: item.brand,
        category: "accessories",
        tier: "mid",
        weightOz,
        priceUsd,
        description: item.reason,
      });
    }
  };

  return (
    <div className="text-sm leading-relaxed space-y-4">
      {textContent && (
        <div className="prose-invert">
          <ReactMarkdown>{textContent}</ReactMarkdown>
        </div>
      )}
      {gearItems.length > 0 && (
        <div className="space-y-4 mt-2">
          {Object.entries(
            gearItems.reduce<Record<string, GearCard[]>>((groups, item) => {
              const cat = item.category || "Other";
              if (!groups[cat]) groups[cat] = [];
              groups[cat].push(item);
              return groups;
            }, {})
          ).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary mb-2">
                {category}
              </p>
              <div className="space-y-1.5">
                {items.map((item, j) => (
                  <div
                    key={j}
                    className="glass flex items-start gap-3 rounded-lg border border-white/10 p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.brand} {item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2">
                        <p className="num text-sm font-medium text-primary">{item.weight}</p>
                        <p className="num text-xs text-muted-foreground">{item.price}</p>
                      </div>
                      <button
                        onClick={() => handleAddToPack(item)}
                        title="Add to Pack Lab"
                        className="size-7 flex items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-muted-foreground hover:border-primary/50 hover:bg-primary hover:text-primary-foreground transition-colors active:scale-95"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleAddToBuyList(item)}
                        title="Save to Buy List"
                        className="size-7 flex items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-muted-foreground hover:border-yellow-500/50 hover:bg-yellow-500 hover:text-black transition-colors active:scale-95"
                      >
                        <ShoppingCart className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
