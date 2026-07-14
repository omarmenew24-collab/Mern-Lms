# Production Recommendations — Authentication & Authorization

> **Related:** [Index](./production-recommendations-index.md) · [Payments](./production-recommendations-payment.md) · [Content access](./production-recommendations-content-access.md) · [Certificates](./production-recommendations-certificates.md) · [Uploads](./production-recommendations-uploads-media.md) · [Admin](./production-recommendations-admin-ops.md) · [Notifications](./production-recommendations-notifications.md) · [Course lifecycle](./production-recommendations-course-lifecycle.md) · [Community](./production-recommendations-community.md)

**Scope:** Identity, session, and access-control only (`auth.*`, `userSession`, axios auth client, route guards).  
**Date:** 2026-05-30  
**Verdict:** The **core auth architecture is production-viable** and worth keeping. Several **authorization gaps and operational risks** must be addressed before treating this as production-hardened.

---

## Executive summary

| Area | Status | Summary |
|------|--------|---------|
| Auth architecture (JWT + cookie + DB session) | ✅ Keep | Solid SPA pattern with rotation and revocation |
| Route-level RBAC middleware | ✅ Keep | `protectRoute`, `adminOnly`, `adminOrTeacherOnly` are correct |
| Resource-level authorization | ⚠️ Update | Duplicated helpers; at least one endpoint has checks disabled |
| Session lifecycle on admin actions | ⚠️ Update | Suspend/delete user does not proactively revoke sessions |
| Frontend route guards | ⚠️ Update | Inconsistent; UX-only, not a security boundary |
| Secrets, headers, password policy | ⚠️ Update | Weak defaults and missing HTTP hardening |
| Observability & audit | ❌ Add | No auth event logging or replay detection |

**Blockers before production launch:** fix `getCourseProgress` IDOR, revoke sessions on user suspend/delete, set strong production secrets, remove dev auth flags, unify admin UI guards.

---

## What to KEEP (do not rewrite)

These patterns are correct and align with industry practice. Preserve them unless there is a strong reason to change.

### 1. Hybrid token + session model

- **Access JWT** (15m) in memory + **refresh JWT** (7d) in httpOnly cookie.
- **`UserSession`** document binds tokens to a revocable server session (`sid`).
- **Refresh rotation** via `refreshTokenVersion` (`rv`) with atomic `findOneAndUpdate`.

**Files:** `backend/src/lib/utils.js`, `backend/src/models/userSession.model.js`, `backend/src/controllers/auth.controller.js`, `frontend/src/lib/axios.js`, `frontend/src/lib/initializeAuth.js`

### 2. Load identity from DB on each request

`loadUserFromAccessPayload()` re-validates session + user and reads **role from DB**, not from JWT claims alone. Admin role changes and account status apply on the next request.

**File:** `backend/src/middlewares/auth.middleware.js`

### 3. Account gate via `isUserAllowedAccess`

Blocks deleted/suspended users at login, refresh, and API access.

**File:** `backend/src/lib/userAccess.js`

### 4. CSRF mitigation on cookie-mutating routes

`requireCookieAuthHeader` + frontend `X-Cookie-Auth` on `/refresh` and `/logout` prevents simple cross-site POST abuse while cookies are sent.

**Files:** `backend/src/middlewares/cookieAuthHeader.middleware.js`, `frontend/src/config/cookieAuthHeader.js`

### 5. Rate limiting on sensitive auth endpoints

Login, signup, refresh, payment writes, and global API cap.

**File:** `backend/src/middlewares/rateLimit.middleware.js`

### 6. Login hardening details

- bcrypt with timing-safe dummy hash when user not found (reduces user-enumeration via timing).
- Email verification gate when SMTP is configured.
- Password reset invalidates **all** `UserSession` rows for that user.

**File:** `backend/src/controllers/auth.controller.js`

### 7. Layered authorization concepts

- **RBAC:** `student` | `teacher` | `admin`
- **Ownership:** course `teacher` must match requester
- **Enrollment:** active `Enrollment` for learner content/actions
- **Self vs admin:** profile updates, enrollment checks

These concepts are correct for an LMS. The issue is **inconsistent enforcement**, not the model itself.

### 8. Axios 401 refresh interceptor

Only retries when the original request sent Bearer auth; skips refresh/logout loops. Syncs user on refresh.

**File:** `frontend/src/lib/axios.js`

---

## CRITICAL — fix before production

### C1. `getCourseProgress` — authorization disabled (IDOR)

**Severity:** Critical  
**File:** `backend/src/controllers/course.controller.js` (~lines 797–869)

Access control checks are **commented out**. Any authenticated user can:

- Read **any student's** progress for **any course** via `?studentId=...`
- Read progress without being enrolled, the course teacher, or admin

