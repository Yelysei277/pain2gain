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

---

### P5 — Real Data Integration

- [ ] **T9: Real Reddit API Integration**
  - Replace mock data with Reddit API calls (using Reddit API or Pushshift).
  - Set up Reddit API credentials and rate limiting.
  - Fetch posts from target subreddits (e.g., r/startups, r/entrepreneur, r/SaaS).
  - Handle API errors and fallback to cached data if needed.
  - Update `reddit-source.ts` to use real API instead of JSON file.

---

### P6 — Polish & Follow-ups

- [ ] **T10: Subscription management UI**
  - Add subscribe/unsubscribe UI to the profile area.
  - Support choosing topics and email address from the app.
  - Hook into `/api/subscriptions` and `/api/unsubscribe` routes.
  - Provide success/error feedback states.

- [ ] **T11: Feed “New” badge**
  - Display a “New” badge on idea cards per spec.
  - Define a freshness rule (e.g., created in last 24h or first load fallback).
  - Update idea typings and data flow if timestamps are required.

- [ ] **T12: LLM prompt configuration module**
  - Move LLM prompts and schema definitions into a dedicated config file.
  - Export typed prompt builders for filtering and idea generation.
  - Update `idea-generator.ts` to consume the shared config.

- [ ] **T13: Restrict idea feed to authenticated users**
  - Require sign-in before accessing the landing/feed experience.
  - Redirect anonymous visitors to `/auth` with a friendly message.
  - Ensure navigation, API routes, and client pages respect the auth guard.
  - Update docs and tests to reflect the gated flow.
