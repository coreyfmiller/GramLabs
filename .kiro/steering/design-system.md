---
inclusion: auto
---

# HikeMind — Design System

This is the single source of truth for all visual decisions. No page, component, or feature may deviate from these specifications. When in doubt, the answer is here.

---

## Brand Position

HikeMind is a **precision tool for hikers who optimize**. It is not a lifestyle brand. It is not a marketplace. It is an intelligence platform.

Visual references: Strava (data density), Arc browser (polish + restraint), Linear (professional dark UI), Garmin Connect (technical but approachable).

Anti-references: REI.com (catalog feel), AllTrails (consumer/casual), generic SaaS templates.

---

## Color System

### Philosophy
The color palette is built on **restraint**. The UI is almost entirely achromatic (grays on black). Color appears only with intent: primary actions, data highlights, category indicators.

### Primary — Trail Green
A muted, sophisticated green that evokes trail and topography. NOT neon. NOT lime. NOT emerald.

```
--primary: oklch(0.72 0.17 145)
```

This is approximately `#4ade80` territory — a desaturated mid-green with a teal-forward hue (145 vs the current 130 lime). It reads as "outdoor intelligence" not "gaming" or "finance."

**Rationale:** The current `oklch(0.768 0.1936 130.85)` is pure lime-green (#84cc16) — it's too saturated, too yellow, and reads as cheap/generic. Shifting the hue from 130→145 adds a natural green character. Reducing chroma from 0.19→0.17 and lightness from 0.77→0.72 makes it more premium.

### Neutral Scale (achromatic oklch)
| Token | Value | Use |
|-------|-------|-----|
| `--background` | `oklch(0.09 0 0)` | Page background (true dark, not gray-dark) |
| `--foreground` | `oklch(0.95 0 0)` | Primary text |
| `--card` | `oklch(0.12 0 0)` | Elevated surfaces (cards, panels) |
| `--card-foreground` | `oklch(0.95 0 0)` | Text on cards |
| `--muted` | `oklch(0.16 0 0)` | Subtle backgrounds (hover states, wells) |
| `--muted-foreground` | `oklch(0.55 0 0)` | Secondary text, labels, descriptions |
| `--border` | `oklch(1 0 0 / 8%)` | Subtle dividers |
| `--input` | `oklch(1 0 0 / 6%)` | Input field backgrounds |

### Functional Colors
| Token | Value | Use |
|-------|-------|-----|
| `--destructive` | `oklch(0.65 0.2 25)` | Delete, errors |
| `--warning` | `oklch(0.75 0.15 85)` | Warnings, limits approaching |
| `--success` | `oklch(0.72 0.17 145)` | Same as primary (green = good) |

### Category Colors (for gear type indicators only)
These appear ONLY as small dots, badges, or chart segments — never as backgrounds for large areas.
| Category | Color |
|----------|-------|
| Shelter | `oklch(0.7 0.15 250)` — blue |
| Sleep | `oklch(0.65 0.15 290)` — indigo |
| Pack | `oklch(0.75 0.12 70)` — amber |
| Kitchen | `oklch(0.7 0.15 50)` — orange |
| Electronics | `oklch(0.78 0.12 90)` — yellow |
| Safety | `oklch(0.65 0.18 25)` — red |
| Accessories | `oklch(0.72 0.17 145)` — green (matches primary) |

---

## Typography

### Font Stack
- **Body/UI:** Archivo — geometric, clean, slightly condensed. Great at small sizes.
- **Data/Numbers:** JetBrains Mono — tabular figures, monospace for weights, measurements, stats.

### Scale (rem-based, 16px root)
| Name | Size | Weight | Use |
|------|------|--------|-----|
| `page-title` | 1.5rem (24px) | 700 | Page headings: "Gear Closet", "Trip Engine" |
| `section-title` | 0.8125rem (13px) | 600, uppercase, tracking-[0.12em] | Section labels within a page |
| `body` | 0.8125rem (13px) | 400 | Default body text |
| `body-sm` | 0.75rem (12px) | 400 | Descriptions, secondary info |
| `caption` | 0.6875rem (11px) | 400 | Timestamps, fine print, tertiary info |
| `data` | 0.875rem (14px) | 500, mono | Weight values, stats, measurements |
| `data-lg` | 1.5rem (24px) | 700, mono | Big hero numbers (base weight, total) |
| `nav-link` | 0.6875rem (11px) | 500, uppercase, tracking-[0.12em] | Navigation items |

### Rules
- No font size below 11px (accessibility minimum)
- Numbers ALWAYS use `font-mono tabular-nums` (the `.num` utility)
- Page titles are always left-aligned (never centered, except chat empty state)
- Descriptions use `text-muted-foreground` — never pure white

---

## Spacing

### Base Unit: 4px
All spacing uses multiples of 4px. Tailwind classes map directly:
- `gap-1` = 4px, `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px, `gap-6` = 24px, `gap-8` = 32px

### Page Layout Spacing
| Context | Value |
|---------|-------|
| Page horizontal padding | `px-4 md:px-6` (16px / 24px) |
| Page vertical padding (below nav) | `py-6 md:py-8` (24px / 32px) |
| Content max-width (scroll pages) | `max-w-6xl` (1152px) |
| Section gap (between major blocks) | `space-y-8` (32px) |
| Card internal padding | `p-4 md:p-5` (16px / 20px) |
| Between form fields | `space-y-4` (16px) |

### Nav Spacing
| Element | Value |
|---------|-------|
| Nav height | `py-3` = 12px top/bottom + content = ~52px total |
| Nav horizontal padding | `px-4 md:px-6` |
| Gap between nav links | `gap-6` (24px) |
| Gap between logo and links | `ml-6` |

---

## Components

### Buttons
Three variants. No other button styles exist in this app.

**Primary** — The single call-to-action on a page
```
bg-primary text-primary-foreground font-medium text-sm px-4 py-2.5 rounded-lg
hover:brightness-110 transition-all
```

**Secondary** — Supporting actions (share, export, filter)
```
border border-border bg-card text-foreground font-medium text-sm px-4 py-2.5 rounded-lg
hover:bg-muted transition-colors
```

**Ghost** — Inline/subtle actions (cancel, clear, nav items)
```
text-muted-foreground font-medium text-sm px-3 py-2 rounded-lg
hover:text-foreground hover:bg-muted transition-colors
```

**Button sizes:**
- Default: `text-sm px-4 py-2.5`
- Small: `text-xs px-3 py-2`
- Icon-only: `size-9 flex items-center justify-center`

### Cards
One card style. Used everywhere — panels, forms, data containers.
```
rounded-xl border border-border bg-card p-4 md:p-5
```

No `.glass` on cards (that's reserved for the nav header and overlays only).

### Inputs
```
w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground
placeholder:text-muted-foreground
focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
transition-colors
```

### Section Headers (within a page)
```
<div>
  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</h2>
</div>
```

### Empty States
Consistent pattern: centered icon + heading + description + CTA
```
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
    <Icon className="size-6 text-muted-foreground" />
  </div>
  <h3 className="text-base font-medium text-foreground">{heading}</h3>
  <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
  <Button className="mt-6">{cta}</Button>
</div>
```

---

## Layout Patterns

### Pattern 1: Scroll Page (Closet, Compare, Build, Trip)
```
<div className="min-h-dvh bg-background text-foreground">
  <Nav />
  <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
    {/* Page header */}
    {/* Content */}
  </main>
</div>
```

### Pattern 2: App Shell (Pack Lab)
```
<div className="h-dvh flex flex-col bg-background text-foreground overflow-hidden">
  <Nav />
  <div className="flex-1 min-h-0 flex ...">
    {/* Sidebar + Main + Panel */}
  </div>
</div>
```

### Pattern 3: Chat/Full-Height (AI Advisor)
```
<div className="h-dvh flex flex-col bg-background text-foreground">
  <Nav />
  <main className="flex-1 flex flex-col min-h-0 max-w-3xl mx-auto w-full px-4 md:px-6">
    {/* Messages area (flex-1 overflow-y-auto) */}
    {/* Input bar (shrink-0) */}
  </main>
</div>
```

---

## Page Headers
Every scroll page starts with:
```
<div className="mb-8">
  <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
</div>
```

No icons in page titles. No badges. Clean text only.

---

## Nav Rules

- Logo: `size-8 rounded-lg bg-primary text-primary-foreground` with Mountain icon
- Brand text: `text-base font-semibold tracking-tight`
- Links: `text-[11px] font-medium uppercase tracking-[0.12em]`
- Active link: `text-primary` (no bold — weight shift causes layout jank)
- Inactive: `text-muted-foreground hover:text-foreground`
- Admin links: Only shown when `user.email === "coreyfmiller@gmail.com"`
- Mobile: slide-down panel, same link styles, same admin gating
- User indicator: username truncated, ghost-styled sign-out button
- Theme toggle: `size-9 rounded-lg border border-border`

---

## Iconography

- Library: Lucide React (exclusively)
- Default size: `size-4` (16px) for inline icons
- Page-level icons: `size-5` or `size-6`
- Empty state icons: `size-6` inside a `size-12 rounded-xl bg-muted` container
- Stroke width: default (2) — never adjusted unless in a dense data context

---

## Motion

- Transitions: `transition-colors` for hover states, `transition-all` for transforms
- Duration: CSS default (150ms) — never custom unless animation
- No page transitions (instant navigation)
- Reduced motion: all animation disabled via `prefers-reduced-motion` media query

---

## Do NOT

- Use saturated colors for large areas (only for small indicators)
- Center page titles (except chat empty state)
- Use more than one CTA button per visible section
- Mix button variants in the same row (pick one weight)
- Add shadows (this is a flat dark UI — depth comes from border + background layering)
- Use `.glass` on anything except the nav header
- Hard-code colors outside the token system (no `text-emerald-400`, no `bg-green-600`)
- Use `font-bold` on nav links (causes layout shift on active state)
