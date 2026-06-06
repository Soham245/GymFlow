# GymFlow Frontend — Product & UX Specification

> **Status:** APPROVED — Implementation in progress.
> **Approved with changes:** Quick Add FAB, enhanced dashboard, payment access points, global search, reserved routes (notifications, leads).
> **Primary user:** Gym owner (50-200 members)
> **Primary device:** Android phone | Secondary: Tablet | Tertiary: Desktop
> **Design philosophy:** Mobile-first, action-oriented, zero-learning-curve

---

## SECTION 1 — Navigation Structure

### Mobile (< 768px) — Bottom Tab Bar + Hamburger

The bottom tab bar shows the 5 most-used modules. Everything else lives behind a "More" menu.

```
┌─────────────────────────────────────────┐
│                                         │
│              PAGE CONTENT               │
│                                         │
│                                         │
├─────┬─────┬─────┬─────┬─────┬─────────┤
│  🏠 │ 👥  │ 💰  │ 📊  │ ⋯   │         │
│Home │Mbrs │Pay  │Rpts │More │         │
└─────┴─────┴─────┴─────┴─────┴─────────┘
```

**Bottom tabs (always visible):**

| Position | Icon | Label | Route |
|----------|------|-------|-------|
| 1 | Home | Home | `/` |
| 2 | Users | Members | `/members` |
| 3 | Wallet | Payments | `/payments` |
| 4 | BarChart3 | Reports | `/reports` |
| 5 | MoreHorizontal | More | Opens sheet |

**"More" sheet (slides up from bottom):**

| Item | Route | Available |
|------|-------|-----------|
| Memberships | `/memberships` | Now |
| Expenses | `/expenses` | Now |
| Settings | `/settings` | Now |
| Notifications | `/notifications` | Coming Soon |
| Messages | `/messages` | Coming Soon |
| Leads | `/leads` | Coming Soon |

### Global Quick Add FAB (Mobile)

A floating action button visible on all list/hub pages (not on detail/form pages). Tapping opens a speed-dial with 3 actions:

| Action | Icon | Opens |
|--------|------|-------|
| Add Member | UserPlus | Create Member sheet |
| Record Payment | Wallet | Record Payment sheet |
| Add Expense | Receipt | Create Expense sheet |

The FAB sits above the bottom nav bar (bottom-right, 72px from bottom). Speed-dial items fan upward. Tapping outside closes the speed-dial.

### Tablet (768px - 1024px) — Collapsible Side Rail

A narrow icon rail on the left (56px) that expands to a full sidebar (240px) on tap. Same items as mobile but vertically stacked.

```
┌──┬──────────────────────────────────┐
│🏠│                                  │
│👥│         PAGE CONTENT             │
│🎫│                                  │
│💰│                                  │
│📦│                                  │
│📊│                                  │
│──│                                  │
│⚙│                                  │
│✉│                                  │
└──┴──────────────────────────────────┘
```

**Rail items:**

| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Dashboard | `/` |
| Users | Members | `/members` |
| CreditCard | Memberships | `/memberships` |
| Wallet | Payments | `/payments` |
| Receipt | Expenses | `/expenses` |
| BarChart3 | Reports | `/reports` |
| --- | --- (divider) | --- |
| Settings | Settings | `/settings` |
| Bell | Notifications | `/notifications` |
| MessageSquare | Messages | `/messages` |
| UserPlus | Leads | `/leads` |

### Desktop (> 1024px) — Persistent Sidebar

Full sidebar always visible (240px). Same items as tablet rail but with text labels always shown. Page content takes remaining width.

```
┌────────────┬────────────────────────────────────────────┐
│ GYMFLOW    │  Page Title              [Search] [Avatar] │
│            ├────────────────────────────────────────────│
│ Dashboard  │                                            │
│ Members    │              PAGE CONTENT                  │
│ Memberships│                                            │
│ Payments   │                                            │
│ Expenses   │                                            │
│ Reports    │                                            │
│            │                                            │
│ ────────── │                                            │
│ Settings   │                                            │
│ Messages   │                                            │
│            │                                            │
│ ────────── │                                            │
│ Rahul S.   │                                            │
│ Owner      │                                            │
└────────────┴────────────────────────────────────────────┘
```

### Navigation Rules

1. Active tab/item is highlighted with primary color
2. "Messages" shows a "Soon" badge when not yet implemented
3. Settings sub-pages use a back arrow, not the sidebar
4. On mobile, page titles appear in a top app bar with optional action buttons
5. On all sizes, the current gym name appears in the sidebar/header

---

## SECTION 2 — Page Hierarchy

### Complete Route Map

```
/                           → Dashboard
/login                      → Login (public, no nav)

/members                    → Member List
/members/new                → Create Member (sheet on mobile, page on desktop)
/members/:id                → Member Detail
/members/:id/edit           → Edit Member (sheet on mobile)
/members/:id/memberships    → Membership History (tab within member detail)
/members/:id/payments       → Payment History (tab within member detail)
/members/:id/notes          → Notes (tab within member detail)

/memberships                → All Memberships (cross-member view)
/memberships/:id            → Membership Detail

/payments                   → Payment List
/payments/new               → Record Payment (sheet)
/payments/:id               → Payment Detail
/payments/:id/receipt       → PDF Receipt (download trigger)

/expenses                   → Expense List
/expenses/new               → Create Expense (sheet)
/expenses/:id               → Expense Detail
/expenses/:id/edit          → Edit Expense (sheet)

/reports                    → Reports Hub
/reports/revenue            → Revenue Report
/reports/expenses           → Expense Report
/reports/profit             → Profit Report
/reports/memberships        → Membership Report
/reports/outstanding        → Outstanding Balances

/settings                   → Settings Hub
/settings/profile           → Gym Profile
/settings/users             → Users & Roles
/settings/plans             → Membership Plans
/settings/plans/new         → Create Plan (sheet)
/settings/plans/:id         → Edit Plan (sheet)
/settings/categories        → Expense Categories
/settings/automation        → Automation Settings
/settings/exports           → Data Exports
/settings/system            → System Info

/settings/templates         → Message Templates (future)
/settings/templates/new     → Create Template (future)
/settings/templates/:id     → Edit Template (future)
/settings/scheduled         → Scheduled Messages (future)
/settings/scheduled/new     → Create Scheduled Message (future)

/messages                   → Message History (future)
/messages/:id               → Message Detail (future)

/notifications              → Notification Center (future)
/leads                      → Lead Management (future)
```

### Page Type Classification

