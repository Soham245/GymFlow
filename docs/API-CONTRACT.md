# GymFlow API Contract

> **Version:** 0.1.0 | **Base URL:** `http://localhost:3000/api/v1` | **Auth:** Bearer JWT
> **Audit verified:** 2026-06-06 — All 62 endpoints pass 8-point consistency check

---

## Global Conventions

### Envelope

Every response follows this shape:

```json
// Success
{ "success": true, "data": { ... }, "meta": { ... } }

// Error
{ "success": false, "error": { "code": "...", "message": "...", "details": {} } }
```

### Data Types

| Type | Format | Example |
|------|--------|---------|
| **Money** | `string` with 2 decimals | `"1500.00"`, `"-64700.00"`, `"0.00"` |
| **Date** | `string` YYYY-MM-DD | `"2026-06-05"` |
| **Timestamp** | `string` ISO 8601 | `"2026-06-05T18:58:23.949Z"` |
| **ID** | `string` UUID | `"c79f4fb6-f1d4-4a9d-8ae9-e4c0fa75a3bf"` |
| **Boolean** | `boolean` | `true`, `false` |
| **Count** | `number` (integer) | `7`, `0` |
| **Percentage** | `number` (float) | `45.5` |

### Pagination

Paginated endpoints accept `?page=1&limit=20` and return:

```json
{
  "success": true,
  "data": { "members": [...] },
  "meta": { "total": 42, "page": 1, "totalPages": 3, "hasMore": true }
}
```

### Error Codes

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | Missing/invalid/expired token |
| `FORBIDDEN` | 403 | Role not allowed |
| `BAD_REQUEST` | 400 | Validation failure, business rule violation |
| `NOT_FOUND` | 404 | Entity doesn't exist (or not in your gym) |
| `CONFLICT` | 409 | Duplicate data (phone, name, receipt) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server bug |

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | `owner`, `receptionist`, `trainer` |
| `MemberStatus` | `active`, `expired`, `inactive`, `frozen` |
| `MembershipStatus` | `active`, `expired`, `cancelled`, `frozen` |
| `PaymentMethod` | `cash`, `upi`, `card`, `bank_transfer` |
| `PaymentStatus` | `paid`, `partial`, `pending`, `refunded` |
| `Gender` | `male`, `female`, `other` |
| `ReportPeriod` | `today`, `this_week`, `this_month`, `last_month`, `this_year`, `all_time`, `custom` |

---

## Endpoint Reference

### Auth (6 endpoints)

| Method | Path | Auth | Role | Body |
|--------|------|------|------|------|
| POST | `/auth/login` | No | — | `{ email, password }` |
| POST | `/auth/refresh` | No | — | `{ refreshToken }` |
| POST | `/auth/logout` | Yes | any | `{ refreshToken }` |
| POST | `/auth/logout-all` | Yes | any | — |
| GET | `/auth/me` | Yes | any | — |
| POST | `/auth/change-password` | Yes | any | `{ currentPassword, newPassword }` |

#### Example: Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "owner@ironparadise.in", "password": "Admin@123" }
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c79f4fb6-f1d4-4a9d-8ae9-e4c0fa75a3bf",
      "name": "Rahul Sharma",
      "email": "owner@ironparadise.in",
      "role": "owner",
      "gymId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "a3f8c2d1e9b0...",
      "expiresIn": "15m"
    }
  }
}
```

#### Example: Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c79f4fb6-f1d4-4a9d-8ae9-e4c0fa75a3bf",
      "name": "Rahul Sharma",
      "email": "owner@ironparadise.in",
      "role": "owner",
      "gymId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "phone": "+919876543210",
      "isActive": true,
      "lastLoginAt": "2026-06-06T12:16:21.545Z",
      "createdAt": "2026-06-04T19:14:17.989Z"
    }
  }
}
```

---

### Members (8 endpoints)

