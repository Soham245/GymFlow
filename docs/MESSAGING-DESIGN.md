# GymFlow Messaging System — Architecture Design

> **Status:** Schema + migration complete. Controllers/services/routes NOT implemented.
> **Target Phase:** Phase 10 (after core frontend)
> **Tables created:** `message_templates`, `scheduled_messages`, `message_log`
> **Migrations:** `0001_faulty_kang.sql` (initial tables), `0002_multi_channel_templates.sql` (channel→channels JSONB array) — both applied to Neon

---

## Database Schema

### Entity Relationship

```
gyms (1) ──→ (N) message_templates (1) ──→ (N) scheduled_messages
                       │                              │
                       │                              │
                       └──────────→ (N) message_log ←─┘
                                         ↑
                                    members (1:N)
```

### Table: `message_templates`

Owner-managed message templates with optional auto-trigger binding.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| gym_id | UUID | No | — | FK → gyms.id (RESTRICT) |
| name | VARCHAR(255) | No | — | Unique per gym |
| content | TEXT | No | — | Template body with {{variables}} |
| trigger_type | message_trigger_type | Yes | NULL | Auto-fire event, NULL = manual only |
| channels | JSONB (string[]) | No | '["whatsapp"]' | Array of channels: whatsapp / sms / email |
| is_active | BOOLEAN | No | true | Toggle on/off |
| created_at | TIMESTAMPTZ | No | now() | — |
| updated_at | TIMESTAMPTZ | No | now() | — |
| created_by | UUID | Yes | — | FK → users.id (SET NULL) |

**Indexes:**
- `UNIQUE(gym_id, name)` — no duplicate template names
- `(gym_id, is_active)` — list active templates
- `(gym_id, trigger_type)` — lookup by trigger

**Business rules (application-enforced):**
- Only ONE active template per `(gym_id, trigger_type)` for non-NULL triggers
- Template content max 2000 chars
- Deleting a template = setting `is_active: false` (soft-delete)

### Table: `scheduled_messages`

One-off or recurring campaigns (festivals, promos).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| gym_id | UUID | No | — | FK → gyms.id (RESTRICT) |
| template_id | UUID | No | — | FK → message_templates.id (RESTRICT) |
| name | VARCHAR(255) | No | — | "Diwali 2026 Greetings" |
| scheduled_at | TIMESTAMPTZ | No | — | When to send |
| target_filter | JSONB | Yes | NULL | `{ "status": "active" }` or null = all |
| status | scheduled_message_status | No | 'draft' | draft → scheduled → sent / cancelled |
| sent_count | INTEGER | No | 0 | Successfully sent |
| failed_count | INTEGER | No | 0 | Failed deliveries |
| created_at | TIMESTAMPTZ | No | now() | — |
| updated_at | TIMESTAMPTZ | No | now() | — |
| created_by | UUID | Yes | — | FK → users.id (SET NULL) |

**Indexes:**
- `(gym_id, status)` — list by status
- `(scheduled_at)` — n8n polls for due messages

**Business rules:**
- Can only edit if status = `draft` or `scheduled`
- Cancel sets status = `cancelled` (not deleted)
- After send, status = `sent` and counts are updated

### Table: `message_log`

Every individual message sent. This is the message history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| gym_id | UUID | No | — | FK → gyms.id (RESTRICT) |
| member_id | UUID | Yes | — | FK → members.id (SET NULL) |
| template_id | UUID | Yes | — | FK → message_templates.id (SET NULL) |
| scheduled_message_id | UUID | Yes | — | FK → scheduled_messages.id (SET NULL) |
| trigger_type | message_trigger_type | Yes | — | What triggered this |
| channel | notification_channel | No | — | whatsapp / sms / email |
| recipient | TEXT | No | — | Phone number or email |
| content | TEXT | Yes | — | Rendered message (variables replaced) |
| status | notification_status | No | 'pending' | pending → sent / failed |
| error_message | TEXT | Yes | — | Delivery error details |
| retry_count | INTEGER | No | 0 | Delivery attempts |
| sent_at | TIMESTAMPTZ | Yes | — | Actual send timestamp |
| created_at | TIMESTAMPTZ | No | now() | — |

**Indexes:**
- `(gym_id, created_at)` — list recent messages
- `(member_id)` — messages for a specific member
- `(template_id)` — messages sent from a template
- `(gym_id, trigger_type)` — filter by trigger
- `(scheduled_message_id)` — messages from a campaign
- `(gym_id, status)` — filter by delivery status

