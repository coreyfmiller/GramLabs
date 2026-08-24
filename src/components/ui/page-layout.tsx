import { cn } from "@/lib/utils";

/**
 * ScrollPage — for pages with scrollable content (Closet, Compare, Build, Trip)
 * Provides consistent page structure: full-height bg + main content with max-width
 */
export function ScrollPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {children}
    </div>
  );
}

/**
 * PageContent — the main content area within a ScrollPage (below Nav)
 */
export function PageContent({
  children,
  className,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto px-4 md:px-6 py-6 md:py-8",
        wide ? "max-w-7xl" : "max-w-6xl",
        className
      )}
    >
      {children}
    </main>
  );
}

/**
 * AppShell — for full-viewport app-like pages (Pack Lab)
 * No scroll on outer container, content fills viewport
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh flex flex-col bg-background text-foreground overflow-hidden">
      {children}
    </div>
  );
}

/**
 * ChatLayout — for chat-style pages (AI Advisor)
 * Full height, narrow centered content, input pinned to bottom
 */
export function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh flex flex-col bg-background text-foreground">
      {children}
    </div>
  );
}

/**
 * PageHeader — consistent page title + description
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

/**
 * SectionHeader — labels for sections within a page
 */
export function SectionHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}

/**
 * EmptyState — consistent empty state for lists/containers
 */
export function EmptyState({
  icon: Icon,
  heading,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium text-foreground">{heading}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