| Method | Path | Auth | Role | Query/Body |
|--------|------|------|------|------------|
| GET | `/members` | Yes | any | `?page&limit&status&search&sortBy&sortOrder` |
| POST | `/members` | Yes | owner,rec | `{ name, phone, joinDate, ... }` |
| GET | `/members/:id` | Yes | any | — |
| PATCH | `/members/:id` | Yes | owner,rec | `{ name?, phone?, ... }` |
| PATCH | `/members/:id/status` | Yes | owner,rec | `{ status, reason? }` |
| POST | `/members/:id/notes` | Yes | owner,rec | `{ content }` |
| GET | `/members/:id/notes` | Yes | any | — |
| DELETE | `/members/:id/notes/:noteId` | Yes | owner,rec | — |

#### Example: List Members (paginated)

```http
GET /api/v1/members?page=1&limit=2&status=active&sortBy=name&sortOrder=asc
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "31032a4e-2d31-49cd-b860-e54678d52569",
        "name": "Amit Roy",
        "phone": "+919876543211",
        "email": "amit@example.com",
        "gender": "male",
        "joinDate": "2025-04-15",
        "status": "active",
        "photoUrl": null,
        "createdAt": "2026-06-04T19:14:17.989Z"
      },
      {
        "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "name": "Priya Menon",
        "phone": "+919876543213",
        "email": null,
        "gender": "female",
        "joinDate": "2025-06-01",
        "status": "active",
        "photoUrl": null,
        "createdAt": "2026-06-04T19:14:17.989Z"
      }
    ]
  },
  "meta": {
    "total": 6,
    "page": 1,
    "totalPages": 3,
    "hasMore": true
  }
}
```

#### Example: Create Member

```http
POST /api/v1/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Vikram Singh",
  "phone": "+919876543215",
  "email": "vikram@example.com",
  "gender": "male",
  "dateOfBirth": "1990-03-15",
  "joinDate": "2026-06-05"
}
```

```json
{
  "success": true,
  "data": {
    "member": {
      "id": "e7f8a9b0-c1d2-3456-7890-abcdef123456",
      "name": "Vikram Singh",
      "phone": "+919876543215",
      "email": "vikram@example.com",
      "gender": "male",
      "dateOfBirth": "1990-03-15",
      "address": null,
      "emergencyContactName": null,
      "emergencyContactPhone": null,
      "photoUrl": null,
      "joinDate": "2026-06-05",
      "status": "active",
      "createdAt": "2026-06-05T10:00:00.000Z",
      "updatedAt": "2026-06-05T10:00:00.000Z",
      "createdByName": "Rahul Sharma"
    }
  }
}
```

---

### Plans (5 endpoints)

| Method | Path | Auth | Role | Query/Body |
|--------|------|------|------|------------|
| GET | `/membership-plans` | Yes | any | `?includeInactive` |
| POST | `/membership-plans` | Yes | owner | `{ name, durationDays, price, ... }` |
| GET | `/membership-plans/:id` | Yes | any | — |
| PATCH | `/membership-plans/:id` | Yes | owner | `{ name?, price?, ... }` |
| PATCH | `/membership-plans/:id/status` | Yes | owner | `{ isActive }` |

#### Example: List Plans

```http
GET /api/v1/membership-plans
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "gymId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Monthly",
        "durationDays": 30,
        "price": "1500.00",
        "description": "Basic monthly membership",
        "sortOrder": 1,
        "isActive": true,
        "createdAt": "2026-06-04T19:14:17.989Z",
        "updatedAt": "2026-06-04T19:14:17.989Z"
      },
      {
        "id": "p2a2b3c4-d5e6-7890-abcd-ef1234567890",
        "name": "Quarterly",
        "durationDays": 90,
        "price": "3500.00",
        "description": "3-month membership",
        "sortOrder": 2,
        "isActive": true
      }
    ]
  }
}
```

---

### Memberships (6 endpoints)

| Method | Path | Auth | Role | Body |
|--------|------|------|------|------|
| POST | `/members/:id/memberships` | Yes | owner,rec | `{ planId, startDate, discountAmount? }` |
| GET | `/members/:id/memberships` | Yes | any | — |
| GET | `/memberships/:id` | Yes | any | — |
| POST | `/memberships/:id/renew` | Yes | owner,rec | `{ planId, startDate, discountAmount? }` |
| POST | `/memberships/:id/freeze` | Yes | owner,rec | `{ freezeStart, freezeEnd?, reason? }` |
| POST | `/memberships/:id/unfreeze` | Yes | owner,rec | `{ unfreezeDate }` |