### Enums

```sql
message_trigger_type: member_created, membership_expiring_7_days,
    membership_expiring_3_days, membership_expiring_1_day,
    membership_expired, payment_received, manual

scheduled_message_status: draft, scheduled, sent, cancelled
```

---

## Template Variables

Templates use `{{variable_name}}` placeholders. Variables are resolved at send time.

| Variable | Source | Available Triggers |
|----------|--------|--------------------|
| `{{member_name}}` | members.name | All |
| `{{member_phone}}` | members.phone | All |
| `{{gym_name}}` | gyms.name | All |
| `{{membership_plan}}` | membership_plans.name | Membership triggers |
| `{{expiry_date}}` | member_memberships.end_date | Expiring/expired |
| `{{amount_due}}` | computed outstanding | Expiring/expired |
| `{{payment_amount}}` | payments.amount | payment_received |
| `{{receipt_number}}` | payments.receipt_number | payment_received |

### Example Template

```
Hi {{member_name}}! Your {{membership_plan}} at {{gym_name}} expires on {{expiry_date}}.
Renew now to continue uninterrupted. Outstanding: ₹{{amount_due}}.
Call us or visit the gym today!
```

### Variable Resolution

```typescript
function renderTemplate(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => variables[key] ?? `{{${key}}}`
  );
}
```

Unresolved variables are left as-is (not stripped), so the owner can spot missing data.

---

## API Contract (16 endpoints)

### Message Templates (7 endpoints)

| Method | Path | Auth | Role | Body/Query |
|--------|------|------|------|------------|
| GET | `/message-templates` | Yes | owner | `?includeInactive&triggerType` |
| POST | `/message-templates` | Yes | owner | `{ name, content, triggerType?, channel? }` |
| GET | `/message-templates/:id` | Yes | owner | — |
| PATCH | `/message-templates/:id` | Yes | owner | `{ name?, content?, triggerType?, channel? }` |
| DELETE | `/message-templates/:id` | Yes | owner | → sets isActive=false |
| PATCH | `/message-templates/:id/status` | Yes | owner | `{ isActive }` |
| POST | `/message-templates/:id/preview` | Yes | owner | `{ content }` → rendered with sample data |

#### Example: Create Template

```http
POST /api/v1/message-templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "7-Day Expiry Reminder",
  "content": "Hi {{member_name}}, your {{membership_plan}} at {{gym_name}} expires on {{expiry_date}}. Outstanding: ₹{{amount_due}}. Renew today!",
  "triggerType": "membership_expiring_7_days",
  "channels": ["whatsapp", "sms"]
}
```

```json
{
  "success": true,
  "data": {
    "template": {
      "id": "tmpl-uuid",
      "gymId": "gym-uuid",
      "name": "7-Day Expiry Reminder",
      "content": "Hi {{member_name}}, your {{membership_plan}}...",
      "triggerType": "membership_expiring_7_days",
      "channels": ["whatsapp", "sms"],
      "isActive": true,
      "createdAt": "2026-06-06T12:00:00.000Z",
      "updatedAt": "2026-06-06T12:00:00.000Z"
    }
  }
}
```

#### Example: Preview Template

```http
POST /api/v1/message-templates/tmpl-uuid/preview
Authorization: Bearer <token>

{ "content": "Hi {{member_name}}, your plan {{membership_plan}} expires {{expiry_date}}" }
```

```json
{
  "success": true,
  "data": {
    "preview": "Hi Amit Roy, your plan Quarterly expires 2026-08-29",
    "variables": ["member_name", "membership_plan", "expiry_date"]
  }
}
```

### Scheduled Messages (5 endpoints)

| Method | Path | Auth | Role | Body/Query |
|--------|------|------|------|------------|
| GET | `/scheduled-messages` | Yes | owner | `?status` |
| POST | `/scheduled-messages` | Yes | owner | `{ templateId, name, scheduledAt, targetFilter? }` |
| GET | `/scheduled-messages/:id` | Yes | owner | — (includes sent/failed counts) |
| PATCH | `/scheduled-messages/:id` | Yes | owner | `{ name?, scheduledAt?, targetFilter? }` (only draft/scheduled) |
| POST | `/scheduled-messages/:id/cancel` | Yes | owner | → sets status='cancelled' |