| Type | Behavior | Examples |
|------|----------|---------|
| **List** | Paginated table/cards, search, filters, FAB for create | Members, Payments, Expenses |
| **Detail** | Full entity view with tabs, actions in header | Member Detail, Payment Detail |
| **Form** | Bottom sheet (mobile) or dialog (desktop) | Create Member, Record Payment |
| **Report** | Period selector + data cards + optional table | Revenue, Profit, Outstanding |
| **Hub** | Grid of navigation cards | Dashboard, Reports, Settings |
| **Coming Soon** | Placeholder with icon, title, description | Messages, Templates |

---

## SECTION 3 — User Journeys

### Journey 1: Morning Check-in (Daily, 30 seconds)

```
Open app → Dashboard loads automatically
  → See today's revenue, expenses, profit at a glance
  → See expiring memberships count (tap to expand)
  → See recent payments (last 5)
  → Done. Close app.
```

**Key insight:** Dashboard must load in under 2 seconds. No charts. Just numbers.

### Journey 2: Register a Walk-in Member (2-3 minutes)

```
Dashboard → Tap "Members" tab
  → Tap FAB (+) → Create Member sheet slides up
  → Fill: Name, Phone (required). Optional: email, gender, DOB
  → Tap "Save" → Member created
  → Sheet shows: "Assign Membership?" [Yes] [Later]
  → Tap "Yes" → Select plan from list → Set start date
  → Tap "Assign" → Membership created
  → Sheet shows: "Record Payment?" [Yes] [Later]
  → Tap "Yes" → Amount pre-filled with outstanding
  → Select payment method (cash/upi/card/bank)
  → Tap "Save" → Payment recorded
  → Returns to Member Detail with everything linked
```

**Key insight:** The "member → membership → payment" flow must be seamless, not three separate navigations.

### Journey 3: Record a Renewal Payment (1 minute)

```
Dashboard → Tap "Payments" tab
  → Tap FAB (+) → Record Payment sheet
  → Search member by name/phone (autocomplete)
  → Select member → Their active membership auto-selects
  → Amount pre-filled with outstanding balance
  → Select payment method → Tap "Save"
  → Payment recorded. Receipt number shown.
  → [Download Receipt] button available
```

### Journey 4: Check Who's Expiring This Week (30 seconds)

```
Dashboard → See "Expiring Soon" card (shows count)
  → Tap card → Opens filtered member/membership list
  → See names, phone numbers, expiry dates
  → Tap a member → See detail → Can send renewal reminder (future)
```

### Journey 5: Log a Daily Expense (30 seconds)

```
"More" → Expenses → Tap FAB (+)
  → Select category (dropdown, e.g., Electricity)
  → Enter amount → Date defaults to today
  → Add description (optional)
  → Tap "Save" → Done
```

### Journey 6: End-of-Month Reporting (2 minutes)

```
Reports tab → See hub with 5 report cards
  → Tap "Revenue" → Period defaults to "This Month"
  → See total revenue, payment count, breakdown by method
  → Switch to "All Time" from period picker
  → Compare. Switch to "Custom" for specific dates.
  → Tap "Export" → Download CSV/Excel
```

### Journey 7: Manage Plans (Owner only, occasional)

```
"More" → Settings → Membership Plans
  → See all plans (sorted by sortOrder)
  → Tap "+" to create new plan
  → Fill: name, duration (days), price, description
  → Tap "Save"
  → Long-press or swipe a plan to reorder
  → Toggle switch to disable/enable plans
```

### Journey 8: Freeze a Membership (Occasional)

```
Members → Find member → Tap → Member Detail
  → Memberships tab → Tap active membership
  → Tap "Freeze" action → Enter freeze start date, optional end date, reason
  → Tap "Freeze" → Membership status changes to "frozen"
  → Later: Tap "Unfreeze" → Enter unfreeze date
  → End date auto-extends by frozen duration
```

---

## SECTION 4 — Mobile-First Layouts (< 768px)

### 4.1 Dashboard (Mobile)

```
┌─────────────────────────────────┐
│ Iron Paradise Gym     [Avatar]  │
├─────────────────────────────────┤
│                                 │
│  ┌──────────┐ ┌──────────┐     │
│  │ Revenue  │ │ Expenses │     │
│  │ ₹2,000   │ │ ₹0       │     │
│  │ today    │ │ today    │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │ Profit   │ │ Outstand.│     │
│  │ ₹2,000   │ │ ₹1,800   │     │
│  │ today    │ │ total    │     │
│  └──────────┘ └──────────┘     │
│                                 │
│  ┌─ Expiring Today ──── 1 ──┐ │
│  │ Deepak Patel   Monthly    │ │
│  │ Exp: Today     ₹800 due  │ │
│  └───────────────────────────┘ │
│  ┌─ Expiring in 3 Days ─ 2 ─┐ │
│  │ Amit Roy      Monthly     │ │
│  │ Exp: Jun 9    ₹500 due   │ │
│  ├───────────────────────────┤ │
│  │ Priya Menon   Quarterly   │ │
│  │ Exp: Jun 8    Paid ✓     │ │
│  └───────────────── See All ─┘ │
│  ┌─ Outstanding Balances ────┐ │
│  │ Total: ₹1,800   2 members│ │
│  │ Vikram Singh      ₹1,300 │ │
│  │ Amit Roy            ₹500 │ │
│  └───────────────── See All ─┘ │
│                                 │
│  ┌─ Recent Payments ─────────┐ │
│  │ Vikram Singh   ₹500       │ │
│  │ Card · Jun 6   #000003   │ │
│  ├───────────────────────────┤ │
│  │ Sneha Das      ₹1,500     │ │
│  │ UPI · Jun 5    #000002   │ │
│  └───────────────── See All ─┘ │
│                                 │
│  ┌─ Recent Expenses ─────────┐ │
│  │ Electricity    ₹5,200     │ │
│  │ Jun 5          Bank Xfer  │ │
│  └───────────────── See All ─┘ │
│                                 │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

### 4.2 Member List (Mobile)

```
┌─────────────────────────────────┐
│ ← Members              [🔍]    │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search by name or phone │ │
│ └─────────────────────────────┘ │
│                                 │
│ [All: 10] [Active: 6] [Expired] │
│ [Frozen] [Inactive]             │
│                                 │
│ ┌─ A ─────────────────────────┐ │
│ │ 🟢 Amit Roy                 │ │
│ │    +91-98765-43211          │ │
│ │    Monthly · Exp Jun 12     │ │
│ ├─────────────────────────────┤ │
│ │ 🟢 Ananya Gupta             │ │
│ │    +91-98765-43217          │ │
│ │    Annual · Exp Mar 2027    │ │
│ ├─ P ─────────────────────────┤ │
│ │ 🟢 Priya Menon              │ │
│ │    +91-98765-43213          │ │
│ │    Quarterly · Exp Aug 25   │ │
│ ├─────────────────────────────┤ │
│ │ 🔵 Pooja Sharma             │ │
│ │    +91-98765-43218   Frozen │ │
│ │    Monthly · Frozen Jun 1   │ │
│ └─────────────────────────────┘ │
│                                 │
│                          [+ ◉]  │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

