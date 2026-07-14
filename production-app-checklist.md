# Production App Checklist

Reusable checklist for building or auditing production-grade applications.  
Use before launch, after major features, or when onboarding a new team member.

**How to use**
- Copy this file into any new repo, or keep it here as a living audit doc.
- Mark items `[x]` when done, `[ ]` when missing, `[~]` when partial.
- Score each section; anything marked **Critical** blocks production launch if incomplete.

---

## 1. Product Definition

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Target users and roles are documented (guest, user, operator, admin) | Yes |
| [ ] | Core user journeys are written end-to-end (3–5 journeys minimum) | Yes |
| [ ] | Business model / monetization is defined | If paid |
| [ ] | Non-goals are listed (what you will NOT build) | No |
| [ ] | Feature catalog matches what is actually shipped | Yes |

**Notes**

---

## 2. Architecture & Code Organization

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Clear backend layers: routes → controllers → services → models | Yes |
| [ ] | Clear frontend layers: pages → components → API → config/lib | Yes |
| [ ] | Shared integrations live in one place (payments, uploads, email) | Yes |
| [ ] | Domain modules are scoped (auth, billing, content — not god files) | Yes |
| [ ] | Environment variables documented (`.env.example` or docs) | Yes |
| [ ] | Entry points documented (`index.js`, `App.jsx`, etc.) | No |

**Notes**

---

## 3. Identity & Security

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Authentication: login, logout, session lifecycle | Yes |
| [ ] | Password reset + email verification (if email/password auth) | Yes |
| [ ] | OAuth/social login (if offered) with secure callback handling | If used |
| [ ] | Access token + refresh token pattern (or equivalent) | Yes |
| [ ] | Server-side session validation (not client-only trust) | Yes |
| [ ] | Authorization enforced on **every** sensitive API route | Yes |
| [ ] | UI role guards match backend permission checks | Yes |
| [ ] | Rate limiting on auth and sensitive endpoints | Yes |
| [ ] | Secrets never committed; keys rotated if leaked | Yes |
| [ ] | Input validation on all write endpoints | Yes |

**Notes**

---

## 4. Roles & Access Control (RBAC)

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Roles defined with explicit permissions per role | Yes |
| [ ] | Admin-only surfaces blocked for non-admins (API + UI) | Yes |
| [ ] | Creator/operator flows separated from end-user flows | If applicable |
| [ ] | Public vs authenticated vs privileged routes are distinct | Yes |
| [ ] | Single source of truth for access (subscription, enrollment, license, etc.) | Yes |
| [ ] | Access checks on every protected resource fetch/mutation | Yes |

**Notes**

---

## 5. Core Domain Flows

Document each flow as: **trigger → steps → side effects → final states → failure handling**.

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Onboarding / signup flow documented | Yes |
| [ ] | Primary value-delivery flow documented (learn, consume, collaborate, etc.) | Yes |
| [ ] | Content creation / publish flow documented (if applicable) | If applicable |
| [ ] | Entity state machines defined (draft → published, pending → active, etc.) | Yes |
| [ ] | Cross-entity side effects listed (what updates when X happens) | Yes |

**Notes**

---

## 6. Commerce & Payments (if applicable)

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Checkout flow end-to-end tested (happy path + failure) | Yes |
| [ ] | Webhook handler is **idempotent** (safe on retry/duplicate) | Yes |
| [ ] | Webhook signature verification enabled | Yes |
| [ ] | Payment record created/updated atomically with access grant | Yes |
| [ ] | Manual/offline payment path with admin approval queue (if needed) | If used |
| [ ] | Unified financial records regardless of payment rail | Yes |
| [ ] | Refund flow with policy + audit trail | If refunds |
| [ ] | Coupon/discount rules enforced server-side | If coupons |
| [ ] | Price calculated server-side (never trust client totals) | Yes |

**Notes**

---

## 7. Data & Persistence

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Core entities and relationships documented | Yes |
| [ ] | Indexes on frequently queried fields | Yes |
| [ ] | Unique constraints where needed (emails, codes, slugs) | Yes |
| [ ] | Soft delete vs hard delete policy defined | No |
| [ ] | Migration or schema change process exists | Yes |
| [ ] | Backups configured and restore tested | Yes |
| [ ] | PII handling documented (what you store, retention, deletion) | Yes |

**Notes**

---

## 8. Admin & Operations

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Admin dashboard or ops home exists | Yes |
| [ ] | Transaction / order monitoring | If paid |
| [ ] | Approval queues for manual workflows | If applicable |
| [ ] | User management (search, suspend, role change) | Yes |
| [ ] | Site/branding settings editable without deploy | If white-label |
| [ ] | CSV or report exports for finance/ops | If paid |
| [ ] | Dispute/chargeback or support case tooling | If applicable |

**Notes**

---

## 9. Notifications & Communication

| Status | Item | Critical |
|--------|------|----------|
| [ ] | In-app notifications for key events | Yes |
| [ ] | Email hooks for critical events (payment, reset password) | Yes |
| [ ] | Notification delivery decoupled from business logic (service layer) | Yes |
| [ ] | Announcement/broadcast capability (if needed) | If applicable |
| [ ] | Users can manage notification preferences | No |

**Notes**

---

## 10. Frontend UX Standards

