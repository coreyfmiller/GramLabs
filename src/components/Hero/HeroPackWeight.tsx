"use client";

interface HeroPackWeightProps {
  visible: boolean;
}

export default function HeroPackWeight({ visible }: HeroPackWeightProps) {
  return (
    <div
      className={`absolute right-6 md:right-10 lg:right-16 bottom-[100px] md:bottom-[110px] z-20 hidden md:block transition-all duration-1000 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: "1200ms" }}
    >
      <div className="flex flex-col gap-[6px] text-right">
        <span className="text-[10px] tracking-[0.2em] text-white/60 uppercase font-medium">
          PACK ANALYSIS
        </span>

        <div className="w-full h-[1px] bg-white/20" />

        <div className="flex flex-col gap-[2px]">
          <span className="text-[9px] tracking-[0.15em] text-white/50 uppercase">
            BASE WEIGHT
          </span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-white tracking-wide">
            8.74 LB / 3.96 KG
          </span>
        </div>

        <div className="w-full h-[1px] bg-white/20" />

        <div className="flex flex-col gap-[2px]">
          <span className="text-[9px] tracking-[0.15em] text-white/50 uppercase">
            TARGET
          </span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-white tracking-wide">
            &lt; 10 LB
          </span>
        </div>

        <div className="w-full h-[1px] bg-white/20" />

        <div className="flex items-center justify-end gap-2">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[9px] tracking-[0.15em] text-white/50 uppercase">
              POTENTIAL SAVINGS
            </span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-white tracking-wide">
              −18.7 OZ
            </span>
          </div>
          <span className="w-[5px] h-[5px] bg-lime-400 block flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
