"use client";

/**
 * Save-to-account + "My Packs" controls, shared by /list and Pack Lab so both
 * surfaces stay in sync. Tracks the currently-loaded pack so Save updates it in
 * place (PUT) instead of always creating a duplicate; "Save as new" forces a new
 * pack (POST). Each saved pack has a public/private toggle. Login-gated.
 * Requires the user_packs table + API routes (src/app/api/packs).
 */
import { useCallback, useState } from "react";
import { usePackStore } from "@/store/pack-store";
import { useAuth } from "@/hooks/use-auth";
import { payloadToItems, type SharePayload } from "@/lib/pack-share";
import { Save, FolderOpen, X, Check, Trash, ExternalLink, Globe, Lock, FilePlus } from "lucide-react";

interface SavedPackSummary {
  id: string; name: string; isPublic: boolean; viewCount: number; itemCount: number; updatedAt: string;
}

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
  // Id of the pack currently loaded into the editor. When set, Save updates it in place.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [loadedName, setLoadedName] = useState<string | null>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2400); }

  function goLogin() { window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`; }

  // Save: update in place when a pack is loaded, otherwise create a new one.
  // `forceNew` bypasses the loaded id (the "Save as new" action).
  async function doSave(forceNew = false) {
    const payload = getSharePayload();
    if (!payload || payload.i.length === 0) { flash("Add an item before saving"); return; }
    if (!user) { goLogin(); return; }

    const targetId = forceNew ? null : loadedId;
    setSaving(true); setSavedLink(null);
    try {
      const res = await fetch(targetId ? `/api/packs/${targetId}` : "/api/packs", {
        method: targetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: payload.n, payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || data.authRequired) { goLogin(); return; }
        // Loaded pack no longer exists (deleted elsewhere) — fall back to creating new.
        if (res.status === 404 && targetId) { setLoadedId(null); flash("That pack was gone — saved as new below"); return doSave(true); }
        flash(data.error || "Save failed"); return;
      }
      const id = targetId ?? data.id;
      const url = `${window.location.origin}/p/${id}`;
      setLoadedId(id);
      setLoadedName(payload.n);
      setSavedLink(url);
      setPacks(null); // refresh list next open
      setOpen(true);
      try { await navigator.clipboard.writeText(url); flash(targetId ? "Updated — link copied" : "Saved — short link copied"); }
      catch { flash(targetId ? "Pack updated" : "Saved to your account"); }
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
      // Remember this pack so subsequent Saves update it in place.
      setLoadedId(id);
      setLoadedName(data.name || null);
      setOpen(false);
      flash(`Loaded “${data.name}” — Save will update it`);
    } finally { setBusy(false); }
  }

  async function deletePack(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/packs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPacks((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
        if (loadedId === id) { setLoadedId(null); setLoadedName(null); setSavedLink(null); }
      } else flash("Delete failed");
    } finally { setBusy(false); }
  }

  async function togglePublic(p: SavedPackSummary) {
    const next = !p.isPublic;
    // Optimistic flip.
    setPacks((prev) => (prev ? prev.map((x) => (x.id === p.id ? { ...x, isPublic: next } : x)) : prev));
    try {
      const res = await fetch(`/api/packs/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) {
        setPacks((prev) => (prev ? prev.map((x) => (x.id === p.id ? { ...x, isPublic: p.isPublic } : x)) : prev));
        flash("Couldn't change visibility");
      } else {
        flash(next ? "Now public — anyone with the link can view" : "Now private — only you can view");
      }
    } catch {
      setPacks((prev) => (prev ? prev.map((x) => (x.id === p.id ? { ...x, isPublic: p.isPublic } : x)) : prev));
    }
  }

  const listBtn = "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium";
  const iconBtn = "flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary";
  const saveLabel = loadedId ? "Update" : "Save";

  return (
    <>
      {variant === "icon" ? (
        <>
          <button type="button" onClick={openMenu} title="My saved packs" className={iconBtn}>
            <FolderOpen className="size-3.5" />
          </button>
          <button type="button" onClick={() => doSave()} disabled={saving} title={loadedId ? "Update the loaded pack" : "Save pack to your account"} className={iconBtn}>
            <Save className="size-3.5" />
          </button>
        </>
      ) : (
        <>
          <button onClick={openMenu} className={`${listBtn} border border-foreground/15`}><FolderOpen size={14} /> My Packs</button>
          <button onClick={() => doSave()} disabled={saving} className={`${listBtn} bg-foreground text-background disabled:opacity-60`}><Save size={14} /> {saving ? "Saving…" : saveLabel}</button>
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-background p-5 text-foreground shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">My Packs</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>

            {/* Currently-loaded pack banner + Save-as-new escape hatch */}
            {user && loadedId && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  Editing <span className="font-medium text-foreground">{loadedName || "a saved pack"}</span> — “{saveLabel}” overwrites it.
                </span>
                <button onClick={() => doSave(true)} disabled={saving} className="inline-flex shrink-0 items-center gap-1 rounded border border-foreground/15 px-1.5 py-0.5"><FilePlus size={12} /> Save as new</button>
              </div>
            )}

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
                  <li key={p.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${p.id === loadedId ? "border-primary/40 bg-primary/5" : "border-foreground/10"}`}>
                    <button onClick={() => loadPack(p.id)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.itemCount} items · {p.viewCount} views</div>
                    </button>
                    {/* Public/private toggle */}
                    <button
                      onClick={() => togglePublic(p)}
                      title={p.isPublic ? "Public — click to make private" : "Private — click to make public"}
                      className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] ${p.isPublic ? "border-green-500/40 text-green-600 dark:text-green-400" : "border-foreground/20 text-muted-foreground"}`}
                    >
                      {p.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                      {p.isPublic ? "Public" : "Private"}
                    </button>
                    {p.isPublic && (
                      <a href={`/p/${p.id}`} target="_blank" rel="noreferrer" className="shrink-0 rounded border border-foreground/15 px-1.5 py-0.5 text-[11px]" title="Open public link"><ExternalLink size={12} /></a>
                    )}
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
