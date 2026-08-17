"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "PACK LAB", href: "/pack-lab" },
  { label: "GEAR ADVISOR", href: "/chat" },
  { label: "TRIP ENGINE", href: "/trip-engine" },
  { label: "GEAR INTEL", href: "/gear-intel" },
];

interface HeroNavigationProps {
  visible: boolean;
}

export default function HeroNavigation({ visible }: HeroNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav
        className={`relative z-20 flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8 transition-all duration-1000 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
        style={{ transitionDelay: "200ms" }}
      >
        {/* Logo */}
        <span className="text-[16px] md:text-[20px] font-bold tracking-[0.2em] text-white">
          HIKEMIND
        </span>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium tracking-[0.15em] text-white hover:text-white/80 transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/pack-lab"
            className="text-[13px] font-bold tracking-[0.15em] text-white hover:text-white/80 transition-colors duration-300 ml-4"
          >
            BUILD MY PACK →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          aria-label="Menu"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span
            className={`block w-5 h-[1.5px] bg-white transition-transform duration-300 ${
              mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-white transition-transform duration-300 ${
              mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-[60px] z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-6 py-6 flex flex-col gap-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[14px] font-medium tracking-[0.15em] text-white hover:text-lime-400 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/pack-lab"
            className="text-[14px] font-bold tracking-[0.15em] text-lime-400 mt-2"
            onClick={() => setMobileOpen(false)}
          >
            BUILD MY PACK →
          </Link>
        </div>
      )}
    </>
  );
}
