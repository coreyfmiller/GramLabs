"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquarePlus, X } from "lucide-react";

type Field = "weight" | "price" | "url" | "name" | "other";
const SOURCE_REQUIRED: Field[] = ["weight", "price", "name"];

interface GearContext {
  id?: string | number;
  name?: string;
  brand?: string;
  weight?: string;
  price?: string;
  url?: string;
}

/**
 * Reads optional gear context that a gear page can expose via a hidden element:
 *   <div id="gear-context" data-gear-id data-gear-name data-gear-brand
 *        data-gear-weight data-gear-price data-gear-url hidden />
 * Falls back to generic "report" mode when absent.
 */
function readGearContext(): GearContext | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById("gear-context");
  if (!el) return null;
  return {
    id: el.dataset.gearId,
    name: el.dataset.gearName,
    brand: el.dataset.gearBrand,
    weight: el.dataset.gearWeight,
    price: el.dataset.gearPrice,
    url: el.dataset.gearUrl,
  };
}

export default function SuggestEdit() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<GearContext | null>(null);

  const [field, setField] = useState<Field>("other");
  const [suggested, setSuggested] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Refresh gear context whenever the modal opens or the route changes.
  useEffect(() => {
    if (open) {
      const c = readGearContext();
      setCtx(c);
      setField(c?.id ? "weight" : "other");
      setResult(null);
      setSuggested("");
      setSourceUrl("");
      setNote("");
    }
  }, [open, pathname]);

  // Don't show the widget inside the admin area.
  if (pathname?.startsWith("/admin")) return null;

  const currentValue =
    field === "weight" ? ctx?.weight :
    field === "price" ? ctx?.price :
    field === "url" ? ctx?.url :
    field === "name" ? ctx?.name : undefined;

  async function submit() {
    setResult(null);
    if (!suggested.trim()) { setResult({ ok: false, msg: "Enter a suggested value." }); return; }
    if (SOURCE_REQUIRED.includes(field) && !/^https?:\/\//i.test(sourceUrl.trim())) {
      setResult({ ok: false, msg: "A manufacturer/source link (https://…) is required for this change." });
      return;
    }
    if (field === "url" && !/^https?:\/\//i.test(suggested.trim())) {
      setResult({ ok: false, msg: "The suggested URL must start with http(s)://" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gear_id: ctx?.id ?? null,
          gear_name: ctx?.name ?? null,
          gear_brand: ctx?.brand ?? null,
          field,
          current_value: currentValue ?? null,
          suggested_value: suggested.trim(),
          source_url: sourceUrl.trim() || null,
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, msg: "Thanks! Your suggestion was sent for review." });
        setSuggested(""); setSourceUrl(""); setNote("");
      } else {
        setResult({ ok: false, msg: data.error || "Something went wrong." });
      }
    } catch {
      setResult({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg transition hover:opacity-90"
        aria-label="Suggest an edit"
      >
        <MessageSquarePlus size={18} />
        <span className="hidden sm:inline">Suggest an edit</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {ctx?.id ? `Suggest an edit${ctx.name ? `: ${ctx.brand ?? ""} ${ctx.name}`.trim() : ""}` : "Suggest a change / report an issue"}
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="opacity-60 hover:opacity-100"><X size={18} /></button>
            </div>

            {loading ? (
              <p className="text-sm opacity-70">Loading…</p>
            ) : !user ? (
              <div className="space-y-3">
                <p className="text-sm opacity-80">Please sign in to submit a correction — it helps us keep suggestions accountable and high quality.</p>
                <a href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">Sign in</a>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">What are you correcting?</label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value as Field)}
                    className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm"
                  >
                    {ctx?.id && <option value="weight">Weight</option>}
                    {ctx?.id && <option value="price">Price</option>}
                    {ctx?.id && <option value="url">Product link (URL)</option>}
                    {ctx?.id && <option value="name">Name</option>}
                    <option value="other">Something else / report an issue</option>
                  </select>
                </div>

                {currentValue != null && field !== "other" && (
                  <p className="text-xs opacity-60">Currently shown: <span className="font-mono">{currentValue}</span></p>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">
                    {field === "other" ? "Describe the change or issue" :
                     field === "url" ? "Corrected product URL" :
                     field === "weight" ? "Corrected weight (e.g. 620g or 21.9 oz)" :
                     field === "price" ? "Corrected price (USD)" :
                     "Corrected value"}
                  </label>
                  {field === "other" ? (
                    <textarea value={suggested} onChange={(e) => setSuggested(e.target.value)} rows={3}
                      className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm" placeholder="Tell us what's wrong or what you'd change…" />
                  ) : (
                    <input value={suggested} onChange={(e) => setSuggested(e.target.value)}
                      className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm" placeholder="New value" />
                  )}
                </div>

                {SOURCE_REQUIRED.includes(field) && (
                  <div>
                    <label className="mb-1 block text-xs font-medium opacity-70">Manufacturer / source link (required)</label>
                    <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                      className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm" placeholder="https://brand.com/product…" />
                    <p className="mt-1 text-[11px] opacity-55">A link to the official spec keeps corrections trustworthy.</p>
                  </div>
                )}

                {field !== "other" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium opacity-70">Note (optional)</label>
                    <input value={note} onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm" placeholder="Any context…" />
                  </div>
                )}

                {result && (
                  <p className={`text-sm ${result.ok ? "text-green-600" : "text-red-500"}`}>{result.msg}</p>
                )}

                <button onClick={submit} disabled={submitting}
                  className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50">
                  {submitting ? "Submitting…" : "Submit for review"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
