# GymFlow — Design System

> **Source of truth**: This document is derived from the codebase, not invented.
> Every value, pattern, and label was extracted from existing files.

---

## 1. Brand Identity

### Name & Positioning

| Property | Value |
|----------|-------|
| **Product name** | GymFlow |
| **Tagline** | Gym Business Operating System |
| **One-liner** | Production-grade Gym Business Operating System built for real gym owners in India |
| **Primary user** | Gym owner managing 50–200 members |
| **Primary device** | Android phone |
| **Secondary devices** | Tablet, Desktop |
| **Design philosophy** | Mobile-first, action-oriented, zero-learning-curve |
| **Market** | India (₹ INR, en-IN locale, Asia/Kolkata timezone) |

### Logo

The logo is a monochrome mark: a bold white **"G" fused into a barbell silhouette** on a black rounded-square background. It communicates gym + software without decoration.

- **File**: `apps/web/public/logo.png` (400KB, used as both logo and favicon)
- **Usage in sidebar**: 32×32px with `rounded` corners
- **Usage in mobile TopBar**: 28×28px with `rounded-md` corners

### Theme Color

```
#09090b
```

Set via `<meta name="theme-color">` in `index.html`. This is the near-black that anchors the entire brand.

---

## 2. Color System

### Design Token Architecture

Colors use **OKLCH** color space (Tailwind CSS 4) defined as CSS custom properties via `@theme` in `globals.css`. The system is achromatic for structural elements (grays-only primary palette) with semantic color applied contextually through Tailwind utility classes.

### Core Tokens

```css
@theme {
  /* ─── Surface & Text ──────────────────────────────── */
  --color-background:          oklch(1 0 0);           /* #ffffff */
  --color-foreground:          oklch(0.145 0 0);       /* #09090b */
  --color-card:                oklch(1 0 0);           /* #ffffff */
  --color-card-foreground:     oklch(0.145 0 0);       /* #09090b */
  --color-popover:             oklch(1 0 0);           /* #ffffff */
  --color-popover-foreground:  oklch(0.145 0 0);       /* #09090b */

  /* ─── Brand (achromatic black) ────────────────────── */
  --color-primary:             oklch(0.205 0 0);       /* #171717 */
  --color-primary-foreground:  oklch(0.985 0 0);       /* #fafafa */

  /* ─── Secondary & Muted ───────────────────────────── */
  --color-secondary:           oklch(0.97 0 0);        /* #f5f5f5 */
  --color-secondary-foreground:oklch(0.205 0 0);       /* #171717 */
  --color-muted:               oklch(0.97 0 0);        /* #f5f5f5 */
  --color-muted-foreground:    oklch(0.556 0 0);       /* #737373 */
  --color-accent:              oklch(0.97 0 0);        /* #f5f5f5 */
  --color-accent-foreground:   oklch(0.205 0 0);       /* #171717 */

  /* ─── Semantic ────────────────────────────────────── */
  --color-destructive:         oklch(0.577 0.245 27.325);  /* #ef4444 */
  --color-success:             oklch(0.577 0.194 149.214); /* #22c55e */
  --color-warning:             oklch(0.681 0.162 75.834);  /* #eab308 */
  --color-info:                oklch(0.577 0.194 243.071); /* #3b82f6 */

  /* ─── Borders & Inputs ────────────────────────────── */
  --color-border:              oklch(0.922 0 0);       /* #e5e5e5 */
  --color-input:               oklch(0.922 0 0);       /* #e5e5e5 */
  --color-ring:                oklch(0.708 0 0);       /* #a3a3a3 */

  /* ─── Chart Palette ───────────────────────────────── */
  --color-chart-1:             oklch(0.646 0.222 41.116);  /* warm orange-red */
  --color-chart-2:             oklch(0.6 0.118 184.714);   /* teal */
  --color-chart-3:             oklch(0.398 0.07 227.392);  /* dark blue-gray */
  --color-chart-4:             oklch(0.828 0.189 84.429);  /* gold */
  --color-chart-5:             oklch(0.769 0.188 70.08);   /* sandy orange */

  /* ─── Sidebar ─────────────────────────────────────── */
  --color-sidebar-background:  oklch(0.985 0 0);       /* #fafafa */
  --color-sidebar-foreground:  oklch(0.145 0 0);       /* #09090b */
  --color-sidebar-primary:     oklch(0.205 0 0);       /* #171717 */
  --color-sidebar-accent:      oklch(0.97 0 0);        /* #f5f5f5 */
  --color-sidebar-border:      oklch(0.922 0 0);       /* #e5e5e5 */
}
```