#### Example: Schedule a Diwali Message

```http
POST /api/v1/scheduled-messages
Authorization: Bearer <token>

{
  "templateId": "tmpl-uuid",
  "name": "Diwali 2026 Greetings",
  "scheduledAt": "2026-10-20T08:00:00.000Z",
  "targetFilter": { "status": "active" }
}
```

```json
{
  "success": true,
  "data": {
    "scheduledMessage": {
      "id": "sched-uuid",
      "templateId": "tmpl-uuid",
      "name": "Diwali 2026 Greetings",
      "scheduledAt": "2026-10-20T08:00:00.000Z",
      "targetFilter": { "status": "active" },
      "status": "scheduled",
      "sentCount": 0,
      "failedCount": 0,
      "createdAt": "2026-06-06T12:00:00.000Z"
    }
  }
}
```

### Notification History (2 endpoints)

| Method | Path | Auth | Role | Query |
|--------|------|------|------|-------|
| GET | `/notifications` | Yes | owner | `?page&limit&memberId&templateId&triggerType&status&dateFrom&dateTo` |
| GET | `/notifications/:id` | Yes | owner | — |

#### Example: List Message History

```http
GET /api/v1/notifications?page=1&limit=20&triggerType=membership_expiring_7_days&status=sent
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "log-uuid",
        "memberId": "member-uuid",
        "memberName": "Amit Roy",
        "memberPhone": "+919876543211",
        "templateId": "tmpl-uuid",
        "templateName": "7-Day Expiry Reminder",
        "triggerType": "membership_expiring_7_days",
        "channel": "whatsapp",
        "recipient": "+919876543211",
        "content": "Hi Amit Roy, your Quarterly at Iron Paradise...",
        "status": "sent",
        "sentAt": "2026-06-01T08:00:00.000Z",
        "createdAt": "2026-06-01T08:00:00.000Z"
      }
    ]
  },
  "meta": { "total": 15, "page": 1, "totalPages": 1, "hasMore": false }
}
```

### Internal / n8n Integration (2 endpoints)

| Method | Path | Auth | Role | Body |
|--------|------|------|------|------|
| POST | `/notifications/send` | Yes | owner | `{ templateId, memberId, variables? }` |
| PATCH | `/notifications/:id/status` | Yes | owner | `{ status: "sent" \| "failed", errorMessage? }` |

These are called by n8n workflows, not by the frontend.

---

## n8n Integration Flow

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   GymFlow    │       │     n8n      │       │  WhatsApp /  │
│   Backend    │◄─────►│   Workflow   │──────►│  SMS API     │
└──────────────┘       └──────────────┘       └──────────────┘

Flow for auto-triggers:
1. n8n cron fires daily at 8 AM
2. n8n calls GET /automation/expiring-memberships
3. For each member expiring in 7 days:
   a. n8n calls POST /notifications/send
      { templateId: "7-day-template-id", memberId: "..." }
   b. GymFlow resolves template, substitutes variables,
      creates message_log entry (status=pending)
   c. Returns rendered content
4. n8n sends via WhatsApp Business API
5. n8n calls PATCH /notifications/{id}/status
   { status: "sent" } or { status: "failed", errorMessage: "..." }

Flow for scheduled messages:
1. n8n polls GET /scheduled-messages?status=scheduled every 15 min
2. For messages where scheduled_at <= now():
   a. Get target members based on target_filter
   b. For each member: POST /notifications/send
   c. Send via WhatsApp/SMS
   d. PATCH /notifications/{id}/status
