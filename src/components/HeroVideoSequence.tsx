"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { scenes } from "@/config/scenes";

const CROSSFADE_DURATION = 1000;

interface HeroVideoSequenceProps {
  onSceneChange?: (index: number) => void;
}

export default function HeroVideoSequence({ onSceneChange }: HeroVideoSequenceProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextSceneIndex, setNextSceneIndex] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getNextIndex = useCallback((current: number) => {
    return (current + 1) % scenes.length;
  }, []);

  useEffect(() => {
    const videoA = videoARef.current;
    if (!videoA) return;
    videoA.src = scenes[0].src;
    videoA.load();
    videoA.play().catch(() => {});
    onSceneChange?.(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const inactiveVideo = activeSlot === "A" ? videoBRef.current : videoARef.current;
    if (!inactiveVideo) return;
    const nextSrc = scenes[nextSceneIndex].src;
    if (inactiveVideo.src !== window.location.origin + nextSrc) {
      inactiveVideo.src = nextSrc;
      inactiveVideo.load();
    }
  }, [nextSceneIndex, activeSlot]);

  const handleVideoEnded = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);

    const inactiveVideo = activeSlot === "A" ? videoBRef.current : videoARef.current;
    if (inactiveVideo) {
      inactiveVideo.currentTime = 0;
      inactiveVideo.play().catch(() => {});
    }

    transitionTimeoutRef.current = setTimeout(() => {
      const newActive = activeSlot === "A" ? "B" : "A";
      setActiveSlot(newActive);
      setCurrentIndex(nextSceneIndex);
      onSceneChange?.(nextSceneIndex);
      setNextSceneIndex(getNextIndex(nextSceneIndex));
      setTransitioning(false);
    }, CROSSFADE_DURATION);
  }, [activeSlot, nextSceneIndex, transitioning, getNextIndex, onSceneChange]);

  useEffect(() => {
    const activeVideo = activeSlot === "A" ? videoARef.current : videoBRef.current;
    if (!activeVideo) return;
    activeVideo.addEventListener("ended", handleVideoEnded);
    return () => {
      activeVideo.removeEventListener("ended", handleVideoEnded);
    };
  }, [activeSlot, handleVideoEnded]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const videoBaseStyles =
    "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out";

  const isAActive = activeSlot === "A";
  const showA = (isAActive && !transitioning) || (!isAActive && transitioning);
  const showB = (!isAActive && !transitioning) || (isAActive && transitioning);

  return (
    <>
      <video
        ref={videoARef}
        className={`${videoBaseStyles} ${showA ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <video
        ref={videoBRef}
        className={`${videoBaseStyles} ${showB ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* Keep currentIndex in sync for potential future use */}
      <span className="hidden" data-scene={currentIndex} />
    </>
  );
}