**Design notes:**
- Status filter chips are horizontally scrollable
- First chip shows count badge
- Members grouped by first letter (alphabetical sections)
- Status dot: green=active, red=expired, blue=frozen, gray=inactive
- Each card shows: name, phone, current plan, expiry/status
- FAB (+) for creating new member
- Tap any row → Member Detail

### 4.3 Member Detail (Mobile)

```
┌─────────────────────────────────┐
│ ← Amit Roy        [⋮ Actions]  │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐   │
│  │  🟢 Active               │   │
│  │  +91-98765-43211         │   │
│  │  amit@example.com        │   │
│  │  Male · Joined Apr 2025  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌── Active Membership ──────┐  │
│  │  Monthly Plan              │  │
│  │  Jun 6 → Jul 5, 2026      │  │
│  │  ₹500 outstanding         │  │
│  │  [Record Payment]          │  │
│  │  [Renew] [Freeze]          │  │
│  └────────────────────────────┘  │
│                                 │
│ [Overview] [Memberships] [Pay.] │
│ [Notes]                         │
│─────────────────────────────────│
│                                 │
│  ┌── Timeline ────────────────┐ │
│  │ 📅 Jun 6  Payment ₹500    │ │
│  │           Card · #000003   │ │
│  │ 📅 Jun 6  Membership       │ │
│  │           Monthly assigned  │ │
│  │ 📅 Apr 15 Member Created   │ │
│  │           By Rahul Sharma   │ │
│  └────────────────────────────┘ │
│                                 │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

**Design notes:**
- Top card shows member info + status badge
- Active membership card is prominent with actions
- Tab bar below: Overview (timeline), Memberships (history), Payments, Notes
- Timeline is the default view — shows all events in reverse chronological order
- Actions menu (⋮): Edit, Change Status, Add Note

### 4.4 Create/Edit Forms (Mobile — Bottom Sheet)

```
┌─────────────────────────────────┐
│ (dimmed page behind)            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ━━━ (drag handle)           │ │
│ │                             │ │
│ │ New Member          [✕]    │ │
│ │                             │ │
│ │ Name *                      │ │
│ │ ┌───────────────────────┐   │ │
│ │ │ Vikram Singh          │   │ │
│ │ └───────────────────────┘   │ │
│ │                             │ │
│ │ Phone *                     │ │
│ │ ┌───────────────────────┐   │ │
│ │ │ +91-98765-43215       │   │ │
│ │ └───────────────────────┘   │ │
│ │                             │ │
│ │ Email                       │ │
│ │ ┌───────────────────────┐   │ │
│ │ │                       │   │ │
│ │ └───────────────────────┘   │ │
│ │                             │ │
│ │ Gender         Join Date    │ │
│ │ ┌──────────┐  ┌──────────┐ │ │
│ │ │ Male   ▾ │  │ Jun 6    │ │ │
│ │ └──────────┘  └──────────┘ │ │
│ │                             │ │
│ │ ┌───────────────────────┐   │ │
│ │ │     Save Member       │   │ │
│ │ └───────────────────────┘   │ │
│ └─────────────────────────────┘ │
```

### 4.5 Payment List (Mobile)

```
┌─────────────────────────────────┐
│ ← Payments              [🔍]   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [All] [Cash] [UPI] [Card]  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📅 Jun 1 - Jun 30          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ── Jun 6 ──────────────────── │ │
│ ┌─────────────────────────────┐ │
│ │ Vikram Singh       ₹500    │ │
│ │ Card · #000003     Partial │ │
│ ├─────────────────────────────┤ │
│ │ Vikram Singh       ₹2,000  │ │
│ │ Cash · #000001     Paid    │ │
│ └─────────────────────────────┘ │
│ ── Jun 5 ──────────────────── │ │
│ ┌─────────────────────────────┐ │
│ │ Sneha Das          ₹1,500  │ │
│ │ UPI · #000002      Paid    │ │
│ └─────────────────────────────┘ │
│                                 │
│                          [+ ◉]  │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

### 4.6 Expense List (Mobile)

```
┌─────────────────────────────────┐
│ ← Expenses                     │
├─────────────────────────────────┤
│ [This Month ▾]   Total: ₹66.7K │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [All] [Electricity] [Rent]  │ │
│ │ [Equipment] [Maintenance]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Electricity        ₹5,200  │ │
│ │ Jun 5 · Bank Xfer          │ │
│ │ June electricity bill       │ │
│ ├─────────────────────────────┤ │
│ │ Rent              ₹25,000  │ │
│ │ Jun 1 · Bank Xfer          │ │
│ │ Monthly rent                │ │
│ ├─────────────────────────────┤ │
│ │ Equipment         ₹15,000  │ │
│ │ Jun 3 · UPI                 │ │
│ │ New dumbbell set            │ │
│ └─────────────────────────────┘ │
│                                 │
│                          [+ ◉]  │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

### 4.7 Reports Hub (Mobile)

```
┌─────────────────────────────────┐
│ ← Reports                      │
├─────────────────────────────────┤
│                                 │
│  ┌──────────┐ ┌──────────┐     │
│  │ 💰       │ │ 📦       │     │
│  │ Revenue  │ │ Expenses │     │
│  │ Report   │ │ Report   │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │ 📈       │ │ 🎫       │     │
│  │ Profit   │ │ Member-  │     │
│  │ Report   │ │ ships    │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────────────────┐      │
│  │ ⚠️ Outstanding        │      │
│  │    Balances           │      │
│  └──────────────────────┘      │
│                                 │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

### 4.8 Settings Hub (Mobile)