#### Example: Create Membership

```http
POST /api/v1/members/31032a4e-2d31-49cd-b860-e54678d52569/memberships
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "startDate": "2026-06-06",
  "discountAmount": 200
}
```

```json
{
  "success": true,
  "data": {
    "membership": {
      "id": "ms1a2b3c-d5e6-7890-abcd-ef1234567890",
      "memberId": "31032a4e-2d31-49cd-b860-e54678d52569",
      "gymId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "planId": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "planName": "Monthly",
      "startDate": "2026-06-06",
      "endDate": "2026-07-05",
      "status": "active",
      "totalAmount": "1500.00",
      "discountAmount": "200.00",
      "paidAmount": "0.00",
      "outstandingAmount": "1300.00",
      "notes": null,
      "createdAt": "2026-06-06T10:00:00.000Z",
      "updatedAt": "2026-06-06T10:00:00.000Z"
    }
  }
}
```

#### Example: List Membership History

```http
GET /api/v1/members/31032a4e-.../memberships
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "memberships": [
      {
        "id": "ms1...",
        "planName": "Monthly",
        "startDate": "2026-06-06",
        "endDate": "2026-07-05",
        "status": "active",
        "totalAmount": "1500.00",
        "discountAmount": "0.00",
        "paidAmount": "1000.00",
        "outstandingAmount": "500.00",
        "createdAt": "2026-06-06T10:00:00.000Z"
      }
    ]
  }
}
```

#### Example: Unfreeze Membership

```http
POST /api/v1/memberships/ms1.../unfreeze
Authorization: Bearer <token>
Content-Type: application/json

{ "unfreezeDate": "2026-06-20" }
```

```json
{
  "success": true,
  "data": {
    "membershipId": "ms1...",
    "previousEndDate": "2026-07-05",
    "newEndDate": "2026-07-15",
    "daysAdded": 10,
    "freezeId": "fz1..."
  }
}
```

---

### Payments (7 endpoints)

| Method | Path | Auth | Role | Query/Body |
|--------|------|------|------|------------|
| POST | `/payments` | Yes | owner,rec | `{ memberId, membershipId?, amount, paymentMethod, paymentDate }` |
| GET | `/payments` | Yes | any | `?page&limit&memberId&paymentMethod&dateFrom&dateTo&receiptNumber` |
| GET | `/payments/:id` | Yes | any | — |
| GET | `/payments/:id/receipt` | Yes | any | → PDF download |
| GET | `/memberships/:id/payments` | Yes | any | — |
| GET | `/members/:id/payments` | Yes | any | — |

#### Example: Record Payment

