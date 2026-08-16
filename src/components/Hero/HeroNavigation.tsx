"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = ["GEAR", "FIELD NOTES", "ABOUT"];

export default function HeroNavigation({ visible }: { visible: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className={`relative z-20 flex items-center justify-between w-full pt-8 px-6 md:px-10 lg:px-16 transition-opacity duration-1000 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionDelay: "200ms" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="text-[15px] md:text-[17px] font-medium tracking-[0.2em] text-white/90 uppercase"
      >
        RIDGELINE
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-10">
        {navLinks.map((link) => (
          <a
            key={link}
            href="#"
            className="text-[13px] font-normal tracking-[0.15em] text-white/60 hover:text-white/90 transition-colors duration-300 uppercase"
          >
            {link}
          </a>
        ))}
        <button
          className="ml-4 text-white/60 hover:text-white/90 transition-colors duration-300"
          aria-label="Menu"
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <line x1="0" y1="1" x2="20" y2="1" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Mobile menu icon */}
      <button
        className="md:hidden text-white/70 hover:text-white/90 transition-colors"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full right-6 mt-4 flex flex-col gap-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[13px] tracking-[0.15em] text-white/70 uppercase"
            >
              {link}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
