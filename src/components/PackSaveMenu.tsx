"use client";

/**
 * Save-to-account + "My Packs" controls, shared by /list and Pack Lab so both
 * surfaces stay in sync. Renders a Save button and a My Packs button that opens
 * a modal to load or delete saved packs. Requires the user_packs table + API
 * routes (src/app/api/packs). Login-gated: unauthenticated users are sent to /login.
 */
import { useCallback, useState } from "react";
import { usePackStore } from "@/store/pack-store";
import { useAuth } from "@/hooks/use-auth";
import { payloadToItems, type SharePayload } from "@/lib/pack-share";
import { Save, FolderOpen, X, Check, Trash, ExternalLink } from "lucide-react";

interface SavedPackSummary {
  id: string; name: string; isPublic: boolean; viewCount: number; itemCount: number; updatedAt: string;
}

/** `variant` controls button chrome so it blends into either toolbar. */
export function PackSaveMenu({ variant = "list", redirectTo = "/list" }: { variant?: "list" | "icon"; redirectTo?: string }) {
  const { user } = useAuth();
  const getSharePayload = usePackStore((s) => s.getSharePayload);
  const hydrateFromShareData = usePackStore((s) => s.hydrateFromShareData);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedLink, setSavedLink] = useState<string | null>(null);
  const [packs, setPacks] = useState<SavedPackSummary[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2400); }

  async function doSave() {
    const payload = getSharePayload();
    if (!payload || payload.i.length === 0) { flash("Add an item before saving"); return; }
    if (!user) { window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`; return; }
    setSaving(true); setSavedLink(null);
    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: payload.n, payload, isPublic: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || data.authRequired) { window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`; return; }
        flash(data.error || "Save failed"); return;
      }
      const full = `${window.location.origin}${data.url}`;
      setSavedLink(full);
      setPacks(null); // refresh list next open
      setOpen(true);
      try { await navigator.clipboard.writeText(full); flash("Saved — short link copied"); }
      catch { flash("Saved to your account"); }
    } finally { setSaving(false); }
  }

  const loadPacks = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/packs");
      if (res.status === 401) { setPacks([]); return; }
      const data = await res.json();
      setPacks(res.ok ? (data.packs || []) : []);
    } catch { setPacks([]); }
    finally { setBusy(false); }
  }, []);

  function openMenu() {
    setOpen(true);
    if (user && packs === null) loadPacks();
  }

  async function loadPack(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/packs/${id}`);
      const data = await res.json();
      if (!res.ok) { flash(data.error || "Couldn't load pack"); return; }
      const decoded = payloadToItems(data.payload as SharePayload);
      hydrateFromShareData(decoded.items, data.name || "Saved Pack");
      setOpen(false);
      flash(`Loaded “${data.name}”`);
    } finally { setBusy(false); }
  }

  async function deletePack(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/packs/${id}`, { method: "DELETE" });
      if (res.ok) setPacks((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
      else flash("Delete failed");
    } finally { setBusy(false); }
  }

  // Button chrome per surface.
  const listBtn = "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium";
  const iconBtn = "flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary";

  return (
    <>
      {variant === "icon" ? (
        <>
          <button type="button" onClick={openMenu} title="My saved packs" className={iconBtn}>
            <FolderOpen className="size-3.5" />
          </button>
          <button type="button" onClick={doSave} disabled={saving} title="Save pack to your account" className={iconBtn}>
            <Save className="size-3.5" />
          </button>
        </>
      ) : (
        <>
          <button onClick={openMenu} className={`${listBtn} border border-foreground/15`}><FolderOpen size={14} /> My Packs</button>
          <button onClick={doSave} disabled={saving} className={`${listBtn} bg-foreground text-background disabled:opacity-60`}><Save size={14} /> {saving ? "Saving…" : "Save"}</button>
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-background p-5 text-foreground shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">My Packs</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>

            {savedLink && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-2 text-xs">
                <Check size={14} className="shrink-0 text-green-500" />
                <a href={savedLink} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate underline">{savedLink}</a>
                <button onClick={() => { navigator.clipboard?.writeText(savedLink); flash("Link copied"); }} className="shrink-0 rounded border border-foreground/15 px-1.5 py-0.5">Copy</button>
              </div>
            )}

            {!user ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <p className="mb-3">Sign in to save packs to your account and get a permanent short link.</p>
                <a href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">Sign in</a>
              </div>
            ) : busy && packs === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : packs && packs.length > 0 ? (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {packs.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-lg border border-foreground/10 px-3 py-2">
                    <button onClick={() => loadPack(p.id)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.itemCount} items · {p.viewCount} views</div>
                    </button>
                    <a href={`/p/${p.id}`} target="_blank" rel="noreferrer" className="shrink-0 rounded border border-foreground/15 px-1.5 py-0.5 text-[11px]" title="Open public link"><ExternalLink size={12} /></a>
                    <button onClick={() => deletePack(p.id)} disabled={busy} className="shrink-0 text-muted-foreground hover:text-red-500" aria-label="Delete pack"><Trash size={14} /></button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No saved packs yet. Hit “Save” to store your current pack and get a shareable link.</p>
            )}
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">{toast}</div>}
    </>
  );
}