```
┌─────────────────────────────────┐
│ ← Settings                     │
├─────────────────────────────────┤
│                                 │
│  GENERAL                        │
│  ┌─────────────────────────────┐│
│  │ 🏢  Gym Profile          → ││
│  ├─────────────────────────────┤│
│  │ 👤  Users & Roles        → ││
│  ├─────────────────────────────┤│
│  │ 🎫  Membership Plans     → ││
│  ├─────────────────────────────┤│
│  │ 📂  Expense Categories   → ││
│  └─────────────────────────────┘│
│                                 │
│  AUTOMATION                     │
│  ┌─────────────────────────────┐│
│  │ ⚡  Automation Settings   → ││
│  ├─────────────────────────────┤│
│  │ ✉️  Message Templates  Soon ││
│  ├─────────────────────────────┤│
│  │ 📅  Scheduled Messages Soon ││
│  └─────────────────────────────┘│
│                                 │
│  DATA                           │
│  ┌─────────────────────────────┐│
│  │ 📤  Data Exports          → ││
│  ├─────────────────────────────┤│
│  │ 🔧  System Info           → ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🚪  Logout                  ││
│  └─────────────────────────────┘│
│                                 │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

### 4.9 Report Detail (Mobile — Revenue Example)

```
┌─────────────────────────────────┐
│ ← Revenue Report       [Export] │
├─────────────────────────────────┤
│                                 │
│ [This Month ▾]                  │
│ Jun 1 - Jun 6, 2026            │
│                                 │
│  ┌────────────────────────────┐ │
│  │      Total Revenue         │ │
│  │       ₹2,000.00            │ │
│  │       1 payment             │ │
│  └────────────────────────────┘ │
│                                 │
│  By Payment Method              │
│  ┌────────────────────────────┐ │
│  │ Cash          ₹2,000  100%│ │
│  │ █████████████████████████ │ │
│  │ UPI           ₹0       0%│ │
│  │                           │ │
│  │ Card          ₹0       0%│ │
│  │                           │ │
│  │ Bank Transfer ₹0       0%│ │
│  └────────────────────────────┘ │
│                                 │
│  [📥 Export CSV] [📥 Export XLSX]│
│                                 │
├─────┬─────┬─────┬─────┬─────┤ │
│ Home│Mbrs │Pay  │Rpts │More │ │
└─────┴─────┴─────┴─────┴─────┘ │
```

### 4.10 Login Page (Mobile)

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         GYMFLOW                 │
│    Gym Business OS              │
│                                 │
│                                 │
│  Email                          │
│  ┌───────────────────────────┐  │
│  │ owner@ironparadise.in     │  │
│  └───────────────────────────┘  │
│                                 │
│  Password                       │
│  ┌───────────────────────────┐  │
│  │ ••••••••            [👁]  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │         Sign In           │  │
│  └───────────────────────────┘  │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

## SECTION 5 — Tablet Layouts (768px - 1024px)

### Tablet Principles

1. Side rail (56px icons) + content area
2. List-detail split view where applicable (Members: list left 40%, detail right 60%)
3. Forms open as right-side panels or dialogs (not sheets)
4. Dashboard uses 3-column stat grid instead of 2
5. Tables show more columns than mobile cards

### 5.1 Dashboard (Tablet)

```
┌──┬──────────────────────────────────────────────┐
│🏠│ Dashboard                          [Avatar]  │
│👥├──────────────────────────────────────────────│
│🎫│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│💰│  │Revenue  │ │Expenses │ │Profit   │        │
│📦│  │₹2,000   │ │₹0       │ │₹2,000   │        │
│📊│  └─────────┘ └─────────┘ └─────────┘        │
│──│  ┌─────────────────┐  ┌─────────────────┐   │
│⚙│  │Outstanding:₹1.8K│  │Expiring: 3      │   │
│  │  └─────────────────┘  └─────────────────┘   │
│  │                                              │
│  │  ┌── Recent Payments ──┐ ┌─ Recent Exp. ──┐ │
│  │  │ Vikram  ₹500  Card │ │ Electricity ₹5K│ │
│  │  │ Sneha   ₹1.5K UPI  │ │ Rent  ₹25K     │ │
│  │  │ Amit    ₹800  Cash │ │ Equipment ₹15K │ │
│  │  └────────────────────┘ └─────────────────┘ │
└──┴──────────────────────────────────────────────┘
```

### 5.2 Members List-Detail (Tablet)

```
┌──┬──────────────────┬───────────────────────────┐
│🏠│ Members     [🔍] │ Amit Roy         [Actions]│
│👥│                   │                           │
│🎫│ [Active] [All]   │ 🟢 Active                 │
│💰│                   │ +91-98765-43211           │
│📦│ 🟢 Amit Roy      │ amit@example.com           │
│📊│    Monthly       │ Male · Joined Apr 2025     │
│──│ 🟢 Ananya Gupta  │                           │
│⚙│    Annual        │ ── Active Membership ──    │
│  │ 🟢 Priya Menon   │ Monthly · Jun 6 → Jul 5   │
│  │    Quarterly     │ ₹1,300 total · ₹500 due   │
│  │ 🔵 Pooja S.      │ [Pay] [Freeze] [Renew]    │
│  │    Frozen        │                           │
│  │                   │ ── Timeline ──            │
│  │                   │ Jun 6: Payment ₹500       │
│  │                   │ Jun 6: Membership created  │
│  │                   │ Apr 15: Member created     │
│  │             [+]   │                           │
└──┴──────────────────┴───────────────────────────┘
```

---

## SECTION 6 — Desktop Layouts (> 1024px)

### Desktop Principles

1. Persistent sidebar (240px) with text labels
2. Full data tables with sorting, not cards
3. Forms open as dialogs/modals centered on screen
4. Dashboard uses 4-column stat grid
5. Maximum content width: 1200px (centered)

### 6.1 Members List (Desktop)

```
┌────────────┬─────────────────────────────────────────────────────────┐
│ GYMFLOW    │ Members                                [Search] [+ Add]│
│            ├─────────────────────────────────────────────────────────│
│ Dashboard  │ [All: 10] [Active: 6] [Expired: 2] [Frozen: 1]        │
│ Members ◀  │                                                        │
│ Memberships│ ┌──────────────────────────────────────────────────────┐│
│ Payments   │ │ Name          Phone           Plan      Status  Exp ││
│ Expenses   │ │ Amit Roy      +91-98765-43211 Monthly   Active  Jul5││
│ Reports    │ │ Ananya Gupta  +91-98765-43217 Annual    Active  Mar ││
│            │ │ Deepak Patel  +91-98765-43214 Monthly   Expired Jun1││
│ ────────── │ │ Pooja Sharma  +91-98765-43218 Monthly   Frozen  --- ││
│ Settings   │ │ Priya Menon   +91-98765-43213 Quarterly Active  Aug ││
│ Messages   │ │ Sneha Das     +91-98765-43216 Annual    Active  Jun ││
│            │ └──────────────────────────────────────────────────────┘│
│ ────────── │                                                        │
│ Rahul S.   │ Showing 1-6 of 10            [← 1 2 →]               │
│ Owner      │                                                        │
└────────────┴─────────────────────────────────────────────────────────┘
```

### 6.2 Reports (Desktop)

Uses the same layout but with wider period selector and inline export buttons. Report data tables can show more columns.

---

## SECTION 7 — Empty States

Every list/collection screen has a designed empty state with:
1. A relevant illustration or icon (64px, muted)
2. A headline (bold, what's empty)
3. A description (1 sentence, what to do)
4. A CTA button (primary action)

| Screen | Icon | Headline | Description | CTA |
|--------|------|----------|-------------|-----|
| Members | Users | No members yet | Add your first gym member to get started | + Add Member |
| Payments | Wallet | No payments recorded | Record a payment when a member pays | + Record Payment |
| Expenses | Receipt | No expenses tracked | Start tracking your gym expenses | + Add Expense |
| Memberships | CreditCard | No memberships | Assign a membership plan to a member | Go to Members |
| Plans | ClipboardList | No plans created | Create membership plans your members can subscribe to | + Create Plan |
| Notes | StickyNote | No notes | Add notes about this member | + Add Note |
| Expense Categories | FolderOpen | No categories | Create categories to organize expenses | + Add Category |
| Reports (no data) | BarChart3 | Not enough data | Reports will appear once you have payments and expenses | Go to Dashboard |
| Member Timeline | Clock | No activity yet | Activity will appear as events occur | — |
| Message Templates | MessageSquare | Coming Soon | Automated messaging will be available in a future update | — |
| Scheduled Messages | Calendar | Coming Soon | Schedule messages to your members in a future update | — |
| Message History | History | Coming Soon | Message delivery history will be available soon | — |

---

## SECTION 8 — Loading States

### Strategy: Skeleton + Stale-While-Revalidate

1. **First load**: Show skeleton shimmer placeholders matching the content shape
2. **Subsequent loads**: Show stale cached data immediately (via TanStack Query cache), refresh in background
3. **Mutations**: Optimistic updates where safe (toggle switches, status changes), pessimistic for creates/deletes

### Skeleton Patterns

| Component | Skeleton |
|-----------|----------|
| Stat Card | Gray rectangle (height matches card), pulsing |
| List Item | 3 lines of varying width gray bars, pulsing |
| Data Table Row | Full-width gray bars matching column layout |
| Member Detail Header | Circle (avatar) + 2 gray bars |
| Tab Content | 3 skeleton list items |
| Form (sheet) | No skeleton — show immediately with empty fields |

### Loading Indicators

| Action | Indicator |
|--------|-----------|
| Page navigation | Skeleton (first) or cached data (subsequent) |
| Pull-to-refresh | Native pull-to-refresh spinner (mobile) |
| Form submission | Button shows spinner, disables. No page skeleton. |
| Delete/void action | Button shows spinner inside confirmation dialog |
| Export download | Toast: "Preparing export..." → "Downloaded!" |
| Search/filter | Debounce 300ms → inline spinner in search field |

---

## SECTION 9 — Error States

### Error Categories

| Category | Where | Display |
|----------|-------|---------|
| **Network error** | Any API call | Toast (top, red): "Connection failed. Check your internet." + Retry button |
| **Auth expired** | 401 response | Auto-redirect to login. Toast: "Session expired. Please login again." |
| **Forbidden** | 403 response | Inline alert: "You don't have permission to do this." |
| **Not found** | 404 on detail page | Full-page: "Not found" with back button |
| **Validation** | Form submission 400 | Inline field errors below each invalid field (red text) |
| **Conflict** | 409 on create | Toast: "A member with this phone already exists." |
| **Rate limit** | 429 response | Toast: "Too many requests. Wait a moment." |
| **Server error** | 500 response | Toast: "Something went wrong. Try again." + error ID for support |

### Error Recovery

1. **Toast errors**: Auto-dismiss after 5 seconds, manual dismiss with X
2. **Network errors**: Show retry button. On retry, re-execute the failed request.
3. **Form errors**: Keep form open with values preserved. Highlight invalid fields.
4. **Fatal errors**: Show error boundary page with "Reload App" button.

### Error Boundary Page

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│          ⚠️                      │
│                                 │
│    Something went wrong         │
│                                 │
│    The app encountered an       │
│    unexpected error.            │
│                                 │
│    ┌───────────────────────┐    │
│    │     Reload App        │    │
│    └───────────────────────┘    │
│                                 │
│    Error: [collapsed details]   │
│                                 │
└─────────────────────────────────┘
```

