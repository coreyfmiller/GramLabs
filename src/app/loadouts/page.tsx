"use client";

import { useState, useEffect, useCallback } from "react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/hooks/use-auth";
import { getLoadouts, createLoadout, deleteLoadout, Loadout } from "@/lib/loadout-api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Layers,
  Plus,
  Trash2,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";

export default function LoadoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getLoadouts();
    setLoadouts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const loadout = await createLoadout({ name: newName, description: newDesc });
    if (loadout) {
      setLoadouts((prev) => [loadout, ...prev]);
    }
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    await deleteLoadout(id);
    setLoadouts((prev) => prev.filter((l) => l.id !== id));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Nav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="size-6 text-emerald-400" />
              Loadouts
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Build pack configurations from your gear closet
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
          >
            <Plus className="size-4" />
            New Loadout
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="mb-6 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-medium text-white mb-3">Create Loadout</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Loadout name (e.g., Summer Ultralight)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loadouts List */}
        {loading ? (
          <div className="text-center text-zinc-500 py-16">Loading loadouts...</div>
        ) : loadouts.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="size-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 mb-2">No loadouts yet</p>
            <p className="text-sm text-zinc-500">
              Create a loadout to start building pack configurations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {loadouts.map((loadout) => (
              <div
                key={loadout.id}
                className="group relative flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors"
              >
                <Link
                  href={`/loadouts/${loadout.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center size-9 rounded-lg",
                        loadout.isPublic
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-zinc-800 text-zinc-400"
                      )}
                    >
                      {loadout.isPublic ? (
                        <Globe className="size-4" />
                      ) : (
                        <Lock className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {loadout.name}
                      </h3>
                      {loadout.description && (
                        <p className="text-xs text-zinc-500 truncate">
                          {loadout.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(loadout.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    aria-label="Delete loadout"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <Link href={`/loadouts/${loadout.id}`}>
                    <ChevronRight className="size-4 text-zinc-600" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