### Contextual Color Usage

Colors are **never** applied via tokens for semantic meaning — they are applied directly via Tailwind utility classes. This table documents every contextual color mapping used across the app:

| Context | Background | Text | Where Used |
|---------|-----------|------|------------|
| **Revenue** | `bg-green-50/80`, `bg-green-100` | `text-green-700` | Dashboard metric, payment icons |
| **Expenses** | `bg-red-50/80`, `bg-red-100` | `text-red-600`, `text-red-700` | Dashboard metric, expense icons |
| **Profit** | `bg-blue-50/80` | `text-blue-700` | Dashboard metric |
| **Outstanding** | `bg-orange-50/80`, `bg-orange-100` | `text-orange-600`, `text-orange-700` | Dashboard metric, outstanding items |
| **New Members** | `bg-blue-50/80`, `bg-blue-100` | `text-blue-700` | Dashboard metric, member timeline |
| **Renewals** | `bg-purple-50/80`, `bg-purple-100` | `text-purple-700` | Dashboard metric, membership cards |
| **Payments Recorded** | `bg-emerald-50/80` | `text-emerald-700` | Dashboard metric |
| **Expenses Added** | `bg-rose-50/80` | `text-rose-600` | Dashboard metric |
| **Frozen** | `bg-sky-100` | `text-sky-700` | Freeze events in timeline |
| **Notes** | `bg-yellow-100` | `text-yellow-700` | Note events in timeline |

### Status Badge Colors

Defined in `lib/constants.ts` as `STATUS_COLORS`:

| Status | Classes | Used For |
|--------|---------|----------|
| `active` | `bg-green-100 text-green-800` | Members, memberships |
| `expired` | `bg-red-100 text-red-800` | Members, memberships |
| `frozen` | `bg-blue-100 text-blue-800` | Members, memberships |
| `inactive` | `bg-gray-100 text-gray-800` | Members |
| `cancelled` | `bg-orange-100 text-orange-800` | Memberships |
| `paid` | `bg-green-100 text-green-800` | Payments |
| `partial` | `bg-yellow-100 text-yellow-800` | Payments |
| `pending` | `bg-orange-100 text-orange-800` | Payments |
| `refunded` | `bg-purple-100 text-purple-800` | Payments |
| `draft` | `bg-gray-100 text-gray-800` | Messages |
| `scheduled` | `bg-blue-100 text-blue-800` | Messages |
| `sent` | `bg-green-100 text-green-800` | Messages |
| `failed` | `bg-red-100 text-red-800` | Messages |

### Membership Card Left-Border Colors

Memberships use a colored left border to indicate status at a glance:

| Status | Border Class |
|--------|-------------|
| `active` | `border-l-purple-500` |
| `expired` | `border-l-red-400` |
| `frozen` | `border-l-blue-500` |
| `cancelled` | `border-l-orange-400` |

### FAB Speed-Dial Colors

| Action | Color |
|--------|-------|
| Add Member | `bg-blue-600 hover:bg-blue-700` |
| Record Payment | `bg-green-600 hover:bg-green-700` |
| Add Expense | `bg-orange-600 hover:bg-orange-700` |
| Main FAB | `bg-primary` (black) |

---

## 3. Typography

### Font Stack