The variables `isRequesterEnrolled`, `isAdmin`, and `isOwnerTeacher` are computed but never enforced.

**Fix:**

```js
if (!isAdmin && !isOwnerTeacher && !isRequesterEnrolled) {
  return res.status(403).json({ message: "Access denied" });
}
if (
  String(studentId) !== String(req.user._id) &&
  !isAdmin &&
  !isOwnerTeacher
) {
  return res.status(403).json({ message: "Access denied" });
}
```

Remove debug `console.log` calls in this handler before production.

---

### C2. User suspend/delete does not revoke sessions proactively

**Severity:** High (elevated to critical for admin compliance scenarios)  
**File:** `backend/src/controllers/admin.controller.js` — `softDeleteUser`

When an admin soft-deletes a user (`isDeleted: true`, `status: suspended`), **no `UserSession` documents are deleted**.

**Current mitigation:** Next API call fails via `isUserAllowedAccess` in `loadUserFromAccessPayload`. That is acceptable for API access but:

- Refresh token remains valid until next refresh attempt (then blocked).
- No explicit “force logout everywhere” signal.
- No audit trail that sessions were revoked.

**Fix:** After suspend/delete (and on any future “disable account” action):

```js
await UserSession.deleteMany({ user: user._id });
```

Apply the same pattern if you add a “suspend without delete” admin action.

---

### C3. `DEV_ALLOW_UNVERIFIED_LOGIN` must never ship to production

**Severity:** Critical if misconfigured  
**File:** `backend/src/controllers/auth.controller.js`

Allows password login without verified email when `NODE_ENV=development` and `DEV_ALLOW_UNVERIFIED_LOGIN=true`.

**Fix:**

- Document in `.env.example` as dev-only.
- Add a startup guard in `backend/index.js` that **throws or exits** if this flag is set when `NODE_ENV=production`.
- Never set the flag in production env configs.

---

### C4. Weak default for cookie-auth header secret

**Severity:** High  
**Files:** `backend/src/lib/cookieAuthHeader.js`, `frontend/src/config/cookieAuthHeader.js`

Default value is `"1"` when `COOKIE_AUTH_HEADER_VALUE` / `VITE_COOKIE_AUTH_HEADER_VALUE` are unset. Predictable CSRF header weakens protection on `/refresh` and `/logout`.

**Fix:**

- Require a random secret in production (min 32 bytes).
- Fail server startup if unset in production.
- Ensure frontend and backend use the **same** value via env (not committed to git).

---

## HIGH priority — update soon

### H1. Duplicated authorization helpers (maintenance risk)

**Severity:** High (leads to missed checks on new endpoints)

`requireCourseTeacherOrAdmin` is copy-pasted in at least:

- `backend/src/controllers/course.controller.js`
- `backend/src/controllers/lecture.controller.js`
- `backend/src/controllers/task.controller.js`
- `backend/src/controllers/certificate.controller.js`
- `backend/src/controllers/vimeoLecture.controller.js`

**Risk:** New routes may forget checks; fixes in one file do not propagate.

**Fix:** Extract to `backend/src/lib/courseAccess.js` (or `middlewares/courseAccess.middleware.js`):

- `requireCourseTeacherOrAdmin(req, courseId)`
- `requireStudentEnrolled(req, courseId)`
- `requireSelfOrAdmin(req, userId)`

Use consistently in all controllers.

---

### H2. Frontend admin routes mostly unguarded

**Severity:** High (UX/confusion; defense relies 100% on API)

**File:** `frontend/src/App.jsx`

Only some admin routes use `<RequireAdmin>`:

- Wrapped: `/admin/settings`, `/admin/settings/financial`, `/admin/refunds`, `/admin/manual-payments`, `/admin/coupons`, `/announcements/send`
- **Not wrapped:** `/admin`, `/admin/users`, `/admin/users/:userId`, `/admin/courses`, `/admin/courses/:courseId`, `/admin/finance`

Backend `adminOnly` correctly blocks non-admins, but users see admin UI flash or confusing error states.

**Fix:**

- Wrap **all** `/admin/*` routes in `<RequireAdmin>`.
- Add `<RequireAuth>` for student/teacher workspace routes where appropriate.
- Treat frontend guards as **UX only**; never as security.

---

### H3. Persisted user profile in localStorage can be stale

**Severity:** Medium–High  
**File:** `frontend/src/store/userstore.js`

User object (including `role`) is persisted via Zustand `persist`. Access token is memory-only.

**Risk:**

- UI shows admin/teacher nav after role demotion until refresh completes.
- `initializeAuth` clears user on 401 refresh failure, but network errors keep stale persisted user.

**Fix options (pick one or combine):**

