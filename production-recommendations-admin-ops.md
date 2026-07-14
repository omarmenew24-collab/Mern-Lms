# Production Recommendations — Admin Operations & Exports

> **Related:** [Index](./production-recommendations-index.md) · [Auth](./production-recommendations.md) · [Payments](./production-recommendations-payment.md)

**Scope:** Admin dashboard, user management, site/financial settings, CSV exports, finance overview, and admin UI route guards.  
**Date:** 2026-05-30  
**Verdict:** Admin **API routes are consistently `adminOnly`** — strong backend boundary. **Frontend guards are incomplete**; exports contain **PII**; user suspend **does not revoke sessions** (auth doc).

---

## Executive summary

| Area | Status | Summary |
|------|--------|---------|
| `adminOnly` on admin routes | ✅ Keep | Dashboard, users, settings, exports |
| Site settings patch validation | ✅ Keep | URLs, refund policy bounds, branding |
| CSV export structure | ✅ Keep | `sendCsv` helper, domain-specific columns |
| Finance overview aggregates | ✅ Keep | Payment-based revenue series |
| Frontend admin route guards | ⚠️ Update | Many pages unwrapped |
| User soft-delete side effects | ⚠️ Update | No session revoke (auth C2) |
| Export PII handling | ⚠️ Update | Full emails in CSV; no audit log |
| Admin role change API | ❌ Missing | No promote/demote endpoint found |
| `getUserById` for admin | ~ | Returns user including suspended/deleted? |

---

## Admin surface map

```mermaid
flowchart TB
    subgraph API adminOnly
        D[dashboardstats / analytics]
        U[users CRUD / snapshots]
        S[site-settings GET/PATCH]
        E[CSV exports]
        F[finance-overview via admin route]
    end

    subgraph Related adminOnly elsewhere
        P[payments admin routes]
        R[refunds admin]
        M[manual payments admin]
        C[coupons admin]
    end

    subgraph Frontend pages
        AD[/admin dashboard]
        US[/admin/users]
        FI[/admin/finance]
        SET[/admin/settings - guarded]
    end

    API adminOnly --> MongoDB
    Frontend pages -.->|often unguarded UX| API adminOnly
```

---

## What to KEEP

1. **All routes in `admin.route.js`** use `protectRoute` + `adminOnly`.
2. **`patchSiteSettings`** — validates refund window, percent caps, HTTP URLs for branding/guarantee links, certificate asset URLs.
3. **`CertificateBrandingEditor` + `SiteBrandingEditor`** — admin-only settings UI (partial route wrap).
4. **CSV exports** — users, courses, payments, enrollments, refunds, manual payments with sensible columns.
5. **`getFinanceOverview`** — aggregates succeeded payments only; monthly buckets.
6. **`softDeleteUser`** — blocks deleting admin accounts.
7. **`getStudentEnrolledCoursesForAdmin`** / learner snapshots — admin-only enrollment insight.

---

## CRITICAL / HIGH

### H1. Frontend admin pages without `RequireAdmin`

**File:** `frontend/src/App.jsx`

Unguarded (API still 403): `/admin`, `/admin/users`, `/admin/users/:userId`, `/admin/courses`, `/admin/courses/:courseId`, `/admin/finance`.

**Fix:** Wrap all `/admin/*` in `<RequireAdmin>` (UX + defense in depth).

---

### H2. User suspend — no session revocation

**File:** `admin.controller.js` — `softDeleteUser`  
**Cross-ref:** auth doc C2

Suspended users fail on next API call via `isUserAllowedAccess`, but sessions remain until natural expiry.

**Fix:** `UserSession.deleteMany({ user: id })` on suspend/delete.

---

### H3. CSV exports expose PII without audit trail

**File:** `adminExport.controller.js`

Exports include names, emails, payment amounts. No log of who exported when.

**Fix:** Audit log entry on export; optional download rate limit; document GDPR/data retention policy.

---

### H4. `exportUsersCsv` includes soft-deleted users inconsistently

Filter: `isDeleted: false OR not exists` — archived users still exported with `archived: yes`. OK for ops; document.

---

### H5. No admin API to change user role or unsuspend

Only soft-delete found. Reactivating suspended users may require DB manual edit.

**Fix:** `PATCH /admin/users/:id` with `{ status, role }` + guards (cannot demote last admin).

---

### H6. Dashboard stats include deleted courses inconsistently

Some aggregates use `isDeleted: { $ne: true }`; verify all KPIs align with finance exports.

---

## MEDIUM

| Issue | Notes |
|-------|--------|
| Admin can `setCoursePublished` without readiness checklist | Instructor publish validates checklist; admin PATCH does not |
| Admin course pages load without guard | Confusing 403 from API |
| `getUserById` returns user without filtering `isDeleted` | May be intentional for admin review |
| Site settings single `global` doc | OK for single-tenant; no multi-tenant |
| Financial settings split across pages | Document which fields affect refunds vs display |

---

## Endpoint matrix (admin.route.js)

| Route | Purpose |
|-------|---------|
| `GET /dashboardstats` | Counts snapshot |
| `GET /dashboard-analytics` | Monthly series |
| `GET /finance-overview` | Revenue aggregates |
| `GET /users`, `GET /users/:id` | User admin |
| `DELETE /users/:id` | Soft delete + suspend |
| `GET /users/:id/enrolled-courses` | Admin enrollment view |
| `GET /users/:id/learner-snapshots` | Progress snapshots |
| `GET/PATCH /site-settings` | Branding, refunds, categories |
| `GET /admin/exports/*` | CSV downloads |

---

## Production checklist

- [ ] All `/admin/*` frontend routes wrapped
- [ ] Session revoke on user suspend (auth)
- [ ] Export audit logging
- [ ] Admin user role/status PATCH (if ops needed)
- [ ] Document PII export policy for staff
- [ ] Verify finance dashboard matches Payment collection
- [ ] Admin actions tested: settings save, export CSV, soft-delete user

---

## Summary: keep vs update

| Keep | Update |
|------|--------|
| `adminOnly` on all admin API routes | Frontend `RequireAdmin` everywhere |
| Settings validation | Session revoke on suspend |
| CSV export modules | Export audit trail |
| Finance aggregates | User role/status admin API |
| Protect admin from self-delete | Admin publish vs checklist parity |

---

*See also: [Notifications](./production-recommendations-notifications.md)*
