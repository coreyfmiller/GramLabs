"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "MY GEAR", href: "/closet" },
  { label: "PACK LAB", href: "/pack-lab" },
  { label: "DISCOVER", href: "/compare" },
  { label: "AI ADVISOR", href: "/chat" },
  { label: "PLAN", href: "/trip" },
  { label: "BRANDS", href: "/brands", admin: true },
  { label: "TODO", href: "/admin/todo", admin: true },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("hikemind-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("light", saved === "light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hikemind-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  return (
    <>
      <header className="shrink-0 border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          {/* Left: Logo + nav */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Mountain className="size-5" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold tracking-tight">HikeMind</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 ml-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-xs font-medium tracking-[0.15em] transition-colors inline-flex items-center gap-1.5",
                    pathname === link.href
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  {("admin" in link) && link.admin && (
                    <span className="px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded leading-none">
                      ADMIN
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Theme toggle + Mobile hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="size-9 flex items-center justify-center rounded-lg border border-border bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-muted-foreground" />
              ) : (
                <Moon className="size-4 text-muted-foreground" />
              )}
            </button>

            <button
              className="md:hidden flex flex-col gap-[5px] p-2"
              aria-label="Menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span
                className={cn(
                  "block w-5 h-[1.5px] bg-foreground transition-transform duration-300",
                  mobileOpen && "rotate-45 translate-y-[3.5px]"
                )}
              />
              <span
                className={cn(
                  "block w-5 h-[1.5px] bg-foreground transition-transform duration-300",
                  mobileOpen && "-rotate-45 -translate-y-[3.5px]"
                )}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[57px] z-50 bg-background/95 backdrop-blur-md border-b border-white/10 px-6 py-6 flex flex-col gap-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium tracking-[0.15em] transition-colors inline-flex items-center gap-2",
                pathname === link.href
                  ? "text-primary font-bold"
                  : "text-foreground hover:text-primary"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
              {("admin" in link) && link.admin && (
                <span className="px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded leading-none">
                  ADMIN
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
