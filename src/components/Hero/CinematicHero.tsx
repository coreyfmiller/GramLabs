"use client";

import { useState, useEffect, useCallback } from "react";
import HeroVideoSequence from "@/components/HeroVideoSequence";
import HeroNavigation from "./HeroNavigation";
import HeroBrand from "./HeroBrand";
import HeroMetadata from "./HeroMetadata";
import HeroExplore from "./HeroExplore";
import HeroProgress from "./HeroProgress";

export default function CinematicHero() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Trigger entrance animations after a short delay
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSceneChange = useCallback((index: number) => {
    setSceneIndex(index);
  }, []);

  return (
    <section className="relative w-full h-dvh overflow-hidden bg-[#0a0a0a]">
      {/* Video layer */}
      <HeroVideoSequence onSceneChange={handleSceneChange} />

      {/* Readability overlays */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        {/* Subtle overall darken */}
        <div className="absolute inset-0 bg-black/[0.12]" />
        {/* Bottom gradient for metadata readability */}
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/30 to-transparent" />
        {/* Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.15)]" />
      </div>

      {/* Interface layers */}
      <div className="absolute inset-0 z-10 flex flex-col">
        <HeroNavigation visible={loaded} />
        <HeroBrand visible={loaded} />
        <HeroMetadata sceneIndex={sceneIndex} visible={loaded} />
        <HeroExplore visible={loaded} />
        <HeroProgress sceneIndex={sceneIndex} visible={loaded} />
      </div>
    </section>
  );
}
