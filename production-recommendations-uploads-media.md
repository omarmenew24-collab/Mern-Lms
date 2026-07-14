# Production Recommendations — Uploads & Media

> **Related:** [Index](./production-recommendations-index.md) · [Content access](./production-recommendations-content-access.md) · [Certificates](./production-recommendations-certificates.md)

**Scope:** File uploads (submissions, profile/course images, manual receipts, certificates), Cloudinary, Vimeo TUS, external URLs on lectures, and client-side download patterns.  
**Date:** 2026-05-30  
**Verdict:** Cloudinary integration is **functional** but **upload routes lack consistent validation, size limits, and access control on downloads**. Several **SSRF-adjacent** patterns exist via URL fetch.

---

## Executive summary

| Area | Status | Summary |
|------|--------|---------|
| Submission upload + enrollment gate | ✅ Keep | `validateStudentTaskAccess` |
| Manual receipt MIME + 5MB limit | ✅ Keep | `manualPayment.route.js` |
| Lecture URL validation (`parseHttpUrl`) | ✅ Keep | Blocks `javascript:`, etc. |
| Vimeo init scoped to course owner | ✅ Keep | TUS placeholder + size cap in service |
| General submission multer | ❌ Fix | No size/type limits |
| Submission file URLs | ⚠️ Update | Public Cloudinary URLs; teacher download via client |
| Profile picture proxy | ⚠️ Update | Server fetches arbitrary user `picture` URL |
| Certificate branding fetch | ⚠️ Update | SSRF risk (see certificates doc) |
| `uploadFile` Cloudinary config | ⚠️ Update | No folder; `unique_filename: false` |

**Blockers:** submission multer limits + MIME filter; student role on upload; secure download path for submissions.

---

## Upload paths map

| Path | Route | Auth | Limits | Storage |
|------|-------|------|--------|---------|
| Task submission | `POST /upload` | Student (weak) | **None** | Cloudinary `raw` |
| Profile signup | `POST /signup` (image) | Public | **None** | Cloudinary image |
| Course image | `POST /createcourse`, PATCH course | Teacher/admin | **None** | Cloudinary image |
| Manual receipt | `POST .../proof` | Student | 5MB, JPG/PNG/WebP/PDF | `manual-receipts/` |
| Certificate PDF | Server-generated | N/A | N/A | `certificates/` raw |
| Lecture video | Vimeo TUS (browser→Vimeo) | Teacher owner | 300GB max in service | Vimeo |
| Legacy video | `uploadVideo` helper | Unused in routes? | N/A | Cloudinary video |

---

## What to KEEP

1. **`validateStudentTaskAccess`** — enrollment + task-in-course before submission upload/delete.
2. **Due-date lock** on upload and delete after deadline.
3. **`buildSubmissionOriginalFileName`** — sane download names on client.
4. **`parseHttpUrl`** on lecture video/link fields.
5. **Manual payment** multer `fileFilter` + `LIMIT_FILE_SIZE` handling.
6. **Vimeo** — `requireCourseTeacherOrAdmin` on init; `isVimeoUploadConfigured()` gate.
7. **Temp file cleanup** in Cloudinary helpers after upload.

---

## CRITICAL / HIGH

### C1. Submission upload — no file size or type limits

**File:** `backend/src/routes/upload.route.js`

```js
const upload = multer({ dest: "uploads/" });  // no limits
```

**Risk:** Huge files fill disk / Cloudinary quota; malware uploads; DoS.

**Fix:** Mirror manual payment: 5–10MB cap; allowlist PDF, DOCX, images, ZIP; reject executables.

---

### H1. Submission URLs are directly accessible

**File:** `uploadfile.controller.js` → `uploadFile()` returns Cloudinary `result.url`.

Teachers/students download via `submissionDownload.js` (client fetch to Cloudinary). **No auth on URL** if link leaks.

**Fix:** Private Cloudinary type + signed URLs from authenticated proxy endpoint, or short-lived signed URLs at list time.

---

### H2. `getuserpicture` — SSRF via profile picture URL

**File:** `auth.controller.js` — `getuserpicture` axios-gets `user.picture` URL.

User or admin could set picture to internal IP (if profile update allows arbitrary URL string).

**Fix:** Only allow Cloudinary URLs from your account; or upload-only avatars (no arbitrary URL fetch).

---

### H3. Upload route — weak student check

**File:** `uploadfile.controller.js` — `if (!req.user)` → 403 "Only students"; no `role === 'student'`.

**Fix:** Explicit student role check.

---

### H4. `getMySubmission` — no enrollment (see content-access H1)

Leaks task metadata by `taskId`.

---

### H5. Cloudinary `uploadFile` settings

**File:** `cloudinaryupload.js`

- `use_filename: true`, `unique_filename: false` — collision/overwrite risk across students
- No `folder` — flat namespace
- Returns `result.url` not always `secure_url`

**Fix:** Folder per domain (`submissions/`), `unique_filename: true`, always `secure_url`.

---

### H6. Local `uploads/` temp directory

Multer writes to `uploads/` before Cloudinary. Failed uploads may leave orphans; no periodic cleanup documented.

**Fix:** Cron or startup sweep; consider memory storage for small files.

---

## MEDIUM

| Issue | Notes |
|-------|--------|
| Vimeo upload quota abuse | Teacher can init many placeholders — rate limit per course |
| `uploadVideo` to Cloudinary | Helper exists; prefer single video strategy (Vimeo vs Cloudinary) |
| Announcement / branding image fetch | Same SSRF class as certificates |
| No virus scanning | Acceptable for MVP; document for enterprise |
| CORS on Cloudinary download | Client blob download fails if CORS wrong — fallback opens new tab |

---

## Production checklist

- [ ] Submission multer: size + MIME allowlist
- [ ] Student role on `POST /upload`
- [ ] Cloudinary folder + unique filenames for submissions
- [ ] Submission download auth strategy chosen
- [ ] Profile picture: upload-only or URL allowlist
- [ ] Temp `uploads/` cleanup job
- [ ] Vimeo token scoped minimally in production account
- [ ] Env: `CLOUDINARY_*` not committed

---

## Summary: keep vs update

| Keep | Update |
|------|--------|
| Enrollment-gated submission upload | Multer limits on `/upload` |
| Manual receipt validation | Secure submission downloads |
| `parseHttpUrl` on lectures | SSRF-safe profile/branding fetches |
| Vimeo owner scoping | Cloudinary folder/unique names |
| Due-date enforcement | Student role enforcement |

---

*Next in index: [Admin & ops](./production-recommendations-admin-ops.md)*