```http
POST /api/v1/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "memberId": "31032a4e-2d31-49cd-b860-e54678d52569",
  "membershipId": "ms1a2b3c-d5e6-7890-abcd-ef1234567890",
  "amount": 500,
  "paymentMethod": "upi",
  "paymentDate": "2026-06-06"
}
```

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay1a2b3-d5e6-7890-abcd-ef1234567890",
      "gymId": "a1b2c3d4-...",
      "memberId": "31032a4e-...",
      "memberName": "Amit Roy",
      "membershipId": "ms1a2b3c-...",
      "planName": "Monthly",
      "receiptNumber": "GYM-2026-000004",
      "amount": "500.00",
      "paymentMethod": "upi",
      "paymentStatus": "partial",
      "paymentDate": "2026-06-06",
      "notes": null,
      "createdAt": "2026-06-06T10:00:00.000Z"
    }
  }
}
```

#### Example: List Payments (paginated + filtered)

```http
GET /api/v1/payments?page=1&limit=5&paymentMethod=cash&dateFrom=2026-06-01
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "78439596-ffd0-4740-8d8a-b76855aca5c0",
        "memberId": "...",
        "memberName": "Vikram Singh",
        "membershipId": "...",
        "receiptNumber": "GYM-2026-000001",
        "amount": "2000.00",
        "paymentMethod": "cash",
        "paymentStatus": "paid",
        "paymentDate": "2026-06-06",
        "createdAt": "2026-06-06T10:00:00.000Z"
      }
    ]
  },
  "meta": {
    "total": 1,
    "page": 1,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

### Expense Categories (5 endpoints)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/expense-categories` | Yes | any |
| POST | `/expense-categories` | Yes | owner |
| GET | `/expense-categories/:id` | Yes | any |
| PATCH | `/expense-categories/:id` | Yes | owner |
| PATCH | `/expense-categories/:id/status` | Yes | owner |

---

### Expenses (4 endpoints)

| Method | Path | Auth | Role | Query/Body |
|--------|------|------|------|------------|
| POST | `/expenses` | Yes | owner,rec | `{ categoryId, amount, expenseDate, ... }` |
| GET | `/expenses` | Yes | any | `?page&limit&categoryId&dateFrom&dateTo&search&sortBy&sortOrder` |
| GET | `/expenses/:id` | Yes | any | — |
| PATCH | `/expenses/:id` | Yes | owner,rec | partial update |

#### Example: Create Expense

```http
POST /api/v1/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryId": "cat-uuid-here",
  "amount": 5200,
  "description": "June electricity bill",
  "expenseDate": "2026-06-05",
  "paymentMethod": "bank_transfer"
}
```

```json
{
  "success": true,
  "data": {
    "expense": {
      "id": "exp-uuid-here",
      "categoryId": "cat-uuid-here",
      "categoryName": "Electricity",
      "amount": "5200.00",
      "description": "June electricity bill",
      "expenseDate": "2026-06-05",
      "paymentMethod": "bank_transfer",
      "receiptUrl": null,
      "createdAt": "2026-06-05T10:00:00.000Z",
      "updatedAt": "2026-06-05T10:00:00.000Z",
      "createdByName": "Rahul Sharma"
    }
  }
}
```

---

### Dashboard (1 endpoint)

| Method | Path | Auth |
|--------|------|------|
| GET | `/dashboard` | Yes |

#### Example: Dashboard Response

```http
GET /api/v1/dashboard
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "members": {
      "total": 7,
      "active": 6,
      "frozen": 1,
      "expired": 0,
      "inactive": 0
    },
    "memberships": {
      "expiring7Days": 0,
      "expiring30Days": 0
    },
    "revenue": {
      "today": "2000.00",
      "month": "2000.00",
      "year": "2000.00"
    },
    "expenses": {
      "today": "0.00",
      "month": "66700.00",
      "year": "66700.00"
    },
    "profit": {
      "today": "2000.00",
      "month": "-64700.00",
      "year": "-64700.00"
    },
    "outstandingBalance": "1800.00",
    "recentPayments": [
      {
        "id": "aad9cc1c-...",
        "memberName": "Vikram Singh",
        "amount": "500.00",
        "paymentMethod": "card",
        "paymentDate": "2026-06-15",
        "receiptNumber": "GYM-2026-000003"
      }
    ],
    "recentExpenses": [
      {
        "id": "aa4d2d62-...",
        "categoryName": "Electricity",
        "amount": "5200.00",
        "description": "June electricity bill",
        "expenseDate": "2026-06-05"
      }
    ]
  }
}
```

---

### Reports (5 endpoints)

| Method | Path | Auth | Query |
|--------|------|------|-------|
| GET | `/reports/revenue` | Yes | `?period&from&to` |
| GET | `/reports/expenses` | Yes | `?period&from&to` |
| GET | `/reports/profit` | Yes | `?period&from&to` |
| GET | `/reports/memberships` | Yes | — |
| GET | `/reports/outstanding-balances` | Yes | — |

#### Example: Profit Report

```http
GET /api/v1/reports/profit?period=this_month
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2026-06-01",
      "to": "2026-06-06"
    },
    "revenue": "2000.00",
    "expenses": "66700.00",
    "profit": "-64700.00",
    "margin": -3235
  }
}
```

#### Example: Outstanding Balances

```http
GET /api/v1/reports/outstanding-balances
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "totalOutstanding": "1800.00",
    "count": 2,
    "balances": [
      {
        "membershipId": "ms1...",
        "memberId": "m1...",
        "memberName": "Vikram Singh",
        "memberPhone": "+919876543215",
        "planName": "Monthly",
        "totalAmount": "1500.00",
        "discountAmount": "200.00",
        "paidAmount": "0.00",
        "outstanding": "1300.00",
        "status": "active",
        "endDate": "2026-07-05"
      }
    ]
  }
}
```

---

### Automation (4 endpoints)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/automation/expiring-memberships` | Yes | owner |
| GET | `/automation/expired-memberships` | Yes | owner |
| GET | `/automation/daily-summary` | Yes | owner |
| GET | `/automation/backup-status` | Yes | owner |

#### Example: Daily Summary

```http
GET /api/v1/automation/daily-summary
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-06-06T12:16:21.545Z",
    "date": "2026-06-06",
    "revenue": {
      "total": "2000.00",
      "paymentCount": 1
    },
    "expenses": {
      "total": "0.00",
      "expenseCount": 0
    },
    "profit": "2000.00",
    "newMembersToday": 0,
    "membershipsExpiring7Days": 0,
    "recentPayments": [
      {
        "memberName": "Vikram Singh",
        "amount": "2000.00",
        "method": "cash",
        "receiptNumber": "GYM-2026-000001"
      }
    ]
  }
}
```

---

### Exports (8 endpoints)

| Method | Path | Auth | Query |
|--------|------|------|-------|
| GET | `/exports/members.csv` | Yes | — |
| GET | `/exports/members.xlsx` | Yes | — |
| GET | `/exports/revenue.csv` | Yes | `?period&from&to` |
| GET | `/exports/revenue.xlsx` | Yes | `?period&from&to` |
| GET | `/exports/expenses.csv` | Yes | `?period&from&to` |
| GET | `/exports/expenses.xlsx` | Yes | `?period&from&to` |
| GET | `/exports/outstanding-balances.csv` | Yes | — |
| GET | `/exports/outstanding-balances.xlsx` | Yes | — |

> Export endpoints return `Content-Type: text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` with `Content-Disposition: attachment` header. No JSON envelope.

---

### Health (2 endpoints)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| GET | `/health/db` | No |

#### Example: Health Check

```http
GET /health
```

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "uptime": 3847,
  "environment": "development"
}
```

---

## Error Response Examples

### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "phone": ["Invalid phone number format"],
      "name": ["String must contain at least 2 character(s)"]
    }
  }
}
```

