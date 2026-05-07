# Project Context

## Purpose
Single technical context file for this repository.  
Any AI agent should read this first to understand architecture, domain modules, critical flows, and safe change boundaries.

## Scope
- Includes backend and frontend.
- Covers where behavior lives, not every line-level implementation.
- Focuses on features that affect product behavior, security, and finance.

## Product Snapshot
Commercial LMS platform with:
- Public catalog/branding pages.
- Role-based learning and teaching workflows.
- Stripe + manual payment rails.
- Enrollment-gated access to learning content.
- Admin operations for finance, refunds, chargebacks, and exports.

## System Architecture

### Backend (`backend/`)
- Runtime: Node.js + Express.
- Data: MongoDB with Mongoose models.
- Entry: `backend/index.js`.
- Structure:
  - `src/routes/`: route registration.
  - `src/controllers/`: request + business flow handlers.
  - `src/models/`: persistence schemas.
  - `src/services/`: multi-step domain orchestration.
  - `src/lib/`: shared helpers/integrations.
  - `src/middlewares/`: auth, headers, rate limits.

### Frontend (`frontend/`)
- Runtime: React + Vite.
- Entry: `frontend/src/main.jsx`, `frontend/src/App.jsx`.
- Structure:
  - `src/pages/`: route-level experiences.
  - `src/components/`: reusable and feature UI.
  - `src/api/`: API calls/hooks by domain.
  - `src/lib/`: axios client + utility glue.
  - `src/config/`: app config constants/helpers.
  - `src/i18n/`: translation setup.

## Domain Map

### Identity & Access
- Backend: `auth.controller`, `auth.route`, `auth.middleware`, `user`, `userSession`.
- Frontend: `api/auth`, `lib/axios`, auth pages/components.
- Model:
  - Access token in bearer header.
  - Refresh token in httpOnly cookie.
  - Session documents enforce valid server-side sessions.

### Courses & Catalog
- Backend: `course.controller`, `courseCategory.controller`, related routes/models/helpers.
- Frontend: course pages/workspace components + `api/course`.
- Behavior:
  - Course authoring/editing.
  - Review/publish governance.
  - Public listing and detailed views.

### Lectures, Tasks, Submissions
- Backend: lecture/task/upload controllers/routes/models.
- Frontend: course sections/workspace pages + `api/lecture` + `api/task`.
- Behavior:
  - Learning content delivery.
  - Assignment creation and submission lifecycle.

### Ratings & Comments
- Backend: `rating.controller`, `comment.controller`, rating/comment models.
- Frontend: `api/rating`, `api/comments`, related UI blocks.

### Enrollments
- Backend source of truth: `enrollment.model`.
- Behavior:
  - Enrollment grants/blocks access.
  - Enrollment status interacts with payment/refund lifecycle.

### Payments & Billing
- Backend: `payment.controller`, `manualPayment.controller`, `webhook.controller`, payment/manual models.
- Frontend: billing pages + `api/payment` + `api/manualPayment`.
- Behavior:
  - Stripe checkout + webhook finalization.
  - Manual order + proof + admin approval queue.

### Refunds & Chargebacks
- Backend: `refund.controller`, `chargeback.controller`, services/models/routes.
- Frontend: admin/student refund and chargeback pages + APIs.
- Behavior:
  - Refund request/decision flow.
  - Chargeback tracking and evidence packaging.

### Admin Operations
- Backend: `admin.controller`, `adminExport.controller`, `admin.route`, `siteSettings`.
- Frontend: `pages/admin/*`, `components/admin/*`, `api/admin`, `api/adminExport`.
- Behavior:
  - Dashboard and governance actions.
  - CSV exports.
  - Branding/content settings.

### Notifications & Announcements
- Backend: notification controller/service/events/model.
- Frontend: notifications pages/components + `api/notifications`.

## Core Entities
- `User`
- `UserSession`
- `Course`
- `CourseCategory`
- `Lecture`
- `Enrollment`
- `Payment`
- `ManualPaymentMethod`
- `ManualPaymentOrder`
- `RefundRequest`
- `Chargeback`
- `Notification`
- `SiteSettings`

## Critical Flows

### Stripe Purchase -> Enrollment
1. Frontend requests PaymentIntent.
2. Student confirms payment.
3. Webhook receives Stripe success event.
4. Backend upserts payment record and activates enrollment.
5. Enrollment-based guards allow content access.

### Manual Payment -> Enrollment
1. Student creates manual order.
2. Student uploads payment proof.
3. Admin reviews and approves/rejects.
4. Approval creates financial record + active enrollment.

### Refund Flow
1. Student creates refund request.
2. Admin applies refund policy and decides.
3. Backend processes refund + audit logs.
4. Payment/enrollment states update.

### Chargeback Flow
1. Chargeback case recorded.
2. Admin reviews and prepares evidence.
3. Evidence/PDF export supports dispute handling.

## API and Integration Landmarks
- Stripe webhook: handled in `backend/src/controllers/webhook.controller.js`.
- Stripe raw-body ordering constraint: keep webhook handling compatible with signature verification in `backend/index.js`.
- Cloudinary upload utilities: `backend/src/lib/cloudinaryupload.js`.
- Frontend API base env: `VITE_API_URL`.
- Frontend Stripe key env: `VITE_STRIPE_PUBLISHABLE_KEY`.

## Frontend Route/Area Landmarks
- Auth flows: `frontend/src/pages/auth/*`
- Course learning: `frontend/src/pages/course/*`
- Billing: `frontend/src/pages/billing/*`
- Admin: `frontend/src/pages/admin/*`
- Notifications: `frontend/src/pages/notifications/*`
- Announcements: `frontend/src/pages/announcements/*`

## Backend Route/Area Landmarks
- Auth: `backend/src/routes/auth.route.js`
- Courses: `backend/src/routes/course.route.js`
- Lectures: `backend/src/routes/lecture.route.js`
- Payments: `backend/src/routes/payment.route.js`
- Manual Payments: `backend/src/routes/manualPayment.route.js`
- Refunds: `backend/src/routes/refund.route.js`
- Chargebacks: `backend/src/routes/chargeback.route.js`
- Notifications: `backend/src/routes/notification.route.js`
- Admin: `backend/src/routes/admin.route.js`

## Constraints and Invariants
1. Do not alter auth or payment semantics without explicit instruction.
2. Preserve enrollment as the single access-control source for paid learning.
3. Keep webhook/payment operations idempotent.
4. Preserve admin reporting/export compatibility.
5. Prefer domain-local changes over cross-cutting refactors.

## Change Checklist for Agents
Before finishing any feature:
1. Backend route/controller/model wired (if backend change is needed).
2. Frontend API + page/component wired (if frontend change is needed).
3. Role/authorization behavior validated.
4. Payment/enrollment side effects reviewed (if commerce touched).
5. Docs updated (`project-context.md` and `app-features.md`) for major behavior changes.

## Quick Start by Issue Type
- Login/refresh bug: auth controller + axios client.
- Access denied bug: enrollment checks in course/lecture/task flows.
- Checkout bug: payment controller + webhook + billing pages.
- Manual payment bug: manual payment controller/routes + admin manual page.
- Refund bug: refund controller/service + refund pages/APIs.
- Chargeback bug: chargeback controller/service + admin chargeback pages.
- Branding/content bug: site settings model + admin settings UI + public components.

## Maintenance Note
After significant refactors or new modules, update this file first so future AI agents can safely operate from a single context source.
