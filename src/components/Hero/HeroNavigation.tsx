"use client";

const NAV_LINKS = ["TOOLS", "PACK LAB", "TRIP PLANNER", "GEAR COMPARE", "TRAILS"];

interface HeroNavigationProps {
  visible: boolean;
}

export default function HeroNavigation({ visible }: HeroNavigationProps) {
  return (
    <nav
      className={`relative z-20 flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8 transition-all duration-1000 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
      style={{ transitionDelay: "200ms" }}
    >
      {/* Logo */}
      <span className="text-[16px] md:text-[20px] font-bold tracking-[0.2em] text-white">
        GRAMLAB.AI
      </span>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="text-[13px] font-medium tracking-[0.15em] text-white hover:text-white/80 transition-colors duration-300"
          >
            {link}
          </a>
        ))}
        <a
          href="#"
          className="text-[13px] font-bold tracking-[0.15em] text-white hover:text-white/80 transition-colors duration-300 ml-4"
        >
          BUILD MY PACK →
        </a>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-[5px] p-1"
        aria-label="Menu"
      >
        <span className="block w-5 h-[1.5px] bg-white" />
        <span className="block w-5 h-[1.5px] bg-white" />
      </button>
    </nav>
  );
}
