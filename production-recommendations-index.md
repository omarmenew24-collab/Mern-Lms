# Production Recommendations — Index

Central hub for LMS production-readiness reviews. Each document is **standalone** but cross-linked. **Documentation only** — implementation tracked separately in `production-app-checklist.md`.

**Last updated:** 2026-05-30

---

## Documents (recommended read order)

| # | Document | Scope | Top blockers |
|---|----------|-------|--------------|
| 1 | [Authentication & authorization](./production-recommendations.md) | JWT, sessions, RBAC, route guards | `getCourseProgress` IDOR; session revoke on suspend; dev flags |
| 2 | [Payments & finance](./production-recommendations-payment.md) | Stripe, manual pay, coupons, refunds | Non-Stripe refunds; enrollment race; webhook amount verify |
| 3 | [Content access & learning](./production-recommendations-content-access.md) | Lectures, tasks, submissions, progress | Same progress IDOR; centralize access helpers |
| 4 | [Certificates](./production-recommendations-certificates.md) | PDF issue, verify, approval | No revoke API; toggle without server checks; SSRF on branding |
| 5 | [Uploads & media](./production-recommendations-uploads-media.md) | Cloudinary, Vimeo, submissions | Multer limits; secure downloads; SSRF on profile fetch |
| 6 | [Admin & ops](./production-recommendations-admin-ops.md) | Dashboard, users, settings, CSV | Frontend admin guards; export audit; session revoke |
| 7 | [Notifications & email](./production-recommendations-notifications.md) | In-app, SMTP, announcements | SMTP required in prod; announcement email optional |
| 8 | [Course lifecycle & catalog](./production-recommendations-course-lifecycle.md) | Publish, delete, public catalog | Hard delete orphans data; admin publish bypass |
| 9 | [Community (ratings & comments)](./production-recommendations-community.md) | Stars, Q&A | Enrollment filter mismatch; rate limits |

---

## Cross-cutting themes

These issues appear in multiple documents — fix once, verify everywhere:

1. **`getCourseProgress` IDOR** — auth, content-access (disable checks or restore enrollment gate).
2. **Session revocation on user suspend/delete** — auth, admin-ops.
3. **Enrollment `status: active` vs legacy missing status** — content-access, community, notifications.
4. **Frontend route guards ≠ security** — auth, admin-ops (API is the real boundary).
5. **SSRF via URL fetch** — certificates (branding), uploads (profile picture).
6. **Refund → enrollment/certificate side effects** — payments, certificates, content-access.

---

## Suggested implementation phases

### Phase 1 — Security blockers
- Fix progress IDOR
- Revoke sessions on suspend/delete
- Production secrets + remove `DEV_ALLOW_UNVERIFIED_LOGIN`
- Submission upload limits + student role check

### Phase 2 — Money & access integrity
- Refund path for manual/free payments
- Unique enrollment index
- Certificate revoke + server-side approval rules
- Restrict hard course delete

### Phase 3 — Hardening & ops
- Admin UI `RequireAdmin` on all routes
- Export audit logging
- Rate limits (comments, ratings, announcements)
- Notification retention / optional announcement email

---

## Related project docs

- [`project-context.md`](./project-context.md) — architecture overview
- [`production-app-checklist.md`](./production-app-checklist.md) — launch checklist
- [`app-features.md`](./app-features.md) — feature inventory

---

## How to use these docs

1. Read **auth** and **payments** first — they gate everything else.
2. Before launch, walk **Phase 1** items and tick in `production-app-checklist.md`.
3. Use each doc’s **Production checklist** section as PR acceptance criteria when implementing fixes.
