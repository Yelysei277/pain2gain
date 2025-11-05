# Pain2Gain — SaaS Idea Generator from Reddit

This document outlines the roadmap for the MVP (target: ~8 hours of work) and future ideas that show the product vision.

---

## 🎯 Current Tasks (MVP, ordered by priority)

### P0 — Project Bootstrap

- [ ] **T0: Initialize project**
  - Set up the repository.
  - Create Next.js + TypeScript app (App Router).
  - Configure ESLint/Prettier and environment variables.

---

### P1 — Core Analysis Engine (Backend)

- [ ] **T1: Mock Reddit data + type definitions**
  - Create `data/reddit-mock.json` with ~100 sample posts.
  - Define TypeScript interfaces for Reddit posts.
  - Implement a service to read and randomly select a subset of posts (e.g., 10).

- [ ] **T2: Two-step LLM analysis and idea generation**
  - Step 1: Filter posts for relevance (detect actual “pain/problem” posts).
  - Step 2: Generate product ideas from relevant posts.
  - Define `ProductIdea` type (title, pitch, pain, topic, score, source).
  - Save generated ideas to `data/ideas.json`.

- [ ] **T3: Minimal API endpoints**
  - `POST /api/generate` — run the LLM flow and update `ideas.json`.
  - `GET /api/ideas` — return all generated ideas.
  - (Optional) `GET /api/ideas/random` — return random subset.

---

### P2 — Frontend: Feed UI

- [ ] **T4: Feed Page**
  - Page `/feed`, public access.
  - Display list of ideas from API.
  - Filter by topic (`devtools`, `health`, `education`, `other`).
  - Clean UI: title, pitch, pain, score, “New” badge, source link.

---

### P3 — Database Integration

- [ ] **T5: Supabase Postgres**
  - Create tables: `ideas`, `sources`, `subscriptions`.
  - Migrate saving from `ideas.json` to DB.
  - Update API endpoints to use Supabase.

---

### P4 — Authentication & Email

- [ ] **T6: Supabase Auth**
  - Register / Login / Logout pages.
  - Protected route `/app/*` for personalized features.

- [ ] **T7: Email Subscriptions**
  - Connect to Resend / SendGrid / Mailgun.
  - Create table `subscriptions` (topics, active flag, unsubscribe token).
  - Add endpoints for managing subscriptions.
  - Add digest email sender (manual trigger is enough).

- [ ] **T8: Unsubscribe flow**
  - `/unsubscribe?token=...` page.
  - Deactivate subscription by token.
  - Update email template with unsubscribe link.
