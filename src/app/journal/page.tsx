"use client";

import { useState, useEffect, useCallback } from "react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/hooks/use-auth";
import { getTrips, createTrip, deleteTrip, Trip, CreateTripInput } from "@/lib/trips-api";
import { usePackStore } from "@/store/pack-store";
import { cn } from "@/lib/utils";
import {
  Plus,
  MapPin,
  Calendar,
  Mountain,
  Star,
  Trash2,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default function JournalPage() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const data = await getTrips();
    setTrips(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadTrips();
  }, [user, loadTrips]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trip?")) return;
    await deleteTrip(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Trip Journal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Log your trips, rate your gear, and learn what works.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            <Plus className="size-4" />
            Log Trip
          </button>
        </div>

        {/* Trip list */}
        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-16">Loading trips...</p>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <BookOpen className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground">No trips logged yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              After your next hike, come back and log it. Track what worked, what didn&apos;t, and build your hiking memory.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
            >
              <Plus className="size-4" />
              Log your first trip
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/journal/${trip.id}`}
                className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                {/* Rating */}
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {trip.overall_rating ? (
                    <span className="num text-sm font-bold text-primary">{trip.overall_rating}</span>
                  ) : (
                    <Star className="size-4 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{trip.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {trip.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {trip.location}
                      </span>
                    )}
                    {trip.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(trip.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    {trip.distance_miles && (
                      <span className="flex items-center gap-1">
                        <Mountain className="size-3" />
                        {trip.distance_miles} mi
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(trip.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Trip Modal */}
      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onCreate={(trip) => { setTrips((prev) => [trip, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateTripModal({ onClose, onCreate }: { onClose: () => void; onCreate: (trip: Trip) => void }) {
  const loadouts = usePackStore((s) => s.loadouts);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);

  const [form, setForm] = useState<CreateTripInput>({
    name: "",
    location: "",
    start_date: "",
    end_date: "",
    distance_miles: undefined,
    elevation_ft: undefined,
    conditions: "",
    overall_rating: undefined,
    notes: "",
    loadout_name: "",
    loadout_snapshot: undefined,
  });
  const [saving, setSaving] = useState(false);

  function handleLoadoutSelect(loadoutId: string) {
    const loadout = loadouts.find((l) => l.id === loadoutId);
    if (loadout) {
      setForm({
        ...form,
        loadout_name: loadout.name,
        loadout_snapshot: loadout.items.map((i) => ({
          name: i.item.name,
          brand: i.item.brand,
          category: i.item.category,
          weightOz: i.item.weightOz,
        })),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const trip = await createTrip({
      ...form,
      name: form.name.trim(),
      distance_miles: form.distance_miles || undefined,
      elevation_ft: form.elevation_ft || undefined,
      overall_rating: form.overall_rating || undefined,
    });
    if (trip) onCreate(trip);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Log a Trip</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
            <Plus className="size-5 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Trip Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wonderland Trail Loop"
              required
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>

          {/* Location + Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Mount Rainier NP, WA"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <input
                type="date"
                value={form.start_date || ""}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <input
                type="date"
                value={form.end_date || ""}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Distance + Elevation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Total Distance (mi)</label>
              <input
                type="number"
                value={form.distance_miles || ""}
                onChange={(e) => setForm({ ...form, distance_miles: parseFloat(e.target.value) || undefined })}
                placeholder="93"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Elevation Gain (ft)</label>
              <input
                type="number"
                value={form.elevation_ft || ""}
                onChange={(e) => setForm({ ...form, elevation_ft: parseInt(e.target.value) || undefined })}
                placeholder="22000"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Loadout */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Loadout Used</label>
            <select
              value={loadouts.find((l) => l.name === form.loadout_name)?.id || ""}
              onChange={(e) => handleLoadoutSelect(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            >
              <option value="">Select a loadout (optional)</option>
              {loadouts.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Overall Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, overall_rating: form.overall_rating === n ? undefined : n })}
                  className={cn(
                    "size-9 rounded-lg border flex items-center justify-center transition-colors",
                    form.overall_rating && form.overall_rating >= n
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-input text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <Star className={cn("size-4", form.overall_rating && form.overall_rating >= n && "fill-current")} />
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Conditions</label>
            <input
              type="text"
              value={form.conditions || ""}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              placeholder="e.g. Hot days (85°F), cool nights (45°F), one rain day"
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="How did it go? What would you change next time?"
              rows={3}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!form.name.trim() || saving}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Log Trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
