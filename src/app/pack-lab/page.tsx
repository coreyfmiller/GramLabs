"use client";

import PackHeader from "@/components/PackLab/PackHeader";
import GearSearch from "@/components/PackLab/GearSearch";
import PackList from "@/components/PackLab/PackList";
import WeightBreakdown from "@/components/PackLab/WeightBreakdown";
import AiSuggestions from "@/components/PackLab/AiSuggestions";

export default function PackLabPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <PackHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Gear search + Add */}
          <div className="lg:col-span-4 space-y-6">
            <GearSearch />
            <AiSuggestions />
          </div>

          {/* Center: Pack list */}
          <div className="lg:col-span-5">
            <PackList />
          </div>

          {/* Right: Weight breakdown */}
          <div className="lg:col-span-3">
            <WeightBreakdown />
          </div>
        </div>
      </div>
    </div>
  );
}