---

## SECTION 10 — Permission States

### Role Matrix (from backend)

| Feature | Owner | Receptionist | Trainer |
|---------|-------|-------------|---------|
| Dashboard | Full | Full | Read-only |
| Members: View | ✅ | ✅ | ✅ |
| Members: Create/Edit | ✅ | ✅ | ❌ |
| Members: Change Status | ✅ | ✅ | ❌ |
| Members: Notes | ✅ | ✅ | ❌ |
| Plans: View | ✅ | ✅ | ✅ |
| Plans: Create/Edit/Toggle | ✅ | ❌ | ❌ |
| Memberships: View | ✅ | ✅ | ✅ |
| Memberships: Create/Renew/Freeze | ✅ | ✅ | ❌ |
| Payments: View | ✅ | ✅ | ✅ |
| Payments: Create | ✅ | ✅ | ❌ |
| Expenses: View | ✅ | ✅ | ✅ |
| Expenses: Create/Edit | ✅ | ✅ | ❌ |
| Expense Categories: Manage | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ |
| Exports | ✅ | ✅ | ✅ |
| Automation | ✅ | ❌ | ❌ |
| Settings: Gym Profile | ✅ | ❌ | ❌ |
| Settings: Users & Roles | ✅ | ❌ | ❌ |
| Settings: Plans | ✅ | ❌ | ❌ |

### UI Behavior by Permission

1. **Hidden elements**: FAB (+) and create buttons are hidden for unauthorized roles (not disabled — hidden). This avoids confusion.
2. **Hidden nav items**: Settings sub-pages that require owner role don't show in nav for non-owners.
3. **Read-only mode**: If a user can view but not edit, edit buttons are hidden. Detail pages show data without action buttons.
4. **Trainer experience**: Trainers see a simplified nav — Dashboard, Members (read-only), and Reports. No Settings, no Expenses management, no Payments creation.
5. **Permission check**: The `useAuth()` hook provides `user.role`. A `usePermission(action)` hook returns boolean. A `<Can action="members:create">` wrapper component conditionally renders children.

---

## SECTION 11 — Technical Architecture

### 11.1 Folder Structure