1. Stop persisting `role`; persist only non-security display fields.
2. Always treat `refresh` response user as source of truth on boot (already partially done).
3. Add a lightweight `GET /me` or rely on refresh and **do not** render role-sensitive nav until `authReady`.

---

### H4. Password policy too weak

**Severity:** Medium–High  
**Files:** `backend/src/controllers/auth.controller.js`, `backend/src/models/user.model.js`

Minimum length is **6 characters**; no complexity or breach-check requirements.

**Fix for production:**

- Minimum 8–12 characters (document choice).
- Consider `zxcvbn` or similar strength meter on frontend.
- Optional: HaveIBeenPwned k-anonymity check on signup/reset.

---

### H5. Login identifier is `name`, not email

**Severity:** Medium (product + security UX)

Users log in with **username (`name`)**, while signup requires email. Unusual and error-prone.

**Fix:** Support email login (keep name as display handle), or clearly document username-only login. Avoid exposing whether email vs name exists in error messages (currently generic “Invalid credentials” — good).

---

### H6. Google OAuth links to existing email without re-authentication

**Severity:** Medium  
**File:** `backend/src/controllers/auth.controller.js` — `googleauth`

If a password account exists for an email, Google sign-in **links `googleId`** and sets `emailVerified: true` without verifying the existing password.

**Risk:** If an account was created with a wrong/unowned email, the real Google owner can take over.

**Fix options:**

- Require password confirmation before linking Google to an existing password account.
- Or send a “link Google to your account” confirmation email before merging.

---

### H7. Hard delete course vs soft-delete elsewhere

**Severity:** Medium (data integrity / audit)  
**File:** `backend/src/controllers/course.controller.js` — `deletecourse`

Teachers/admins **hard delete** courses, lectures, and tasks. Admin has separate `softDeleteCourse`. Inconsistent lifecycle.

**Fix:** Prefer soft-delete for production; restrict hard delete to admin + confirmation; preserve enrollments/payments audit trail.

---

### H8. CORS origins hardcoded

**Severity:** Medium  
**File:** `backend/index.js`

Allowed origins are fixed strings. New deployments require code changes.

**Fix:** `CORS_ORIGINS` env var (comma-separated). Fail startup if empty in production.

---

### H9. No security HTTP headers

**Severity:** Medium  
**File:** `backend/index.js`

No `helmet` or equivalent (CSP, X-Frame-Options, etc.).

**Fix:** Add `helmet` with CSP tuned for your frontend, Stripe, Cloudinary, Vimeo embeds.

---

### H10. Shared JWT secret for access tokens and email verification

**Severity:** Low–Medium  
**File:** `backend/src/lib/emailVerification.js`

Email verification tokens sign with `ACCESS_TOKEN_SECRET`.

**Fix:** Use a dedicated `EMAIL_VERIFICATION_SECRET` (and separate secret for password reset if applicable). Limits blast radius if one secret leaks.

---

## MEDIUM priority — improve quality & scale

### M1. DB round-trip on every authenticated request

Each `protectRoute` call: JWT verify + `UserSession.findOne` + `populate user`.

**Fine for moderate traffic.** At scale:

- Cache session validity briefly (Redis) with invalidation on logout/suspend.
- Or accept tradeoff and monitor MongoDB load.

---

### M2. Refresh token replay detection incomplete

On failed refresh (stale `rv`), the session is **not** deleted — request returns 403.

**OAuth best practice:** Treat refresh reuse as possible theft → **invalidate entire session** (and optionally all user sessions).

**File:** `backend/src/controllers/auth.controller.js` — `refreshController`

---

### M3. No session management UX

Users cannot:

- View active sessions / devices
- Revoke other sessions
- See “logged in elsewhere”

Consider session list + “log out all devices” (delete all `UserSession` for user).

---

### M4. No auth audit logging

Missing structured logs for:

- Login success/failure (user id, IP, user-agent — avoid logging passwords/tokens)
- Refresh rotation failures
- Admin suspend/delete
- Role changes (when implemented)

Required for production incident response.

---

### M5. `getStudentSubmissionsByCourse` — admin bypasses teacher ownership check

**File:** `backend/src/controllers/course.controller.js`

Admins can read any student's submissions for any course. Likely **intentional** for support — document as admin capability; ensure admin actions are audited.

Teachers are correctly scoped via `requireCourseTeacherOrAdmin`.

---

### M6. Debug logging in production paths

Examples:

- `getCourseProgress`: `console.log("🔥 getCourseProgress HIT")`
- `auth.middleware.js`: logs JWT error messages

**Fix:** Use structured logger; redact tokens; disable verbose logs in production.

---

### M7. Route comment acknowledges missing protection