### Not Found (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Member not found"
  }
}
```

### Conflict (409)

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "A member with this phone number already exists in your gym"
  }
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token expired"
  }
}
```

---

**Total: 62 endpoints** (+ 16 messaging endpoints planned, see `MESSAGING-DESIGN.md`)

### Audit Summary (2026-06-06)

| Check | Status |
|-------|--------|
| 1. Request schema exists for every write endpoint | ✅ Pass |
| 2. Response schema exists (OpenAPI) | ✅ Pass |
| 3. Success envelope `{success: true, data: {...}}` | ✅ Pass — all 62 endpoints |
| 4. Error envelope `{success: false, error: {code, message}}` | ✅ Pass |
| 5. Pagination `{meta: {total, page, totalPages, hasMore}}` | ✅ Pass — members, payments, expenses |
| 6. Dates as YYYY-MM-DD strings, timestamps as ISO 8601 | ✅ Pass |
| 7. Money as strings with 2 decimals (`"1500.00"`) | ✅ Pass — fixed 3 remaining issues |
| 8. IDs as UUID strings | ✅ Pass |

**Issues fixed in this audit:**
- `memberships.service.ts` — `listMemberMemberships` returned `outstandingAmount` as raw number → now `toMoney()`
- `automation.service.ts` — `getExpiredMemberships` returned `outstandingAmount` as raw number → now `toMoney()`
- `automation.service.ts` — `getDailySummary` returned `revenue.total`, `expenses.total`, `profit` as raw numbers → now `toMoney()`