```
apps/web/
  src/
    main.tsx                    # Entry point
    App.tsx                     # Router + providers
    
    api/                        # API client layer
      client.ts                 # Axios instance + interceptors
      endpoints.ts              # All endpoint URL constants
      types.ts                  # API response types
      
    hooks/                      # Shared hooks
      use-auth.ts               # Auth state + login/logout
      use-permission.ts         # Role-based permission checks
      use-debounce.ts           # Debounced values
      use-mobile.ts             # Responsive breakpoint detection
      
    features/                   # Feature modules
      auth/
        pages/
          LoginPage.tsx
        hooks/
          use-login.ts          # useMutation for login
        
      dashboard/
        pages/
          DashboardPage.tsx
        components/
          StatCard.tsx
          ExpiringMemberships.tsx
          RecentPayments.tsx
          RecentExpenses.tsx
        hooks/
          use-dashboard.ts      # useQuery for dashboard data
          
      members/
        pages/
          MemberListPage.tsx
          MemberDetailPage.tsx
        components/
          MemberCard.tsx
          MemberForm.tsx
          MemberTimeline.tsx
          MemberFilters.tsx
        hooks/
          use-members.ts        # useQuery list + search
          use-member.ts         # useQuery single + mutations
          use-member-notes.ts
          
      memberships/
        pages/
          MembershipListPage.tsx
          MembershipDetailPage.tsx
        components/
          MembershipCard.tsx
          AssignMembershipForm.tsx
          FreezeForm.tsx
          RenewForm.tsx
        hooks/
          use-memberships.ts
          use-membership-actions.ts
          
      payments/
        pages/
          PaymentListPage.tsx
          PaymentDetailPage.tsx
        components/
          PaymentCard.tsx
          RecordPaymentForm.tsx
          PaymentFilters.tsx
        hooks/
          use-payments.ts
          use-record-payment.ts
          
      expenses/
        pages/
          ExpenseListPage.tsx
          ExpenseDetailPage.tsx
        components/
          ExpenseCard.tsx
          ExpenseForm.tsx
          ExpenseFilters.tsx
        hooks/
          use-expenses.ts
          use-expense-categories.ts
          
      reports/
        pages/
          ReportsHubPage.tsx
          RevenueReportPage.tsx
          ExpenseReportPage.tsx
          ProfitReportPage.tsx
          MembershipReportPage.tsx
          OutstandingBalancesPage.tsx
        components/
          PeriodSelector.tsx
          ReportCard.tsx
          BalanceTable.tsx
        hooks/
          use-report.ts         # Generic report hook with period
          use-outstanding.ts
          
      settings/
        pages/
          SettingsHubPage.tsx
          GymProfilePage.tsx
          UsersPage.tsx
          PlansPage.tsx
          CategoriesPage.tsx
          AutomationPage.tsx
          ExportsPage.tsx
          SystemInfoPage.tsx
        components/
          PlanCard.tsx
          PlanForm.tsx
          CategoryForm.tsx
          UserCard.tsx
        hooks/
          use-plans.ts
          use-gym-profile.ts
          
      messages/                 # Future — placeholder pages only
        pages/
          ComingSoonPage.tsx     # Reused for templates, scheduled, history
          
    components/                 # Shared UI components
      layout/
        AppLayout.tsx           # Shell with nav + content area
        Sidebar.tsx             # Desktop/tablet sidebar
        BottomNav.tsx           # Mobile bottom tabs
        TopBar.tsx              # Mobile top app bar
        MoreSheet.tsx           # Mobile "More" menu
        
      ui/                       # Shadcn components (auto-generated)
        button.tsx
        input.tsx
        dialog.tsx
        sheet.tsx
        card.tsx
        badge.tsx
        table.tsx
        tabs.tsx
        select.tsx
        skeleton.tsx
        toast.tsx
        dropdown-menu.tsx
        ...
        
      shared/                   # Custom reusable components
        DataTable.tsx           # Sortable, paginated table
        SearchBar.tsx           # Debounced search input
        FilterBar.tsx           # Scrollable chip filters
        Pagination.tsx          # Page navigation
        StatusBadge.tsx         # Color-coded status pills
        StatCard.tsx            # Dashboard-style number card
        MoneyDisplay.tsx        # Formatted ₹ amounts
        DateRangePicker.tsx     # Period selector + custom range
        PeriodSelector.tsx      # Quick period buttons
        EmptyState.tsx          # Icon + text + CTA
        LoadingSkeleton.tsx     # Configurable skeleton
        ErrorState.tsx          # Error display + retry
        ConfirmDialog.tsx       # "Are you sure?" dialog
        FormSheet.tsx           # Bottom sheet (mobile) / dialog (desktop) wrapper
        Timeline.tsx            # Vertical timeline component
        Can.tsx                 # Permission wrapper component
        PageHeader.tsx          # Title + actions bar
        FAB.tsx                 # Floating action button (mobile)
        
    lib/                        # Utilities
      utils.ts                  # cn() classname merge, formatters
      constants.ts              # Route paths, query keys
      money.ts                  # formatMoney(string) → "₹1,500.00"
      date.ts                   # formatDate, formatRelative
      query-keys.ts             # TanStack Query key factory
      
    styles/
      globals.css               # Tailwind directives + custom CSS vars
```

### 11.2 Route Structure

```typescript
// App.tsx — React Router v7
<Routes>
  {/* Public */}
  <Route path="/login" element={<LoginPage />} />
  
  {/* Protected — wrapped in <AuthGuard> */}
  <Route element={<AuthGuard />}>
    <Route element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      
      <Route path="members">
        <Route index element={<MemberListPage />} />
        <Route path=":id" element={<MemberDetailPage />} />
      </Route>
      
      <Route path="memberships">
        <Route index element={<MembershipListPage />} />
        <Route path=":id" element={<MembershipDetailPage />} />
      </Route>
      
      <Route path="payments">
        <Route index element={<PaymentListPage />} />
        <Route path=":id" element={<PaymentDetailPage />} />
      </Route>
      
      <Route path="expenses">
        <Route index element={<ExpenseListPage />} />
        <Route path=":id" element={<ExpenseDetailPage />} />
      </Route>
      
      <Route path="reports">
        <Route index element={<ReportsHubPage />} />
        <Route path="revenue" element={<RevenueReportPage />} />
        <Route path="expenses" element={<ExpenseReportPage />} />
        <Route path="profit" element={<ProfitReportPage />} />
        <Route path="memberships" element={<MembershipReportPage />} />
        <Route path="outstanding" element={<OutstandingBalancesPage />} />
      </Route>
      
      <Route path="settings">
        <Route index element={<SettingsHubPage />} />
        <Route path="profile" element={<GymProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="system" element={<SystemInfoPage />} />
        {/* Future messaging */}
        <Route path="templates" element={<ComingSoonPage feature="templates" />} />
        <Route path="scheduled" element={<ComingSoonPage feature="scheduled" />} />
      </Route>
      
      <Route path="messages">
        <Route index element={<ComingSoonPage feature="history" />} />
      </Route>
      
      <Route path="notifications" element={<ComingSoonPage feature="notifications" />} />
      <Route path="leads" element={<ComingSoonPage feature="leads" />} />
    </Route>
  </Route>
  
  {/* 404 */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### 11.3 API Client Architecture

```typescript
// api/client.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 with silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshed = await silentRefresh();
      if (refreshed) return api(error.config);
      // Refresh failed → redirect to login
      tokenStore.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### 11.4 TanStack Query Strategy