Every list/detail/form screen should handle all states:

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Loading state | Yes |
| [ ] | Empty state | Yes |
| [ ] | Error state with actionable message | Yes |
| [ ] | Access denied / unauthorized state | Yes |
| [ ] | Pending/disabled state during mutations | Yes |
| [ ] | Success feedback after create/update/delete | Yes |
| [ ] | Form validation (client hints + server errors displayed) | Yes |
| [ ] | Responsive layout on mobile | Yes |
| [ ] | Dark mode (if product supports it) | If supported |
| [ ] | i18n: no hardcoded user-facing strings | Yes |
| [ ] | RTL support (if targeting Arabic/Hebrew markets) | If applicable |

**Notes**

---

## 11. API & Integration Quality

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Consistent error response shape | Yes |
| [ ] | HTTP status codes used correctly (401, 403, 404, 422, 500) | Yes |
| [ ] | API client handles token refresh automatically | Yes |
| [ ] | File upload limits and type validation | If uploads |
| [ ] | Third-party integrations fail gracefully (timeouts, retries) | Yes |
| [ ] | Health check endpoint for monitoring | Yes |

**Notes**

---

## 12. Observability & Reliability

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Structured logging on server (errors + key business events) | Yes |
| [ ] | Error tracking (Sentry or equivalent) | Yes |
| [ ] | Uptime monitoring | Yes |
| [ ] | Critical flows have alerting | If paid |
| [ ] | Graceful degradation when external services are down | Yes |

**Notes**

---

## 13. Testing & Release

| Status | Item | Critical |
|--------|------|----------|
| [ ] | Auth flows manually tested (login, refresh, logout, reset) | Yes |
| [ ] | Payment/webhook flow tested in staging with real provider sandbox | If paid |
| [ ] | Role permission matrix tested (each role × each sensitive action) | Yes |
| [ ] | CI runs lint/build on every push | Yes |
| [ ] | Staging environment mirrors production config | Yes |
| [ ] | Rollback plan documented | Yes |
| [ ] | Post-deploy smoke test checklist | Yes |

**Notes**

---

## 14. Documentation & Team Safety

| Status | Item | Critical |
|--------|------|----------|
| [ ] | `app-features.md` — what the product is and who it serves | Yes |
| [ ] | `project-context.md` — architecture, entities, flows, file map | Yes |
| [ ] | Invariants documented (what must never break) | Yes |
| [ ] | Change checklist for new features (routes, auth, side effects, docs) | Yes |
| [ ] | README with local setup steps | Yes |
| [ ] | `.env.example` with all required variables | Yes |

**Notes**

---

## 15. Invariants (write yours)

These are rules that must hold true across all changes. Example:

1. Do not alter auth or payment semantics without explicit review.
2. Access gating reads from a single source of truth (e.g. enrollment).
3. Webhook and payment handlers remain idempotent.
4. Admin exports remain backward-compatible.
5. Prefer domain-local changes over cross-cutting refactors.

**Your invariants**

1. 
2. 
3. 
4. 
5. 

---

## Pre-Launch Gate

All **Critical = Yes** items must be `[x]` before production launch.

| Gate | Pass? |
|------|-------|
| Security & auth complete | [ ] |
| Access control enforced API-side | [ ] |
| Payment flows idempotent (if paid) | [ ] |
| Admin/ops can run the business | [ ] |
| Critical UX states handled | [ ] |
| Docs + invariants written | [ ] |
| Backups + monitoring live | [ ] |

**Launch decision:** ☐ Go  ☐ No-go  
**Reviewed by:** _______________  **Date:** _______________

---

## Feature Change Checklist (use per PR)

Before merging any feature that touches product behavior:

- [ ] Backend route + controller + model/service wired
- [ ] Frontend API hook + page/component wired
- [ ] Role/authorization validated (UI + API)
- [ ] Payment/enrollment or other side effects reviewed
- [ ] Loading, empty, error, and pending states handled
- [ ] Translations added (no hardcoded strings)
- [ ] `project-context.md` / `app-features.md` updated if behavior changed
- [ ] Manual test steps recorded in PR description

---

## Quick Audit: This LMS Project

Snapshot audit against this checklist (update as the project evolves).

| Section | Status | Gap / action |
|---------|--------|--------------|
| Product definition | ~ | `app-features.md` exists; keep in sync with coupons, certificates, hub dashboards |
| Architecture | ✓ | Layered backend/frontend; services for complex domains |
| Identity & security | ✓ | Bearer + httpOnly refresh; session docs |
| RBAC | ✓ | student / teacher / admin roles |
| Core flows | ✓ | Purchase → enrollment; manual payment; refund documented |
| Commerce | ~ | Stripe + manual + coupons; verify coupon server-side rules |
| Admin & ops | ✓ | Finance, exports, manual payments, coupons admin |
| Notifications | ✓ | In-app notification service |
| Frontend UX | ~ | Audit each new page for all 6 states |
| Documentation | ✓ | `project-context.md` + `app-features.md` |
| Observability | ? | Confirm error tracking + backups in deployment |

**Legend:** ✓ good · ~ partial · ? verify · ✗ missing

---

## Copy Template for New Projects

When starting a new repo, copy these three files together:

1. `production-app-checklist.md` — this file
2. `app-features.md` — product definition
3. `project-context.md` — technical truth

Fill sections 1 and 15 first. Everything else follows from defined users, journeys, and invariants.
