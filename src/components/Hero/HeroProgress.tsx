import { scenes } from "@/config/scenes";

interface HeroProgressProps {
  sceneIndex: number;
  visible: boolean;
}

export default function HeroProgress({ sceneIndex, visible }: HeroProgressProps) {
  const current = String(sceneIndex + 1).padStart(2, "0");
  const total = String(scenes.length).padStart(2, "0");

  return (
    <div
      className={`absolute bottom-8 md:bottom-10 right-6 md:right-10 lg:right-16 z-20 transition-all duration-1000 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: "1400ms" }}
    >
      <span className="text-[11px] md:text-[12px] font-normal tracking-[0.15em] text-white/50 tabular-nums">
        {current} / {total}
      </span>
    </div>
  );
}
