"use client";

import { useState, useEffect, useCallback } from "react";
import HeroVideoSequence from "@/components/HeroVideoSequence";
import HeroNavigation from "./HeroNavigation";
import HeroContent from "./HeroContent";
import HeroMetadata from "./HeroMetadata";
import HeroExplore from "./HeroExplore";
import HeroProgress from "./HeroProgress";
import HeroPackWeight from "./HeroPackWeight";

export default function CinematicHero() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
        <div className="absolute inset-0 bg-black/[0.08]" />
        {/* Bottom gradient for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/25 to-transparent" />
        {/* Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_60px_rgba(0,0,0,0.12)]" />
      </div>

      {/* Interface layers */}
      <div className="absolute inset-0 z-10">
        <HeroNavigation visible={loaded} />
        <HeroContent sceneIndex={sceneIndex} visible={loaded} />
        <HeroPackWeight visible={loaded} />
        <HeroMetadata sceneIndex={sceneIndex} visible={loaded} />
        <HeroProgress sceneIndex={sceneIndex} visible={loaded} />
        <HeroExplore visible={loaded} />
      </div>
    </section>
  );
}
