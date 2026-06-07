# GymFlow — Friend Testing Guide

**Version:** 0.1.0
**Date:** 2026-06-07

This guide prepares GymFlow for real-world testing by someone unfamiliar with the codebase.

---

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 14+ (running locally or a cloud instance)

---

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd gym-console
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the **project root** (not inside apps/):

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/gymflow

# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Create the database
createdb gymflow

# Run migrations
pnpm --filter @gymflow/db db:migrate

# Seed with test data
pnpm --filter @gymflow/db db:seed
```

### 4. Start the Backend

```bash
pnpm --filter @gymflow/api dev
```

Backend runs at `http://localhost:3000`. Verify:
- `http://localhost:3000/health` — should return `{ status: "ok" }`
- `http://localhost:3000/health/db` — should return database info

### 5. Start the Frontend

In a separate terminal:

```bash
pnpm --filter @gymflow/web dev
```

Frontend runs at `http://localhost:5173`.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| **Owner** | `owner@ironparadise.in` | `Admin@123` |
| **Receptionist** | `reception@ironparadise.in` | `Reception@123` |

---

## Owner Test Scenarios

Login as **Owner** (`owner@ironparadise.in` / `Admin@123`).

### Dashboard (/)

- [ ] Dashboard loads with KPI cards (Revenue, Expenses, Profit, Outstanding)
- [ ] "Attention Required" section shows expiring memberships (if any)
- [ ] "Outstanding Balances" section shows members with dues
- [ ] Recent Payments and Recent Expenses sections show data
- [ ] Quick Actions section has 4 buttons (Add Member, Payment, Expense, Membership)
- [ ] Members overview shows Total/Active/Expired/Frozen counts
- [ ] Pull down on mobile to refresh — data reloads
- [ ] Clicking a payment card navigates to payment detail
- [ ] Clicking an expense card navigates to expense detail
- [ ] Clicking Outstanding "View All" goes to Outstanding report

### Members (/members)

- [ ] Member list loads with search bar and status filter chips
- [ ] Search by name works
- [ ] Search by phone works
- [ ] Status filters work (All, Active, Expired, Frozen, Inactive)
- [ ] Sort dropdown works (Newest, Oldest, Name A-Z, etc.)
- [ ] Clicking a member navigates to member detail
- [ ] Pagination works if > 20 members
- [ ] "Add Member" button navigates to registration form

### Add Member (/members/new)

- [ ] Name field has autofocus
- [ ] Phone field uses numeric keyboard on mobile (type="tel")
- [ ] Join Date defaults to today
- [ ] "Show Optional Fields" toggle reveals: Email, Gender, DOB, Address, Emergency Contact
- [ ] Gender uses pill-style buttons (Male, Female, Other)
- [ ] Submit with empty name shows validation error
- [ ] Submit with invalid phone (< 10 digits) shows validation error
- [ ] Submit with duplicate phone shows "phone already registered" inline error
- [ ] After successful creation, success screen shows member name
- [ ] "Create Membership" button navigates to membership creation
- [ ] "Record Payment" button navigates to payment form with memberId
- [ ] "Go to Profile" button navigates to the new member's detail page
- [ ] Back button returns to members list

### Member Detail (/members/:id)

- [ ] Member header shows name, avatar, status, phone (clickable), email
- [ ] Key info card shows: Current Plan, Expiry Date, Outstanding, Join Date
- [ ] "Renew" button navigates to membership detail
- [ ] "Record Payment" button navigates to payment form with memberId pre-filled
- [ ] "Freeze" button appears only for active memberships
- [ ] Overview tab shows personal info and memberships list
- [ ] Clicking a membership navigates to membership detail
- [ ] Notes tab allows adding and deleting notes
- [ ] Timeline tab shows member activity
- [ ] Back button returns to members list

### Memberships (/memberships)

- [ ] Membership list loads with filters
- [ ] Status filter chips work
- [ ] Search by member name works
- [ ] Clicking a membership navigates to detail

### Membership Detail (/memberships/:id)

- [ ] Health card shows membership progress (days remaining, payment progress)
- [ ] "Renew" button opens renew workflow — select plan, date, discount
- [ ] "Freeze" button opens freeze dialog — enter dates and reason
- [ ] "Unfreeze" button appears on frozen memberships
- [ ] "Record Payment" button navigates to payment form (with memberId + membershipId)
- [ ] Freeze history shows if applicable
- [ ] Activity timeline shows events
- [ ] "View Member Profile" link works

### Payments (/payments)

- [ ] Payment list loads with search and filters
- [ ] Search by receipt number works
- [ ] Payment method filter works
- [ ] Date range filter works
- [ ] Clicking a payment navigates to detail

### Record Payment (/payments/new)

- [ ] Search and select a member
- [ ] Select a membership (shows payment progress bars)
- [ ] "Pay Full Outstanding" shortcut appears for memberships with dues
- [ ] Enter amount, select method, pick date
- [ ] Preview shows all details before submission
- [ ] Submit creates payment successfully (toast confirmation)
- [ ] After payment, navigates to payment detail
- [ ] Dashboard KPIs update after going back (revenue + outstanding change)

### Payment Detail (/payments/:id)

- [ ] Shows payment amount, receipt number, method, date
- [ ] Shows member name and membership link
- [ ] Back button works