```css
font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

No custom/web fonts are loaded. The app relies on the OS system font for maximum performance.

### Type Scale

Derived from component usage patterns (Tailwind classes):

| Token | Size | Line-Height | Usage |
|-------|------|-------------|-------|
| `text-[10px]` | 10px | default | Micro labels (uppercase tracking), date stamps in timeline |
| `text-[10.5px]` | 10.5px | default | Trend comparison text on mobile |
| `text-[11px]` | 11px | default | Subtitles in stat cards, expiring badges |
| `text-xs` | 12px | 16px | Subtitles, descriptions, secondary text, badges, nav labels |
| `text-[13px]` | 13px | default | Mobile value text in action cards |
| `text-sm` | 14px | 20px | Body text, list items, button labels, form labels |
| `text-base` | 16px | 24px | Mobile TopBar title |
| `text-lg` | 18px | 28px | Stat card values (mobile), member name in detail |
| `text-xl` | 20px | 28px | Stat card values (desktop), coming soon title |
| `text-2xl` | 24px | 32px | Desktop page titles (H1) |

### Weight Scale

| Weight | Class | Usage |
|--------|-------|-------|
| 500 | `font-medium` | Body text, secondary labels, nav items, button text |
| 600 | `font-semibold` | Section titles, stat labels, member names, page titles |
| 700 | `font-bold` | Hero metric values, avatar initials, stat card values |

### Special Formatting

- **Tabular nums**: `tabular-nums` or `font-variant-numeric: tabular-nums` applied to all monetary values and counts for aligned digits
- **Truncation**: `truncate` class on member names, plan names, and any constrained text
- **Uppercase tracking**: `uppercase tracking-wider` on micro-labels like "Total Paid", "Outstanding", etc.
- **Whitespace**: `whitespace-nowrap` on monetary values to prevent wrapping

---

## 4. Spacing & Layout

### Border Radii

```css
--radius-sm: 0.25rem;   /* 4px  — small inputs, mini badges */
--radius-md: 0.375rem;  /* 6px  — buttons, default elements */
--radius-lg: 0.5rem;    /* 8px  — cards, sections, inputs */
--radius-xl: 0.75rem;   /* 12px — metric cards on mobile */
```

Additional radius patterns used in code:
- `rounded-full` (9999px) — avatars, status badges, FAB buttons, icon containers
- `rounded-2xl` (16px) — metric cards on desktop
- `rounded-t-2xl` (16px) — mobile filter panel (sheet top)

### Page Spacing

| Context | Mobile | Desktop |
|---------|--------|---------|
| Page padding | `p-4` (16px) | `p-6` (24px) |
| Page bottom padding | `pb-24` (96px, for bottom nav clearance) | `pb-6` (24px) |
| Section gap | `space-y-5` (20px) | `space-y-5` (20px) |
| Card internal padding | `p-3` (12px) | `p-4` (16px) |
| Grid gap | `gap-3` (12px) | `gap-4` (16px) |

### Layout Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | `< 768px` | Bottom nav + TopBar + FAB |
| Desktop | `≥ 768px` (md:) | Persistent sidebar (240px) + desktop header |

### Shell Structure

```
┌─────────────────────────────────────────┐
│ flex h-screen bg-background             │
├──────────┬──────────────────────────────┤
│ Sidebar  │ main (flex-1, overflow-y)    │
│ 240px    │ ┌── TopBar (mobile) ──────┐  │
│ hidden   │ ├── PageHeader ───────────┤  │
│ on       │ │   Content area          │  │
│ mobile   │ │   (p-4/p-6)             │  │
│          │ └── BottomNav (mobile) ───┘  │
└──────────┴──────────────────────────────┘
```

### Grid Patterns

| Context | Mobile | Desktop |
|---------|--------|---------|
| Dashboard metrics | `grid-cols-2` | `grid-cols-4` (via `lg:`) |
| Member overview stats | `grid-cols-4` | `grid-cols-4` |
| Member detail info | `grid-cols-2` | `grid-cols-4` |
| Recent activity | stacked | `grid-cols-2` |
| Reports hub | `grid-cols-2` | `grid-cols-2` |
| Settings hub | stacked | stacked |

---

## 5. Iconography

### Icon Library

**Lucide React** (`lucide-react`) — a fork of Feather Icons. All icons are outlined/stroked, not filled.

### Icon Sizing

| Context | Size | Class |
|---------|------|-------|
| Inline with text | 14px | `h-3.5 w-3.5` |
| Standard UI | 16px | `h-4 w-4` |
| Navigation | 20px | `h-5 w-5` |
| Empty state / Coming soon | 24px | `h-6 w-6` |
| Coming soon hero | 32px | `h-8 w-8` |
| FAB main | 24px | `h-6 w-6` |
| FAB action | 20px | `h-5 w-5` |

### Icon Containers

Icons are typically placed inside circular containers:

| Context | Container Size | Container Style |
|---------|---------------|-----------------|
| Action card (list item) | 36px | `h-9 w-9 rounded-full` + colored bg |
| Quick action button | 44px | `h-11 w-11 rounded-full` |
| Stat card (dashboard) | 32px | `h-8 w-8 rounded-md` + colored bg |
| Metric card (dashboard) | ~1.5em | `rounded-full bg-white/90 shadow-sm` |
| Empty state | 48px | `h-12 w-12 rounded-full bg-muted` |
| Coming soon | 64px | `h-16 w-16 rounded-full bg-muted` |
| FAB action | 48px | `h-12 w-12 rounded-full` + colored bg |
| FAB main | 56px | `h-14 w-14 rounded-full bg-primary` |
| Timeline dot | 24px | `h-6 w-6 rounded-full` + colored bg |

### Module Icon Mapping

| Module | Icon | Component |
|--------|------|-----------|
| Dashboard | `LayoutDashboard` | Navigation |
| Members | `Users` | Navigation, lists |
| Memberships | `CreditCard` | Navigation, lists |
| Payments | `Wallet` | Navigation, FAB |
| Expenses | `Receipt` | Navigation, FAB, lists |
| Reports | `BarChart3` | Navigation |
| Settings | `Settings` | Navigation |
| Notifications | `Bell` | Navigation, TopBar |
| Messages | `MessageSquare` | Navigation (soon) |
| Leads | `UserPlus` | Navigation (soon) |

### Action Icon Mapping

| Action | Icon |
|--------|------|
| Add member | `UserPlus` |
| Record payment | `Wallet` |
| Add expense | `Receipt` |
| Renew | `RefreshCw` |
| Freeze | `Snowflake` |
| Activate | `Play` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Search | `Search` |
| Filter | `Filter` |
| Sort | `ArrowUpDown` |
| Back | `ArrowLeft` |
| More | `MoreHorizontal` |
| Close | `X` |
| Check | `Check` |
| Logout | `LogOut` |
| Trending up | `TrendingUp` |
| Trending down | `TrendingDown` |
| Alert | `AlertCircle` / `AlertTriangle` |
| Clock / Timer | `Clock` / `CalendarClock` |
| Calendar | `CalendarDays` |
| Arrow (timeline) | `ArrowRight` |
| Arrow (trend) | `ArrowUp` / `ArrowDown` |
| Chevron (drill-in) | `ChevronRight` |
| Plus (FAB) | `Plus` |
| Indian Rupee | `IndianRupee` |

---

## 6. Component Catalog

### Primitives (`components/ui/`)

#### Button

CVA-based with 6 variants and 4 sizes:

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | Black bg, white text | Primary actions (Save, Apply) |
| `destructive` | Red bg, white text | Delete, void |
| `outline` | White bg, border, hover gray | Secondary actions (Edit, Export) |
| `secondary` | Light gray bg | Tertiary actions |
| `ghost` | Transparent, hover gray | Icon buttons in toolbars |
| `link` | Underline on hover | Inline text links |

| Size | Height | Padding |
|------|--------|---------|
| `default` | 40px (`h-10`) | `px-4 py-2` |
| `sm` | 36px (`h-9`) | `px-3` |
| `lg` | 44px (`h-11`) | `px-8` |
| `icon` | 40×40px | — |

#### Badge

7 variants, all `rounded-full`:

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | Black bg, white text | Primary badges |
| `secondary` | Gray bg | "Soon" badges in nav |
| `destructive` | Red bg/10, red text | Attention counts |
| `outline` | Border only | Generic |
| `success` | Green bg | Success states |
| `warning` | Yellow bg | Warning states |
| `info` | Blue bg | Info states |

#### Card

Compound component: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

- Base: `rounded-lg border bg-card text-card-foreground shadow-sm`
- Header padding: `p-6`
- Content padding: `p-6 pt-0`

#### Sheet (Mobile Bottom Sheet)

Used for "More" menu and mobile forms. Slides up from bottom.

#### Skeleton

`animate-pulse rounded-md bg-muted` — used extensively for loading states.

---

### Shared Components (`components/shared/`)

#### PageHeader

Dual-render pattern:
- **Mobile**: Renders `TopBar` (sticky `h-14` header with logo/back, title, bell icon, and optional actions)
- **Desktop**: Renders `h1` in a bordered header with subtitle and actions

#### StatCard

Metric display card with:
- Icon pip (top-right, `h-8 w-8 rounded-md`)
- Label (`text-xs font-medium text-muted-foreground`)
- Value (`text-lg/xl font-bold`)
- Optional subtitle, trend indicator

#### MetricCard (Dashboard-specific)

Enhanced metric card with:
- Circular white icon container with colored icon
- Large bold value with compact mobile variant
- Label below value
- Period-over-period trend with directional arrow

#### SectionCard

Container card with:
- Header bar: title + optional count badge + optional "View All" link
- Body: arbitrary content (`p-4`)
- Bordered with `shadow-sm`, `overflow-hidden`

#### ActionCard

List item pattern:
- Left: circular icon container (`h-9 w-9 rounded-full`)
- Center: title (`text-sm font-medium`) + subtitle (`text-xs text-muted-foreground`)
- Right: value + value subtitle OR custom trailing content
- Optional: `ChevronRight` on desktop
- Interactive: `hover:bg-accent/50 active:bg-accent`

#### StatusBadge

Pill badge mapping `status` string → background/text color:
- `rounded-full px-2 py-0.5 text-xs font-semibold`
- Colors from `STATUS_COLORS` constant

#### EmptyState

Centered placeholder:
- 48px icon circle (`bg-muted`)
- Title (`text-sm font-semibold`)
- Description (`text-xs text-muted-foreground`, max-width `max-w-xs`)
- Optional CTA button

#### ErrorState

Same layout as EmptyState but with:
- `bg-destructive/10` icon circle
- `AlertTriangle` icon in `text-destructive`
- "Try Again" button

#### ComingSoonPage

Full-page placeholder for future features:
- 64px icon circle
- Title (`text-xl font-semibold`)
- Description (`text-sm text-muted-foreground`)
- "Coming Soon" pill badge (`bg-primary/10 text-primary`)

#### FloatingActionMenu (FAB)

Mobile-only speed dial:
- Main button: `h-14 w-14 rounded-full bg-primary`, bottom-right
- Positioned `bottom-20 right-4` (above BottomNav)
- Rotates 45° (×) when open
- 3 action buttons fan upward with staggered animation
- Label chips: `bg-foreground/80 text-background`
- Backdrop: `bg-black/20`

#### MoneyDisplay

Formatted ₹ display with:
- Tabular nums
- Optional colored mode (green positive, red negative)
- Three sizes: `sm` (14px), `md` (16px), `lg` (20px)

#### QuickActionButton

Compact shortcut button:
- Circular icon (`h-11 w-11 rounded-full`)
- Label below (`text-xs font-medium`)
- Vertical stack layout

#### LoadingSkeleton Patterns

Pre-composed skeleton layouts:
- `StatCardSkeleton`: 2×2 (mobile) / 4-col (desktop) grid of card skeletons
- `ListSkeleton`: Repeated avatar + text line pairs
- `SectionSkeleton`: Header + list skeleton
- `DashboardSkeleton`: Full page skeleton combining all above

---

### Layout Components (`components/layout/`)

#### AppLayout

Root layout wrapping all authenticated pages:
- `flex h-screen bg-background` container
- Sidebar (desktop) + main content area + BottomNav (mobile) + MoreSheet

#### Sidebar (Desktop only, `md:flex`)

- Width: 240px (`md:w-60`)
- Three sections: Logo header (h-14) → scrollable nav → user section (pinned bottom)
- Nav items: icon + label + optional "Soon" badge or unread count
- Active state: `bg-accent text-accent-foreground font-medium`
- Hover: `hover:bg-accent hover:text-accent-foreground`
- Divider between primary and secondary nav groups
- User section: avatar circle (initials) + name/role + logout button

#### BottomNav (Mobile only, `md:hidden`)

- Fixed bottom, `h-14`, above safe area
- 5 items: Home, Members, Payments, Expenses, More
- Active: `text-primary font-medium`
- Inactive: `text-muted-foreground`
- Icon (20px) + label (text-xs) stacked vertically

#### TopBar (Mobile only, `md:hidden`)

- Sticky top, `h-14`, `z-30`
- Left: Logo (or back arrow for sub-pages)
- Center: Page title (`text-base font-semibold`, truncated)
- Right: Notification bell (with unread badge) + optional actions

#### MoreSheet

Bottom sheet listing additional nav items:
- Items with icon + label + optional "Soon" badge
- Padding: `px-3 py-3` per item

---

## 7. Interaction Patterns

### Hover & Active States

| Element | Hover | Active |
|---------|-------|--------|
| Buttons (default) | `bg-primary/90` | — |
| Buttons (outline) | `bg-accent text-accent-foreground` | — |
| Cards / List items | `bg-accent/50` | `bg-accent` |
| Nav items | `bg-accent text-accent-foreground` | — |
| Links | `underline` | — |

### Focus States

All interactive elements use:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Transitions

- Default: `transition-colors` (150ms)
- FAB rotation: `transform 250ms ease-in-out`
- FAB expansion: `transition-all duration-200` with staggered delays (50ms intervals)
- FAB scale: `active:scale-90`

### Disabled States

```
disabled:pointer-events-none disabled:opacity-50
```

### Loading States

1. **Skeleton screens**: Full layout skeletons matching content shape
2. **Inline pulse**: `animate-pulse` on text (e.g., "Updating..." in dashboard)
3. **Button pending**: `isPending` disables button

### Mobile Filter Panel

- Overlay: `bg-black/20`, full-screen
- Panel: slides up from bottom, `rounded-t-2xl`, `max-height: 70vh`
- Radio-style status selection with filled circles
- Apply button at bottom

### Pagination

Simple Previous/Next pattern:
- Two outline buttons
- "Page X of Y (Z items)" text
- Disabled when at bounds

---

## 8. Data Formatting

### Currency

```typescript
// Standard format
formatMoney("3500.00") → "₹3,500.00"   // en-IN locale, 2 decimal places

