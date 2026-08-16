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
      className={`absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 transition-all duration-1000 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: "1400ms" }}
    >
      <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-white/70 tracking-wider">
        {current} / {total}
      </span>
      <div className="flex items-center gap-[6px]">
        {scenes.map((_, i) => (
          <div
            key={i}
            className={`w-[16px] h-[2px] transition-colors duration-500 ${
              i === sceneIndex ? "bg-lime-400" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
