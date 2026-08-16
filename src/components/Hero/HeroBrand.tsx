export default function HeroBrand({ visible }: { visible: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <h1
        className={`text-[clamp(2rem,5vw,4.5rem)] font-light tracking-[0.35em] text-white/90 uppercase transition-all duration-[1400ms] ease-out ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "600ms" }}
      >
        RIDGELINE
      </h1>
      <p
        className={`mt-3 text-[clamp(0.65rem,1.2vw,0.875rem)] font-normal tracking-[0.3em] text-white/50 uppercase transition-all duration-[1400ms] ease-out ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "1000ms" }}
      >
        CARRY LESS. GO FARTHER.
      </p>
    </div>
  );
}
