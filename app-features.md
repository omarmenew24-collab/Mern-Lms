# App Features

## Purpose
Define exactly what this project is as a product: who it serves, which problems it solves, and what feature capabilities are currently included.

## Product Definition
This project is a branded LMS commerce-and-operations platform that allows a training organization to:
- market courses,
- sell access (online and manual),
- deliver learning,
- manage support and financial risk operations.

It is intentionally broader than a "course player" and includes operational tooling for real academy workflows.

## Target Users

### Primary buyers/operators
- Training businesses and academies.
- Schools/coaches needing a branded learning business stack.

### End-user roles
- Guest: discovers courses and trust content.
- Student: buys, learns, submits, and requests support/refund.
- Teacher: creates/publishes content and monitors learner progress.
- Admin: governs quality, finance, risk, and platform policy.

## Business Model and Monetization
- Paid courses with Stripe checkout.
- Manual/offline payment support for localized markets.
- Unified payment records for finance reporting and controls.

## Feature Catalog (Current)

### Public Experience
- Home and marketing content surfaces.
- About/trust sections.
- Public course and profile visibility.
- Editable branding/content from admin settings.

### Identity and Security
- Email/password authentication.
- Google sign-in.
- Email verification and password reset.
- Role-aware experience and permission handling.

### Course and Content Management
- Course authoring/editing.
- Category organization.
- Instructor publish (validation checklist; catalog visibility when published).
- Public catalog for approved/published courses.

### Learning Delivery
- Lecture-driven course consumption.
- Student course workspace.
- Progress-oriented learning sections.
- Certificate-related UI support where enabled.

### Assessments and Interaction
- Task/assignment creation.
- Student file submission flow.
- Ratings and comments on courses.

### Enrollment and Access
- Enrollment-backed content gating.
- Access granted through successful payment or approved manual flow.
- Enrollment state participates in support/finance decisions.

### Commerce
- Stripe checkout and confirmation lifecycle.
- Manual payment methods, orders, and proof review.
- Cart/checkout/billing success paths.

### Financial Operations
- Admin finance views and tracking.
- Refund policy + request processing.
- Chargeback/dispute handling.
- CSV exports for finance/ops workflows.

### Communication
- In-app notifications.
- Announcement broadcasting to learners/cohorts.
- Optional email-linked communication hooks.

## Core User Journeys

### Journey 1: Discover -> Purchase -> Learn
1. Guest discovers a course.
2. User authenticates.
3. User checks out (Stripe or manual).
4. Payment completes/gets approved.
5. Enrollment activates.
6. Student begins learning and submissions.

### Journey 2: Author -> Publish
1. Teacher creates course and content.
2. Teacher validates catalog readiness (built-in checklist) and publishes — course becomes visible in catalog.
3. Teacher tracks student outcomes.

### Journey 3: Post-Payment Operations
1. Admin monitors transactions.
2. Student can request refund.
3. Admin resolves refund request.
4. Chargeback cases are handled if they occur.
5. Data exported for accounting/reporting.

## Product Strengths
- Combines learning delivery with finance/risk operations.
- Handles both card-first and manual payment markets.
- Includes governance and reporting tools uncommon in lightweight LMS products.

## Current Non-Goals
- Full multi-tenant SaaS isolation model.
- Live virtual classroom/video conferencing suite.
- Complete SIS/ERP replacement.

## Source of Technical Truth
For architecture, entities, critical flows, and file-level mapping, use `project-context.md`.
