"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, ExternalLink, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/hooks/use-auth";

const ADMIN_EMAIL = "coreyfmiller@gmail.com";

interface Correction {
  id: number;
  gear_id: number | null;
  gear_name: string | null;
  gear_brand: string | null;
  field: string;
  current_value: string | null;
  suggested_value: string;
  source_url: string | null;
  note: string | null;
  submitter_email: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

type StatusFilter = "pending" | "approved" | "rejected";

export default function CorrectionsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Correction[]>([]);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  // per-row admin-overridden final value (defaults to suggested_value)
  const [finalVals, setFinalVals] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/corrections?status=${status}&limit=100`);
      const data = await res.json();
      if (res.ok) {
        setRows(data.corrections || []);
        const fv: Record<number, string> = {};
        for (const r of data.corrections || []) fv[r.id] = r.suggested_value;
        setFinalVals(fv);
      } else {
        setErr(data.error || "Failed to load");
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function act(id: number, action: "approve" | "reject") {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch("/api/corrections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, final_value: finalVals[id] }),
      });
      const data = await res.json();
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      } else {
        setErr(data.error || "Action failed");
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <Nav />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <Nav />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 text-muted-foreground">
          Admin access required.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-lg font-semibold mb-1">Community Corrections</h1>
        <p className="text-sm text-muted-foreground mb-5">
          User-submitted edits to gear. Approving weight/price/url/name writes to <span className="font-mono">clean_products</span> and marks it verified. Name & &quot;other&quot; are informational unless you edit the value.
        </p>

        <div className="flex items-center gap-2 mb-5">
          {(["pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
                status === s ? "bg-foreground text-background border-foreground" : "border-foreground/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button onClick={load} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">Refresh</button>
        </div>

        {err && <p className="text-sm text-red-500 mb-4">{err}</p>}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {status} corrections.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-md bg-foreground/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">{r.field}</span>
                  {r.gear_id ? (
                    <a href={`/gear/${r.gear_id}`} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline inline-flex items-center gap-1">
                      {r.gear_brand} {r.gear_name} <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">General report</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>

                {r.field !== "other" && (
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Current</div>
                      <div className="font-mono">{r.current_value ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Suggested → final</div>
                      <input
                        value={finalVals[r.id] ?? r.suggested_value}
                        onChange={(e) => setFinalVals((p) => ({ ...p, [r.id]: e.target.value }))}
                        className="w-full rounded-md border border-foreground/15 bg-transparent px-2 py-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                )}

                {r.field === "other" && (
                  <p className="text-sm mb-3 whitespace-pre-wrap">{r.suggested_value}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                  {r.source_url && (
                    <a href={r.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                      source <ExternalLink className="size-3" />
                    </a>
                  )}
                  {r.note && <span>note: {r.note}</span>}
                  {r.submitter_email && <span className="ml-auto">by {r.submitter_email}</span>}
                </div>

                {status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => act(r.id, "approve")}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {busyId === r.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Approve{r.gear_id && ["weight","price","url","name"].includes(r.field) ? " & apply" : ""}
                    </button>
                    <button
                      onClick={() => act(r.id, "reject")}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-50"
                    >
                      <X className="size-3" /> Reject
                    </button>
                  </div>
                )}
                {r.admin_note && <p className="mt-2 text-xs text-muted-foreground">admin: {r.admin_note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
