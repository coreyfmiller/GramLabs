export default function HeroExplore({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 transition-all duration-1000 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: "1600ms" }}
    >
      <span className="text-[10px] md:text-[11px] font-normal tracking-[0.25em] text-white/40 uppercase">
        EXPLORE
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className="text-white/30 animate-[subtleDrift_3s_ease-in-out_infinite]"
      >
        <path d="M1 4L6 9L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
