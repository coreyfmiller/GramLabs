"use client";

import { useState, useEffect, useCallback } from "react";
import HeroVideoSequence from "@/components/HeroVideoSequence";
import HeroNavigation from "./HeroNavigation";
import HeroContent from "./HeroContent";
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
    <section className="relative w-full h-dvh flex flex-col bg-[#0a0a0a]">
      {/* Navigation outside the video frame */}
      <div className="relative z-10">
        <HeroNavigation visible={loaded} />
      </div>

      {/* Cinematic video window */}
      <div className="relative flex-1 flex items-center justify-center px-4 md:px-8">
        <div className="relative w-full h-full max-h-[75vh] rounded-2xl overflow-hidden ring-1 ring-white/[0.06]">
          {/* Video layer */}
          <HeroVideoSequence onSceneChange={handleSceneChange} />

          {/* Readability overlays */}
          <div className="absolute inset-0 z-[5] pointer-events-none">
            {/* Subtle overall darken */}
            <div className="absolute inset-0 bg-black/[0.08]" />
            {/* Strong bottom gradient for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            {/* Edge fade to blend into background */}
            <div className="absolute inset-0 shadow-[inset_0_0_80px_30px_rgba(0,0,0,0.15)]" />
          </div>

          {/* Interface layers inside video frame */}
          <div className="absolute inset-0 z-10">
            <HeroContent sceneIndex={sceneIndex} visible={loaded} />
            <HeroPackWeight visible={loaded} />
            <HeroProgress sceneIndex={sceneIndex} visible={loaded} />
          </div>
        </div>
      </div>

      {/* Explore below the video */}
      <HeroExplore visible={loaded} />
    </section>
  );
}
