"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/hooks/use-auth";
import { addToCloset } from "@/lib/closet-api";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  Link,
  Loader2,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  Package,
  ArrowRight,
} from "lucide-react";

interface MatchedItem {
  parsed: { name: string; brand?: string; category?: string; weightOz: number; price?: number };
  match: { id: string; name: string; brand: string; category: string; weightOz: number } | null;
  confidence: "high" | "medium" | "low" | "none";
  // UI state
  accepted: boolean;
  useMatch: boolean; // true = link to DB item, false = add as custom
}

type Step = "input" | "matching" | "review" | "importing" | "done";

export default function ImportPage() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<"csv" | "url" | "text">("csv");
  const [inputText, setInputText] = useState("");
  const [items, setItems] = useState<MatchedItem[]>([]);
  const [error, setError] = useState("");
  const [importStats, setImportStats] = useState({ added: 0, total: 0 });

  async function handleSubmit() {
    if (!inputText.trim()) return;
    setError("");
    setStep("matching");

    try {
      const format =
        inputMode === "url" ? "lighterpack-url" : inputMode === "csv" ? "csv" : "text";

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, format }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Import failed");
        setStep("input");
        return;
      }

      const data = await res.json();
      const matched: MatchedItem[] = data.items.map(
        (item: { parsed: MatchedItem["parsed"]; match: MatchedItem["match"]; confidence: MatchedItem["confidence"] }) => ({
          ...item,
          accepted: item.confidence !== "none",
          useMatch: item.confidence === "high" || item.confidence === "medium",
        })
      );

      setItems(matched);
      setStep("review");
    } catch {
      setError("Something went wrong. Try again.");
      setStep("input");
    }
  }

  async function handleImport() {
    setStep("importing");
    const toImport = items.filter((i) => i.accepted);
    let added = 0;

    for (const item of toImport) {
      let result;
      if (item.useMatch && item.match) {
        result = await addToCloset({ gearItemId: item.match.id });
      } else {
        result = await addToCloset({
          customName: item.parsed.name,
          customBrand: item.parsed.brand || undefined,
          customWeightOz: item.parsed.weightOz,
          customCategory: item.parsed.category || "accessories",
        });
      }
      if (result) added++;
    }

    setImportStats({ added, total: toImport.length });
    setStep("done");
  }

  function toggleItem(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, accepted: !item.accepted } : item
      )
    );
  }

  function toggleUseMatch(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, useMatch: !item.useMatch } : item
      )
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="size-6 text-primary" />
            Import Gear
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bring your gear list from LighterPack, a CSV file, or paste it as text.
            We&apos;ll match items to our database automatically.
          </p>
        </div>

        {/* Step: Input */}
        {step === "input" && (
          <div className="space-y-6">
            {/* Format Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setInputMode("url")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  inputMode === "url"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <Link className="size-4" />
                LighterPack URL
              </button>
              <button
                onClick={() => setInputMode("csv")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  inputMode === "csv"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <FileText className="size-4" />
                CSV / Spreadsheet
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  inputMode === "text"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <FileText className="size-4" />
                Paste Text
              </button>
            </div>

            {/* Input Area */}
            <div>
              {inputMode === "url" ? (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Paste your LighterPack share URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://lighterpack.com/r/abc123"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    {inputMode === "csv"
                      ? "Paste your CSV data (exported from LighterPack, PackWizard, or any spreadsheet)"
                      : "Paste your gear list as plain text (we'll detect items and weights)"}
                  </label>
                  <textarea
                    placeholder={
                      inputMode === "csv"
                        ? "name,category,weight,unit\nNemo Tensor Wide,Sleep,15,oz\nZpacks Duplex,Shelter,21,oz"
                        : "Nemo Tensor Wide - 15oz\nZpacks Duplex - 21oz\nToaks 750ml pot 3.3oz"
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-y"
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="size-4" />
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!inputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-foreground text-sm font-medium hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="size-4" />
              Parse &amp; Match
            </button>

            {/* Help text */}
            <div className="p-4 rounded-lg border border-border bg-card/30">
              <h3 className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-2">
                <HelpCircle className="size-3.5" />
                Supported formats
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong className="text-muted-foreground">LighterPack URL:</strong> Any lighterpack.com/r/... share link</li>
                <li>• <strong className="text-muted-foreground">CSV:</strong> LighterPack export, PackWizard export, or any spreadsheet with name + weight columns</li>
                <li>• <strong className="text-muted-foreground">Plain text:</strong> Just paste your list — we&apos;ll detect item names and weights (e.g. &quot;Nemo Tensor 15oz&quot;)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: Matching (loading) */}
        {step === "matching" && (
          <div className="text-center py-16">
            <Loader2 className="size-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground font-medium">Parsing and matching your gear...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Searching our database of 1,500+ items
            </p>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {items.length} items parsed
                </p>
                <p className="text-xs text-muted-foreground">
                  {items.filter((i) => i.confidence === "high").length} high-confidence matches ·{" "}
                  {items.filter((i) => i.confidence === "medium").length} needs review ·{" "}
                  {items.filter((i) => i.confidence === "none").length} no match (will add as custom)
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={items.filter((i) => i.accepted).length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-foreground text-sm font-medium hover:brightness-110 transition-colors disabled:opacity-50"
              >
                <Package className="size-4" />
                Import {items.filter((i) => i.accepted).length} items
              </button>
            </div>

            {/* Items list */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    item.accepted
                      ? "border-border bg-card/50"
                      : "border-border/50 bg-card/20 opacity-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Parsed item */}
                      <div className="flex items-center gap-2">
                        <ConfidenceBadge confidence={item.confidence} />
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.parsed.name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {item.parsed.weightOz.toFixed(1)} oz
                        </span>
                      </div>

                      {/* Match info */}
                      {item.match && item.useMatch ? (
                        <p className="text-xs text-primary/80 mt-1 ml-6 truncate">
                          → {item.match.brand} {item.match.name} ({item.match.weightOz.toFixed(1)} oz)
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          → Will add as custom item
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle linked vs custom */}
                      {item.match && item.accepted && (
                        <button
                          onClick={() => toggleUseMatch(index)}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded border transition-colors",
                            item.useMatch
                              ? "border-primary/30 text-primary bg-primary/10"
                              : "border-border text-muted-foreground"
                          )}
                        >
                          {item.useMatch ? "Linked" : "Custom"}
                        </button>
                      )}

                      {/* Accept/reject */}
                      <button
                        onClick={() => toggleItem(index)}
                        className={cn(
                          "size-7 flex items-center justify-center rounded-md border transition-colors",
                          item.accepted
                            ? "border-emerald-500/30 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {item.accepted ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep("input")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Start over
            </button>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="text-center py-16">
            <Loader2 className="size-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground font-medium">Adding gear to your closet...</p>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center py-16">
            <Check className="size-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Import complete</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Added {importStats.added} of {importStats.total} items to your gear closet.
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/closet"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-foreground text-sm font-medium hover:brightness-110 transition-colors"
              >
                <Package className="size-4" />
                View Closet
              </a>
              <button
                onClick={() => {
                  setStep("input");
                  setInputText("");
                  setItems([]);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-card transition-colors"
              >
                Import More
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  switch (confidence) {
    case "high":
      return (
        <span className="size-5 flex items-center justify-center rounded-full bg-primary/10">
          <Check className="size-3 text-primary" />
        </span>
      );
    case "medium":
      return (
        <span className="size-5 flex items-center justify-center rounded-full bg-amber-500/10">
          <HelpCircle className="size-3 text-amber-400" />
        </span>
      );
    case "low":
      return (
        <span className="size-5 flex items-center justify-center rounded-full bg-orange-500/10">
          <AlertTriangle className="size-3 text-orange-400" />
        </span>
      );
    default:
      return (
        <span className="size-5 flex items-center justify-center rounded-full bg-card">
          <X className="size-3 text-muted-foreground" />
        </span>
      );
  }
}
