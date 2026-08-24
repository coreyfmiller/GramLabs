"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, Sun, Moon, LogOut, Menu, X, Settings } from "lucide-react";
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
  { label: "CALORIES", href: "/calories" },
  { label: "JOURNAL", href: "/journal" },
];

const ADMIN_LINKS: NavLink[] = [
  { label: "Brands", href: "/brands" },
  { label: "TODO", href: "/admin/todo" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
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
    setAdminOpen(false);
  }, [pathname]);

  const visibleLinks = NAV_LINKS;

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

          {/* Right: User + admin + theme + mobile toggle */}
          <div className="flex items-center gap-2">
            {/* Admin dropdown */}
            {isAdmin && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="size-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                  aria-label="Admin"
                >
                  <Settings className="size-4 text-muted-foreground" />
                </button>
                {adminOpen && (
                  <div className="absolute right-0 top-11 z-50 w-36 rounded-lg border border-border bg-card shadow-xl py-1">
                    {ADMIN_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            {isAdmin && (
              <div className="border-t border-border mt-2 pt-2">
                {ADMIN_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[11px] font-medium uppercase tracking-[0.12em] px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors block"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