**Query Key Factory:**
```typescript
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  members: {
    all: ["members"] as const,
    list: (filters: MemberFilters) => ["members", "list", filters] as const,
    detail: (id: string) => ["members", "detail", id] as const,
    notes: (id: string) => ["members", "notes", id] as const,
  },
  memberships: {
    all: ["memberships"] as const,
    member: (memberId: string) => ["memberships", "member", memberId] as const,
    detail: (id: string) => ["memberships", "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (filters: PaymentFilters) => ["payments", "list", filters] as const,
    detail: (id: string) => ["payments", "detail", id] as const,
    member: (memberId: string) => ["payments", "member", memberId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (filters: ExpenseFilters) => ["expenses", "list", filters] as const,
    detail: (id: string) => ["expenses", "detail", id] as const,
    categories: ["expenses", "categories"] as const,
  },
  reports: {
    revenue: (period: ReportPeriod) => ["reports", "revenue", period] as const,
    expenses: (period: ReportPeriod) => ["reports", "expenses", period] as const,
    profit: (period: ReportPeriod) => ["reports", "profit", period] as const,
    memberships: ["reports", "memberships"] as const,
    outstanding: ["reports", "outstanding"] as const,
  },
  plans: ["plans"] as const,
  automation: {
    expiring: ["automation", "expiring"] as const,
    expired: ["automation", "expired"] as const,
    summary: ["automation", "summary"] as const,
    backup: ["automation", "backup"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
} as const;
```

**Cache & Stale Times:**

| Data Type | staleTime | gcTime | Reason |
|-----------|-----------|--------|--------|
| Dashboard | 30s | 5min | Changes frequently (payments, expenses) |
| Member list | 1min | 10min | Changes on create/edit only |
| Member detail | 1min | 10min | Stable between edits |
| Payments list | 30s | 5min | New payments common |
| Plans | 5min | 30min | Rarely changes |
| Reports | 2min | 10min | Period-specific, recomputed |
| Expense categories | 10min | 30min | Very rarely changes |

**Invalidation Strategy:**
- After creating a member → invalidate `members.all`
- After creating a payment → invalidate `payments.all`, `dashboard`, `members.detail(memberId)`, `memberships.detail(membershipId)`
- After creating an expense → invalidate `expenses.all`, `dashboard`
- After plan CRUD → invalidate `plans`

### 11.5 Form Strategy

```
React Hook Form + Zod validation (reuse @gymflow/shared schemas)

Form lifecycle:
1. Sheet/Dialog opens → form renders with defaults
2. User fills fields → validation on blur (not on change)
3. User taps Submit → full validation
4. If invalid → show inline errors, scroll to first error
5. If valid → call useMutation → show spinner on button
6. On success → close sheet, invalidate queries, show success toast
7. On 400 error → map server errors to field errors
8. On other error → show toast, keep form open
```

**Key decisions:**
- Reuse `@gymflow/shared` Zod schemas directly for client-side validation
- Server errors (400 with field details) map back to form fields automatically
- All money inputs accept numbers, display formatted on blur
- Phone inputs auto-format with +91 prefix
- Date inputs use native date picker (reliable on Android)

### 11.6 Error Handling Strategy

```
Layer 1: Axios interceptor (401 refresh, global error transform)
Layer 2: TanStack Query onError (per-query error handling)
Layer 3: Error boundary (React component tree crashes)
Layer 4: Toast notifications (user-facing messages)

Error → isNetworkError? → Toast "No connection" + retry
     → is401?          → Silent refresh → retry or redirect
     → is403?          → Toast "Not permitted"
     → is404?          → Show NotFound component
     → is400?          → Return to form layer (field errors)
     → is409?          → Toast with conflict message
     → is429?          → Toast "Too many requests"
     → is500?          → Toast "Server error" + error ID
```

### 11.7 Authentication Flow

```
App Boot:
  1. Check localStorage for tokens
  2. If no tokens → redirect to /login
  3. If tokens exist → call GET /auth/me
  4. If /me succeeds → store user in context, render app
  5. If /me fails (401) → try refresh
  6. If refresh fails → clear tokens, redirect to /login

Login:
  1. POST /auth/login with email + password
  2. Store accessToken + refreshToken in localStorage
  3. Store user in AuthContext
  4. Redirect to /

Logout:
  1. POST /auth/logout with refreshToken
  2. Clear localStorage
  3. Clear all TanStack Query cache
  4. Redirect to /login

Silent Refresh:
  1. POST /auth/refresh with refreshToken
  2. Replace both tokens in localStorage
  3. Retry original failed request
  4. If refresh fails → logout flow
```

**Token Storage:** `localStorage` (acceptable for this app — no high-security financial data, and httpOnly cookies add complexity without meaningful benefit for a gym management app on Android).

### 11.8 Role-Based UI Strategy

```typescript
// hooks/use-permission.ts
type Action =
  | "members:create" | "members:edit" | "members:status"
  | "memberships:create" | "memberships:freeze"
  | "payments:create" | "payments:void"
  | "expenses:create" | "expenses:edit"
  | "plans:manage"
  | "categories:manage"
  | "settings:gym" | "settings:users"
  | "automation:view";

const ROLE_PERMISSIONS: Record<UserRole, Action[]> = {
  owner: [/* all actions */],
  receptionist: [
    "members:create", "members:edit", "members:status",
    "memberships:create", "memberships:freeze",
    "payments:create",
    "expenses:create", "expenses:edit",
  ],
  trainer: [],
};

export function usePermission(action: Action): boolean {
  const { user } = useAuth();
  return ROLE_PERMISSIONS[user.role].includes(action);
}

// components/shared/Can.tsx
export function Can({ action, children, fallback = null }) {
  const allowed = usePermission(action);
  return allowed ? children : fallback;
}

// Usage:
<Can action="members:create">
  <FAB onClick={openCreateForm} />
</Can>
```

### 11.9 State Management Strategy