// Compact format (for mobile metric cards)
formatCompactMoney("150000") → "₹1.50L" // Lakhs notation for ≥1L
formatCompactMoney("1200000") → "₹12.0L"
```

### Dates

```typescript
// Standard date
formatDate("2025-06-05") → "5 Jun 2025"  // en-IN: day month-short year

// Relative date
formatRelativeDate("2025-06-11") → "Today"
formatRelativeDate("2025-06-10") → "Yesterday"
formatRelativeDate("2025-06-06") → "5 days ago"
formatRelativeDate("2025-05-01") → "1 May 2025"  // Falls back to standard
```

### Phone Numbers

```typescript
formatPhone("+919876543210") → "+91-98765-43210"   // Indian mobile format
formatPhone("9876543210")    → "+91-98765-43210"   // Auto-prefix +91
```

### Dashboard Greeting

```typescript
todayLabel() → "Wednesday, 11 June 2025"  // en-IN: weekday, day month year
```

Title: `"Hi, {firstName}"` (first word of user name)

---

## 9. Content Patterns

### Navigation Labels

**Primary**: Dashboard, Members, Memberships, Payments, Expenses, Reports
**Secondary**: Settings, Notifications, Messages (Soon), Leads (Soon)

### Dashboard Labels

**Metrics**: Revenue, Expenses, Profit, Outstanding, New Members, Renewals, Payments Recorded, Expenses Added
**Ranges**: Today, Last 7 Days, Last 30 Days
**Comparisons**: vs Yesterday, vs Prev 7 Days, vs Prev 30 Days
**Sections**: Activity Summary, Attention Required, Outstanding Balances, Recent Payments, Recent Expenses, Members

### Action Labels

| Action | Label | Context |
|--------|-------|---------|
| Create member | Add Member | FAB, empty states |
| Create payment | Record Payment | FAB, member detail |
| Create expense | Add Expense | FAB |
| Renew membership | Renew | Dashboard, member detail |
| Collect payment | Pay | Outstanding section |
| Freeze membership | Freeze | Member detail |
| Unfreeze | Unfreeze | Membership detail |
| Activate member | Activate | Member detail |
| Apply filters | Apply Filters | Filter panel |
| Clear filters | Clear all | Filter chips |
| Export data | Export CSV / Export XLSX | Reports |
| Sign in | Sign In | Login page |
| Sign out | Logout | Sidebar, settings |
| Retry | Try Again | Error states |

### Empty State Copy

| Screen | Headline | Description |
|--------|----------|-------------|
| Members | No members yet | Add your first gym member to get started |
| Payments | No payments yet | Payments will appear here as they're recorded |
| Expenses | No expenses yet | Track your gym expenses to monitor profitability |
| Memberships | No memberships yet | Memberships are created from a member's profile |
| Expiring | All clear! | No memberships expiring in the next 7 days |
| Outstanding | No outstanding dues | All members are paid up. Great job! |
| Timeline | No activity yet | Activity will appear here as actions are taken |

### Error State Copy

| Context | Title | Message |
|---------|-------|---------|
| Default | Something went wrong | We couldn't load this data. Please try again. |
| Dashboard | Couldn't load dashboard | Check your internet connection and try again. |
| Memberships | Couldn't load memberships | (default message) |
| Timeline | Couldn't load timeline | (default message) |
| Activity | Couldn't load activity | (default message) |
| Outstanding | Couldn't load outstanding balances | (default message) |
| Expiring | Couldn't load expiring memberships | (default message) |

### Coming Soon Copy

| Feature | Description |
|---------|-------------|
| Message History | View delivery history for all messages sent to your members. Track WhatsApp, SMS, and email notifications. |
| Message Templates | Create reusable message templates with variables like member name, plan, and expiry date. |
| Scheduled Messages | Schedule bulk messages for festivals, promotions, and reminders to your members. |
| Notifications | Get real-time notifications for important events like new memberships, payments, and expirations. |
| Lead Management | Track potential members from inquiry to enrollment. Manage follow-ups and conversion. |

---

## 10. Scrollbar Customization

```css
/* Thin scrollbar on desktop */
* {
  scrollbar-width: thin;
  scrollbar-color: oklch(0.8 0 0) transparent;
}

