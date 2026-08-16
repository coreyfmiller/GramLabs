"use client";

import { scenes } from "@/config/scenes";

interface HeroMetadataProps {
  sceneIndex: number;
  visible: boolean;
}

export default function HeroMetadata({ sceneIndex, visible }: HeroMetadataProps) {
  const scene = scenes[sceneIndex];

  return (
    <div
      className={`absolute bottom-8 md:bottom-10 left-6 md:left-10 lg:left-16 z-20 transition-all duration-1000 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: "1400ms" }}
    >
      <p className="text-[11px] md:text-[12px] font-normal tracking-[0.2em] text-white/70 uppercase">
        {scene.location}
      </p>
      <p className="mt-1 text-[10px] md:text-[11px] font-normal tracking-[0.15em] text-white/45 uppercase transition-opacity duration-700">
        {scene.label}
      </p>
    </div>
  );
}