3. After all sent, update scheduled_message counts + status='sent'
```

---

## Frontend Screen Designs (Phase 10-11)

### Where It Lives

Messaging goes in the "More" menu on mobile, and as a sidebar item on desktop.

```
/messages                  → Templates list
/messages/templates/:id    → Template detail/edit
/messages/scheduled        → Scheduled messages list
/messages/history          → Sent message history
```

### Screen 1: Message Templates (Mobile)

```
┌─────────────────────────────┐
│  ← Messages           [+]  │
├─────────────────────────────┤
│ [Templates][Scheduled][Log] │  ← Tab bar
├─ TEMPLATES TAB ─────────────┤
│                             │
│ AUTO-TRIGGER TEMPLATES      │  ← Section header
│ ┌───────────────────────────┤
│ │ 🟢 New Member Welcome     │
│ │    member_created • WA    │
│ ├───────────────────────────┤
│ │ 🟢 7-Day Expiry Reminder  │
│ │    expiring_7_days • WA   │
│ ├───────────────────────────┤
│ │ 🟢 Payment Received       │
│ │    payment_received • WA  │
│ ├───────────────────────────┤
│ │ ⚫ Membership Expired     │  ← Inactive (grey dot)
│ │    membership_expired     │
│ └───────────────────────────┘
│                             │
│ MANUAL TEMPLATES            │  ← Section header
│ ┌───────────────────────────┤
│ │ 🟢 Festival Greeting       │
│ │    manual • WhatsApp      │
│ ├───────────────────────────┤
│ │ 🟢 Promo Offer             │
│ │    manual • WhatsApp      │
│ └───────────────────────────┘
│                             │
│ 🏠  👥  💰  📊  ⋯         │
└─────────────────────────────┘
```

### Screen 2: Template Editor (Sheet/Modal)

```
┌─────────────────────────────┐
│  Create Template       [✕]  │
├─────────────────────────────┤
│                             │
│ Name                        │
│ ┌───────────────────────────┤
│ │ 7-Day Expiry Reminder     │
│ └───────────────────────────┘
│                             │
│ Trigger                     │
│ ┌───────────────────────────┤
│ │ ▾ Expiring in 7 Days      │
│ └───────────────────────────┘
│                             │
│ Channel                     │
│ [WhatsApp] [SMS] [Email]    │  ← Segmented control
│                             │
│ Message                     │
│ ┌───────────────────────────┤
│ │ Hi {{member_name}}, your  │
│ │ {{membership_plan}} at    │
│ │ {{gym_name}} expires on   │
│ │ {{expiry_date}}.          │
│ │                           │
│ │ Outstanding: ₹{{amount_   │
│ │ due}}. Renew today!       │
│ └───────────────────────────┘
│ 📊 148/2000 chars           │
│                             │
│ Insert variable:            │
│ [member_name] [gym_name]    │  ← Tappable chips
│ [plan] [expiry] [amount]    │
│                             │
│ ── Preview ──               │
│ ┌───────────────────────────┤
│ │ Hi Amit Roy, your         │
│ │ Quarterly at Iron Paradise│
│ │ expires on 2026-08-29.    │
│ │ Outstanding: ₹500.00.     │
│ │ Renew today!              │
│ └───────────────────────────┘
│                             │
│ [Save Template]             │  ← Primary CTA
│                             │
└─────────────────────────────┘
```

### Screen 3: Scheduled Messages

```
┌─────────────────────────────┐
│  ← Messages           [+]  │
├─────────────────────────────┤
│ [Templates][Scheduled][Log] │
├─ SCHEDULED TAB ─────────────┤
│                             │
│ UPCOMING                    │
│ ┌───────────────────────────┤
│ │ 📅 Diwali 2026 Greetings  │
│ │    Oct 20, 8:00 AM        │
│ │    Template: Festival      │
│ │    Target: Active members  │
│ │    Status: 🟡 Scheduled    │
│ │    [Edit] [Cancel]         │
│ ├───────────────────────────┤
│ │ 📅 New Year 2027           │
│ │    Dec 31, 11:59 PM        │
│ │    Status: 📝 Draft        │
│ │    [Edit] [Schedule]       │
│ └───────────────────────────┘
│                             │
│ PAST                        │
│ ┌───────────────────────────┤
│ │ ✅ Independence Day Offer  │
│ │    Aug 15, 2026 • Sent     │
│ │    92 sent / 3 failed      │
│ └───────────────────────────┘
│                             │
│ 🏠  👥  💰  📊  ⋯         │
└─────────────────────────────┘
```

### Screen 4: Message History / Log

```
┌─────────────────────────────┐
│  ← Messages                 │
├─────────────────────────────┤
│ [Templates][Scheduled][Log] │
├─ LOG TAB ───────────────────┤
│ 🔍 Search by member...      │
│ [All][Sent][Failed][Pending] │  ← Filter chips
├─────────────────────────────┤
│ ┌───────────────────────────┤
│ │ ✅ Amit Roy               │
│ │    7-Day Expiry Reminder   │
│ │    WhatsApp • Jun 1, 8 AM  │
│ ├───────────────────────────┤
│ │ ✅ Priya Menon            │
│ │    7-Day Expiry Reminder   │
│ │    WhatsApp • Jun 1, 8 AM  │
│ ├───────────────────────────┤
│ │ ❌ Rohit Das              │
│ │    Payment Received        │
│ │    WhatsApp • May 28       │
│ │    Error: Number not on WA │
│ ├───────────────────────────┤
│ │ ✅ Sneha Banerjee         │
│ │    Welcome Message         │
│ │    WhatsApp • May 15       │
│ └───────────────────────────┘
│ ← 1 of 5 →                 │
│                             │
│ 🏠  👥  💰  📊  ⋯         │
└─────────────────────────────┘
```

### Screen 5: Message Detail (tapped from history)

```
┌─────────────────────────────┐
│  ← Message Detail           │
├─────────────────────────────┤
│                             │
│ Status:    ✅ Sent           │
│ Member:    Amit Roy          │  ← Tappable → member detail
│ Phone:     +919876543211     │  ← Tappable → dialer
│ Template:  7-Day Expiry      │
│ Trigger:   Expiring 7 Days   │
│ Channel:   WhatsApp          │
│ Sent at:   Jun 1, 8:00 AM   │
│                             │
│ ── Message Content ──        │
│ ┌───────────────────────────┤
│ │ Hi Amit Roy, your         │
│ │ Quarterly at Iron Paradise│
│ │ expires on 2026-08-29.    │
│ │ Outstanding: ₹500.00.     │
│ │ Renew today!              │
│ └───────────────────────────┘
│                             │
│ 🏠  👥  💰  📊  ⋯         │
└─────────────────────────────┘
```

### Desktop Layout

On desktop (≥1024px), the 3 tabs become a sidebar navigation within the Messages section:

```
┌────────┬──────────────────────────────────────┐
│ 🏠 Home│  Message Templates        [+ New]   │
│ 👥 Memb│                                      │
│ 📋 Plan│  AUTO-TRIGGER                        │
│ 💰 Pay │  ┌───────┬──────────┬──────┬───────┐│
│ 💸 Exp │  │ Name  │ Trigger  │ Chan │Active ││
│ 📊 Rep │  │ Welco │ member_  │ WA   │ ✅    ││
│ 💬 Msg │  │ 7-Day │ exp_7d   │ WA   │ ✅    ││
│  ├ Tmpl│  │ Expir │ expired  │ WA   │ ⚫    ││
│  ├ Sched│ └───────┴──────────┴──────┴───────┘│
│  └ Log │                                      │
│        │  MANUAL                               │
│ 🚪 Out │  ┌───────┬──────────┬──────┬───────┐│
│        │  │ Festi │ manual   │ WA   │ ✅    ││
│        │  │ Promo │ manual   │ WA   │ ✅    ││
│        │  └───────┴──────────┴──────┴───────┘│
└────────┴──────────────────────────────────────┘
```

---

## Route Structure Addition (Phase 10-11)

```typescript
// New routes added to React Router
/messages                     → MessagesLayout (with tabs)
/messages/templates           → TemplatesList
/messages/templates/:id       → TemplateDetail
/messages/scheduled           → ScheduledList
/messages/history             → MessageHistory
/messages/history/:id         → MessageDetail
```

---

## Implementation Checklist (Phase 10)

### Backend (Phase 10)

- [ ] Message templates service (CRUD + toggle + preview)
- [ ] Message templates controller + router
- [ ] Scheduled messages service (CRUD + cancel)
- [ ] Scheduled messages controller + router
- [ ] Notifications service (list + detail + send + update status)
- [ ] Notifications controller + router
- [ ] Template variable renderer utility
- [ ] Wire routes into main router
- [ ] Seed default templates (welcome, 7-day, 3-day, 1-day, expired, payment)
- [ ] Add audit log actions for template/schedule CRUD
- [ ] Test all 16 endpoints

### Frontend (Phase 11)

- [ ] Message templates list page
- [ ] Template create/edit sheet with variable chips
- [ ] Template preview with sample data
- [ ] Scheduled messages list page
- [ ] Schedule create sheet with date picker + member filter
- [ ] Message history list with filters
- [ ] Message detail page
- [ ] Wire into "More" menu (mobile) and sidebar (desktop)

---

**Total endpoints after messaging: 78 (62 existing + 16 new)**