*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background-color: oklch(0.82 0 0); border-radius: 9999px; }
*::-webkit-scrollbar-thumb:hover { background-color: oklch(0.7 0 0); }

/* Hidden on mobile — rely on native momentum scroll */
@media (max-width: 767px) {
  * { scrollbar-width: none; }
  *::-webkit-scrollbar { display: none; }
}
```

---

## 11. Domain Terminology

### Entities

| Term | Definition |
|------|-----------|
| **Gym** | The tenant organization (single-tenant per database) |
| **Member** | A gym member (customer) — not a user of the software |
| **User** | A staff member who logs into GymFlow (owner, receptionist, trainer) |
| **Membership Plan** | A template defining duration and price (Monthly, Quarterly, etc.) |
| **Membership** | An assigned instance of a plan to a member, with dates and payment tracking |
| **Payment** | A financial transaction recording money received from a member |
| **Expense** | A financial transaction recording money spent by the gym |
| **Freeze** | A pause on a membership, extending the end date by frozen duration |
| **Receipt Number** | Auto-generated payment identifier, format: `{GYM-SLUG}-{NNNNNN}` |

### Statuses

| Entity | Possible Statuses |
|--------|------------------|
| Member | `active`, `expired`, `inactive`, `frozen` |
| Membership | `active`, `expired`, `cancelled`, `frozen` |
| Payment | `paid`, `partial`, `pending`, `refunded` |
| Freeze | `active`, `completed`, `cancelled` |
| Notification | `pending`, `sent`, `failed` |
| User Role | `owner`, `receptionist`, `trainer` |

### Payment Methods

`cash`, `upi`, `card`, `bank_transfer`

Display labels: Cash, UPI, Card, Bank Transfer

### Membership Plans (from seed data)

| Plan | Duration | Price |
|------|----------|-------|
| Monthly | 30 days | ₹1,500 |
| Quarterly | 90 days | ₹4,000 |
| Half-Yearly | 180 days | ₹7,000 |
| Annual | 365 days | ₹12,000 |

### Expense Categories (from seed data)

Rent, Electricity, Water, Salaries, Equipment, Maintenance, Marketing, Supplements, Cleaning, Insurance, Miscellaneous

---

## 12. Design Principles

These are not aspirational — they are observed patterns in the existing codebase.

### 1. Numbers Over Charts

The dashboard uses no charts, no graphs, no visualizations. Just bold numbers with trend arrows. The spec explicitly states: _"No charts. Just numbers."_

### 2. Action at Point of Need

Every data item has inline actions:
- Expiring membership → "Renew" button right there
- Outstanding balance → "Pay" button right there
- Member detail → "Record Payment" button right there

### 3. Status at a Glance

Color-coded pills, colored borders, and urgency grouping (today → 3 days → 7 days) make status scannable without reading.

### 4. Skeleton-First Loading

Every page has a purpose-built skeleton that matches the content layout. No spinners. No blank pages.

### 5. Mobile-First, Desktop-Enhanced

All layouts are designed for mobile first, then enhanced (never hidden) for desktop. Mobile bottom nav becomes sidebar. Mobile TopBar becomes inline header.

### 6. Consistent Density

Cards use compact padding on mobile (`p-3`) and slightly more breathing room on desktop (`p-4`). Text never gets bigger for desktop — only the grid gets wider.

### 7. Progressive Disclosure

- "More" sheet hides secondary navigation
- Filter panel is a slide-up overlay, not inline controls
- Speed-dial FAB reveals actions on demand
