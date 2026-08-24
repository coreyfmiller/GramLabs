"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, Sun, Moon, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "coreyfmiller@gmail.com";

interface NavLink {
  label: string;
  href: string;
  admin?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "PACK LAB", href: "/pack-lab" },
  { label: "MY GEAR", href: "/closet" },
  { label: "COMPARE", href: "/compare" },
  { label: "GEAR ADVISOR", href: "/chat" },
  { label: "TRIP ENGINE", href: "/trip" },
  { label: "JOURNAL", href: "/journal" },
  { label: "BRANDS", href: "/brands", admin: true },
  { label: "TODO", href: "/admin/todo", admin: true },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isAdmin = user?.email === ADMIN_EMAIL;

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

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const visibleLinks = NAV_LINKS.filter((link) => !link.admin || isAdmin);

  return (
    <>
      <header className="shrink-0 sticky top-0 z-50 border-b border-border glass">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          {/* Left: Logo + nav links */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Mountain className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                HikeMind
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 ml-8" aria-label="Main">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-[0.12em] transition-colors",
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: User + theme + mobile toggle */}
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={signOut}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Sign out"
              >
                <LogOut className="size-3.5" />
                <span className="max-w-[100px] truncate">
                  {user.email?.split("@")[0]}
                </span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="size-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-muted-foreground" />
              ) : (
                <Moon className="size-4 text-muted-foreground" />
              )}
            </button>

            <button
              className="md:hidden size-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="size-4 text-foreground" />
              ) : (
                <Menu className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[53px] bottom-0 z-40 bg-background/95 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[11px] font-medium uppercase tracking-[0.12em] px-3 py-3 rounded-lg transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <button
                onClick={signOut}
                className="flex items-center gap-2 mt-4 px-3 py-3 rounded-lg text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
