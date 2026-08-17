"use client";

import { useEffect, useState, useRef } from "react";
import { scenes } from "@/config/scenes";

interface HeroContentProps {
  sceneIndex: number;
  visible: boolean;
}

export default function HeroContent({ sceneIndex, visible }: HeroContentProps) {
  const [displayIndex, setDisplayIndex] = useState(sceneIndex);
  const [contentVisible, setContentVisible] = useState(false);
  const prevIndexRef = useRef(sceneIndex);

  useEffect(() => {
    if (sceneIndex !== prevIndexRef.current) {
      setContentVisible(false);
      const timer = setTimeout(() => {
        setDisplayIndex(sceneIndex);
        prevIndexRef.current = sceneIndex;
        setTimeout(() => setContentVisible(true), 80);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sceneIndex]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setContentVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const scene = scenes[displayIndex];

  return (
    <div className="absolute left-6 md:left-10 lg:left-16 bottom-[15%] flex flex-col items-start text-left z-20 pointer-events-none max-w-[520px]">
      {/* Technical label */}
      <span
        className={`text-[11px] md:text-[12px] font-bold tracking-[0.3em] text-lime-400 uppercase mb-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out ${
          contentVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: contentVisible ? "0ms" : "0ms" }}
      >
        {scene.technicalLabel}
      </span>

      {/* Headline */}
      <h1
        className={`text-[32px] md:text-[48px] lg:text-[58px] font-bold tracking-tight leading-[1.05] text-white uppercase mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-all duration-700 ease-out ${
          contentVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: contentVisible ? "100ms" : "0ms" }}
      >
        {scene.headline}
      </h1>

      {/* Copy */}
      <p
        className={`text-[14px] md:text-[16px] lg:text-[17px] font-normal leading-relaxed text-white/90 mb-7 max-w-[420px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out ${
          contentVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: contentVisible ? "200ms" : "0ms" }}
      >
        {scene.copy}
      </p>

      {/* CTA */}
      <span
        className={`text-[12px] md:text-[13px] font-bold tracking-[0.2em] text-white uppercase pointer-events-auto cursor-pointer hover:text-lime-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out ${
          contentVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: contentVisible ? "300ms" : "0ms" }}
      >
        {scene.cta}
      </span>
    </div>
  );
}