### Expenses (/expenses)

- [ ] Expense list loads with search and category filters
- [ ] Category filter chips are dynamic (from backend)
- [ ] Date range filter works
- [ ] Sort dropdown works

### Record Expense (/expenses/new)

- [ ] Category pill buttons load from backend
- [ ] Enter amount, description, payment method, date
- [ ] Preview shows before submission
- [ ] Submit creates expense (toast confirmation)
- [ ] Dashboard expenses KPI updates

### Reports (/reports)

- [ ] Reports hub shows 5 report cards
- [ ] **Revenue Report**: period selector works, metrics show, breakdown list shows
- [ ] **Expense Report**: period selector works, category breakdown shows
- [ ] **Profit Report**: revenue vs expense comparison bars render
- [ ] **Membership Report**: status cards + expiring memberships list
- [ ] **Outstanding Report**: balance rows with "Record Payment" buttons
- [ ] Export buttons (CSV, XLSX) download files in new tabs

### Settings (/settings)

- [ ] Settings hub shows 7 cards
- [ ] All cards are accessible (no lock icons for owner)

### Membership Plans (/settings/plans)

- [ ] Plans list loads (active and inactive sections)
- [ ] "New Plan" button opens inline form
- [ ] Create a plan: name, duration (days), price, description, sort order
- [ ] Validation works (try empty name, negative price, etc.)
- [ ] Edit a plan (pencil icon) — form pre-fills
- [ ] Deactivate a plan — confirmation dialog appears
- [ ] Reactivate an inactive plan
- [ ] New plans appear in the Renew Membership workflow

### Expense Categories (/settings/categories)

- [ ] Categories list with usage counts
- [ ] Create a new category
- [ ] Edit a category name/description
- [ ] Deactivate category with expenses shows confirmation with count
- [ ] Inactive categories still show in historical expense records

### Automation (/settings/automation)

- [ ] Expiring memberships card loads with expandable sections
- [ ] Expired memberships card shows count
- [ ] Daily summary card shows key-value data
- [ ] Backup status card loads
- [ ] Refresh buttons work on all cards

### Data Exports (/settings/exports)

- [ ] Period selector changes "Filtered by" label on revenue/expenses
- [ ] CSV download works for all 4 categories
- [ ] XLSX download works for all 4 categories
- [ ] Downloaded files contain actual data

### System Info (/settings/system)

- [ ] API Server card shows: Healthy, version, uptime, environment
- [ ] Database card shows: Connected, engine, version, latency
- [ ] Refresh buttons work

### Gym Profile & Users

- [ ] Both show "Coming Soon" with planned features list
- [ ] Back buttons work

---

## Receptionist Test Scenarios

Login as **Receptionist** (`reception@ironparadise.in` / `Reception@123`).

### Permissions Check

- [ ] Dashboard loads normally (same KPIs visible)
- [ ] Can search and view members
- [ ] **Cannot** see "Add Member" button ← Wait, receptionist CAN create members. Verify the button appears.
- [ ] Can view member detail and record payments
- [ ] Can create memberships (renew)
- [ ] Can freeze/unfreeze memberships
- [ ] Can record payments
- [ ] Can record expenses
- [ ] Can view reports (all 5)
- [ ] Can use data exports

### Settings Restrictions

- [ ] Settings hub shows lock icons on: Plans, Categories, Automation, System Info, Gym Profile, Users & Roles
- [ ] Locked cards are disabled (cannot click)
- [ ] **Data Exports** card is accessible (no lock — all roles can export)
- [ ] Navigate directly to `/settings/plans` — verify API returns 403 on mutations
- [ ] Navigate directly to `/settings/automation` — verify API returns 403

### FAB (Mobile)

- [ ] FAB shows with: Add Member, Record Payment, Add Expense
- [ ] All three actions navigate correctly

---

## Known Missing Features

These are **not bugs** — they are features that haven't been built yet:

1. **Edit Member** — no edit form exists. Member data can only be updated via API.
2. **Gym Profile editing** — no backend endpoint exists yet.
3. **User management** — cannot add/remove staff users from the UI.
4. **Messaging** (Templates, Scheduled, History) — Coming Soon pages.
5. **Notifications** — Coming Soon page.
6. **Lead Management** — Coming Soon page.
7. **Payment void/refund** — backend supports it, UI doesn't expose it.
8. **View/Download Receipt** — PDF receipt generation exists on backend but isn't linked from the payment detail page.

---

## Troubleshooting

### "Cannot connect to server"
- Verify backend is running on port 3000
- Check DATABASE_URL in .env
- Run `http://localhost:3000/health` to verify

### "Login fails"
- Verify seed data was loaded: `pnpm --filter @gymflow/db db:seed`
- Check that JWT secrets are set in .env

### "Exports don't download"
- Exports open in a new tab with token in URL
- If token expired, log out and log back in, then try again

### "Dashboard shows stale data"
- Pull down to refresh on mobile
- Navigate away and back to trigger refetch
- Hard refresh (Ctrl+Shift+R) to clear all caches

---

## Reporting Issues

When reporting a bug, include:
1. Which account you were using (Owner/Receptionist)
2. What page you were on (URL)
3. What you did (steps to reproduce)
4. What you expected
5. What actually happened
6. Browser and device (mobile/desktop)