**File:** `backend/src/routes/course.route.js` line 57

```js
// this needs a protection
router.post("/togglecertificate/:courseId/:studentId", protectRoute, toggleCertificatePermission)
```

Controller **does** enforce teacher/admin + ownership. Remove misleading comment or add integration test to prevent regression.

---

### M8. Enrollment filter inconsistency

Some checks use:

```js
{ status: "active" }
```

Others use legacy OR:

```js
{ $or: [{ status: "active" }, { status: { $exists: false } }] }
```

**Fix:** Standardize on one helper (`activeEnrollmentFilter`) everywhere to avoid accidental lockout or over-permission.

---

## LOW priority — nice to have

| Item | Notes |
|------|--------|
| MFA / 2FA | Not present; add for admin accounts first |
| Account lockout after N failures | Rate limit only; no per-account lock |
| CAPTCHA on signup/login | Reduces bot signups |
| OIDC / Auth0 / Clerk | Outsource if team prefers not to maintain auth |
| Fine-grained permissions | e.g. finance-admin vs content-admin |
| Certificate pinning / mTLS | Usually unnecessary for this stack |

---

## Authorization matrix (reference)

Backend is the source of truth. Notable patterns:

| Endpoint pattern | Auth | Authz rule |
|------------------|------|------------|
| `GET /courses` | Public | Published catalog only |
| `GET /courses/:courseId/public` | Public | Published course marketing view |
| `GET /courses/:courseId/comments` | Public | Published courses; policy flags |
| `GET /courses/:courseId` | Auth | Teacher (own) or admin only — **not students** |
| `GET /course/:courseId/lectures` | Auth | Admin, owner teacher, or enrolled student |
| `GET /progress/:courseId` | Auth | **BROKEN — fix C1** |
| `GET /progress/bulk/:courseId` | Auth | Admin or owner teacher ✅ |
| `POST /courses/:courseId/tasks` | Auth | Teacher/admin + ownership in controller |
| `GET /admin/*` | Auth + adminOnly | ✅ |
| `POST /refresh`, `POST /logout` | Cookie + custom header | Session rotation / delete |

---

## Frontend checklist

| Item | Action |
|------|--------|
| Wrap all `/admin/*` in `RequireAdmin` | Update |
| Add `RequireAuth` for workspace/billing where needed | Update |
| Do not persist security-sensitive fields blindly | Update |
| Keep access token in memory only | **Keep** |
| Rely on API 403 for real enforcement | **Keep** |
| Show clear “session expired” on refresh failure | Optional UX |

---

## Production environment checklist

Before deploy, verify:

- [ ] `NODE_ENV=production`
- [ ] `DEV_ALLOW_UNVERIFIED_LOGIN` unset or `false`
- [ ] Strong random `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` (≥ 32 bytes each)
- [ ] `COOKIE_AUTH_HEADER_VALUE` set and matched on frontend
- [ ] `CORS_ORIGINS` includes only production frontend URL(s)
- [ ] HTTPS on API and frontend (`secure: true` cookies, `SameSite=None` cross-site)
- [ ] SMTP configured → email verification enforced
- [ ] Rate limit env vars reviewed for expected traffic
- [ ] **C1** `getCourseProgress` access control restored
- [ ] **C2** Session revocation on user suspend/delete
- [ ] Remove debug `console.log` from auth and progress handlers
- [ ] `helmet` or equivalent security headers enabled

---

## Recommended implementation order

1. **C1** — Fix `getCourseProgress` IDOR (same day)
2. **C2** — Revoke sessions on suspend/delete
3. **C3, C4** — Production env guards and secrets
4. **H1** — Centralize `requireCourseTeacherOrAdmin` / enrollment helpers
5. **H2, H3** — Frontend admin wrappers + stale user handling
6. **H4–H9** — Password policy, CORS, helmet, Google linking review
7. **M2, M4** — Refresh reuse detection + audit logging

---

## Summary: keep vs update

| Keep | Update / add |
|------|----------------|
| JWT access + httpOnly refresh + DB session | Fix `getCourseProgress` authorization |
| Refresh rotation (`rv`) | Revoke sessions on admin suspend/delete |
| DB-backed role on each request | Centralize authorization helpers |
| `isUserAllowedAccess` gate | Strong secrets + env-based CORS |
| Cookie auth custom header | Frontend admin route guards (UX) |
| Rate limits on auth endpoints | Password policy + helmet |
| bcrypt timing-safe login | Google account linking policy |
| Axios refresh interceptor | Audit logging + refresh replay invalidation |
| Enrollment + ownership model | Remove dev flags and debug logs |

---

*This document covers **authentication and authorization only**. Full index: [`production-recommendations-index.md`](./production-recommendations-index.md).*
