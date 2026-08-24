"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, Sun, Moon, LogOut, Menu, X, Settings, User as UserIcon, Scale, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePackStore } from "@/store/pack-store";
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

          {/* Right: Profile + mobile toggle */}
          <div className="flex items-center gap-2">
            {/* Profile dropdown (logged in) */}
            {user && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <UserIcon className="size-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground max-w-[80px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>

                {adminOpen && (
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-card shadow-xl py-2">
                    {/* User info */}
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Free plan</p>
                    </div>

                    {/* Units preference */}
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Scale className="size-3" />
                          Weight unit
                        </span>
                        <button
                          onClick={() => {
                            const store = usePackStore.getState();
                            store.setWeightUnit(store.weightUnit === "oz" ? "g" : "oz");
                          }}
                          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-border hover:border-primary/30 transition-colors"
                        >
                          {usePackStore.getState().weightUnit === "oz" ? "oz → kg/g" : "g → oz/lb"}
                        </button>
                      </div>
                    </div>

                    {/* Theme */}
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {theme === "dark" ? <Moon className="size-3" /> : <Sun className="size-3" />}
                          Theme
                        </span>
                        <button
                          onClick={toggleTheme}
                          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-border hover:border-primary/30 transition-colors"
                        >
                          {theme === "dark" ? "Dark → Light" : "Light → Dark"}
                        </button>
                      </div>
                    </div>

                    {/* Admin section */}
                    {isAdmin && (
                      <div className="border-t border-border mt-1 pt-1">
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Admin</p>
                        {ADMIN_LINKS.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                          >
                            <Settings className="size-3 text-muted-foreground" />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Sign out */}
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={signOut}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <LogOut className="size-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login link (not logged in) */}
            {!user && (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            )}

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