| State Type | Solution | Examples |
|------------|----------|---------|
| **Server state** | TanStack Query | Members, payments, dashboard data |
| **Auth state** | React Context | Current user, tokens, login/logout |
| **UI state** | Local useState | Sheet open/closed, active tab, search input |
| **URL state** | React Router searchParams | Filters, pagination, period selection |
| **Form state** | React Hook Form | Create/edit forms |

**No global state store (no Redux, no Zustand).** TanStack Query handles 90% of state. The remaining 10% is local component state or URL params.

**URL-driven filters:** All list filters (status, page, search, period) are stored in URL search params so that:
- Browser back/forward works correctly
- Users can share/bookmark filtered views
- Refreshing the page preserves filters

```typescript
// Example: /members?status=active&page=2&search=amit
const [searchParams, setSearchParams] = useSearchParams();
const filters = {
  status: searchParams.get("status") || undefined,
  page: Number(searchParams.get("page")) || 1,
  search: searchParams.get("search") || undefined,
};
```

---

## SECTION 12 — Reusable Components Specification

### 12.1 AppLayout

Renders navigation (BottomNav on mobile, Sidebar on tablet/desktop) + content area via `<Outlet />`. Handles responsive breakpoints.

### 12.2 BottomNav (Mobile)

- 5 tabs: Home, Members, Payments, Reports, More
- Active tab: primary color fill + label
- Inactive: muted icon, no label
- "More" opens a bottom sheet with remaining nav items
- Height: 56px + safe area inset

### 12.3 Sidebar (Tablet/Desktop)

- Tablet: 56px icon rail, expandable to 240px
- Desktop: 240px always visible
- Active item: primary background tint
- Bottom section: user avatar + name + role + logout
- Divider before Settings and Messages sections

### 12.4 DataTable

Props: `columns`, `data`, `loading`, `emptyState`, `sortBy`, `sortOrder`, `onSort`
- Mobile: renders as card list (stacked vertically)
- Desktop: renders as proper HTML table with sortable headers
- Built-in loading skeleton
- Built-in empty state

### 12.5 StatusBadge

Props: `status`, `variant`
- Maps status strings to colors:
  - `active` → green
  - `expired` → red
  - `frozen` → blue
  - `inactive` → gray
  - `cancelled` → orange
  - `paid` → green
  - `partial` → yellow
  - `pending` → orange
  - `draft` → gray
  - `sent` → green
  - `failed` → red

### 12.6 StatCard

Props: `label`, `value`, `icon?`, `trend?`, `onClick?`
- Shows label (muted) above value (large bold)
- Optional icon in top-right
- Optional trend arrow (up green, down red)
- Tappable if onClick provided (navigates to detail)

### 12.7 MoneyDisplay

Props: `amount` (string from API), `size?`, `color?`
- Formats "1500.00" → "₹1,500.00"
- Negative amounts in red: "-₹64,700.00"
- Zero in muted: "₹0.00"

### 12.8 DateRangePicker / PeriodSelector

Props: `value` (ReportPeriod), `onChange`, `showCustom?`
- Renders as horizontal chip group on mobile
- Chips: This Month, This Year, All Time, Custom
- Custom expands a date range picker (two native date inputs)
- Selected chip: primary fill

### 12.9 EmptyState

Props: `icon`, `title`, `description`, `action?` ({ label, onClick })
- Centered vertically in container
- Icon: 64px, muted color
- Title: font-semibold text-lg
- Description: text-sm text-muted-foreground
- Action: primary button

### 12.10 FormSheet

Props: `open`, `onClose`, `title`, `children`
- Mobile: Shadcn `<Sheet>` (bottom, draggable)
- Desktop: Shadcn `<Dialog>` (centered modal, max-w-md)
- Handles responsive switching automatically

### 12.11 Timeline

Props: `events: TimelineEvent[]`
- Vertical line with dots
- Each event: icon dot + timestamp + title + description
- Events sorted reverse chronological
- Supports types: member_created, note_added, membership_assigned, membership_renewed, membership_frozen, membership_unfrozen, payment_recorded, status_changed

### 12.12 ConfirmDialog

Props: `open`, `onConfirm`, `onCancel`, `title`, `description`, `confirmLabel`, `variant`
- variant: "default" (blue confirm) or "destructive" (red confirm)
- Used for: void payment, cancel membership, change member status, delete note

### 12.13 FAB (Floating Action Button)

Props: `icon`, `label`, `onClick`
- Mobile only (hidden on desktop where we use header buttons)
- Fixed position: bottom-right, above bottom nav
- Primary color, circular, 56px
- Slight shadow elevation

### 12.14 PageHeader

Props: `title`, `backTo?`, `actions?`
- Mobile: top bar with back arrow + title + action icons
- Desktop: inline heading with action buttons on right

---

## SECTION 13 — Implementation Order

| Phase | Scope | Pages | Dependencies |
|-------|-------|-------|-------------|
| **Phase 1** | Project Setup | — | Vite, Tailwind, Shadcn, Router, Query, Axios |
| **Phase 2** | Authentication | Login | API client, token storage, auth context |
| **Phase 3** | App Layout | Shell | Sidebar, BottomNav, TopBar, AppLayout |
| **Phase 4** | Dashboard | Dashboard | StatCard, ExpiringList, RecentPayments |
| **Phase 5** | Members | List, Detail, Create, Edit | DataTable, MemberCard, MemberForm, Timeline, Notes |
| **Phase 6** | Memberships | List, Detail, Assign, Renew, Freeze | MembershipCard, forms |
| **Phase 7** | Payments | List, Detail, Record | PaymentCard, RecordPaymentForm, receipt download |
| **Phase 8** | Expenses | List, Detail, Create, Edit | ExpenseCard, ExpenseForm, CategorySelector |
| **Phase 9** | Reports | Hub, 5 report pages | PeriodSelector, ReportCard, export triggers |
| **Phase 10** | Settings | Hub, Plans, Categories, Profile, Users, Exports, System | PlanForm, CategoryForm, Coming Soon pages |

Each phase is self-contained and shippable. No phase requires a future phase to function.

Messaging pages (templates, scheduled, history) are stubbed as "Coming Soon" in Phase 10 settings. Routes and nav positions are reserved.

---

## Summary

This specification defines:
- **3 responsive layouts** (mobile-first, tablet, desktop)
- **30+ pages** across 10 feature modules
- **8 user journeys** optimized for gym owner daily use
- **14 reusable components** shared across the entire app
- **12 empty states**, skeleton loading, 7 error categories
- **3-role permission system** with hidden (not disabled) unauthorized elements
- **URL-driven state** for filters and pagination
- **TanStack Query** as the primary state management (no Redux)
- **Future-proofed architecture** for messaging, multi-channel templates, automation

**Ready for implementation approval.**
