# 🧠 Test Task: SaaS Product Idea Generator from Reddit

## 🎯 Goal

Using **Cursor**, develop a **Minimum Viable Product (MVP)** of a SaaS that helps aspiring founders come up with product ideas.  
The service monitors new and popular subreddits where users discuss their problems and, based on those insights, generates **product ideas with a viability score**.

---

## ⚙️ How It Should Work (MVP Flow)

1. **Source Collection:**  
   The service periodically finds or receives a list of "popular subreddits" where people share their pain points and problems.

2. **Signal Extraction:**  
   From recent posts/comments, extract formulations of problems, pain triggers, frequency, and engagement metrics.

3. **Idea Generation:**  
   The LLM generates short product ideas containing:
   - Product name  
   - Elevator pitch (1–2 sentences)  
   - Target audience  
   - The specific “pain” being solved

4. **Scoring Viability:**  
   The LLM (or a simple scoring formula) assigns a numerical or textual score based on parameters such as:
   - Pain intensity  
   - Willingness to pay  
   - Competition level  
   - TAM (simplified)

5. **Delivering Results:**  
   The user sees a feed of new ideas, can **subscribe to email updates** (filtered by topic, e.g. DevTools, Health, Education), or **unsubscribe** at any time.

⚠️ **Data Collection Note:** Reddit data may require API tokens or rate limits.  
You are allowed to:
- Use the official Reddit API, or  
- Use a small pre-prepared **mock/snapshot JSON dataset**.

---

## 💻 Functional Requirements (MVP)

- **Landing Page (1 page):**  
  A simple, clean landing inspired by [Tosnos SaaS Landing (Dribbble)](https://dribbble.com), not copied, just visually similar.  
  Should include: Hero section, Value proposition, and CTA ("Get Started").

- **Authentication:**  
  Registration, login, and logout using **Supabase Auth**.

- **Recommendations Feed:**  
  Display a list of fresh product ideas with a topic filter (e.g. DevTools, Health, Education).  
  Each idea should contain:
  - Title  
  - Short pitch (1–2 sentences)  
  - Main pain point or insight  
  - Source (subreddit/link)  
  - Score (0–100)  
  - “New” badge

- **Email Subscriptions:**  
  Allow users to subscribe and set topic filters (DevTools, Health, Education, etc.).

- **Email Integration:**  
  Connect to a popular email SaaS for sending digests (e.g. **Resend**, **Mailgun**, **SendGrid**, or **Postmark**).  
  Real sending isn’t mandatory, but API client and integration code must be correct.  
  API keys and credentials must be handled via `.env` variables.

- **Unsubscribe:**  
  Users should be able to unsubscribe via a link in the email or from their profile.

- **Idea Generation and Scoring via LLM:**  
  Use any popular Large Language Model (OpenAI, Gemini, etc.).  
  Prompts and configurations should be stored in a dedicated config file with typed response structures.

---

## 🧰 Technologies

- **GitHub** — repository with a proper commit history  
- **React + Node.js + TypeScript** (Next.js is welcome but optional)  
- **Supabase** — Auth + Postgres (Supabase Hosted is fine)  
- **LLM** — any major provider (OpenAI, Gemini, etc.)  
- **Email SaaS** — Resend / Mailgun / SendGrid / Postmark  
- **Cursor** — **mandatory**, since working in AI-assisted mode is part of the task

---

## 📦 Required Deliverables

1. **GitHub Repository:** Public or shared access.  
2. **`.cursor/` folder** containing:
   - `rules.md` — your architecture, code style, and commit conventions  
   - `PROMPTS.md` — 5–10 key prompts with short context and result samples  
   - Full history of your Cursor interactions (exported via external tools)
3. **README.md** including:
   - Local setup and launch instructions (`how to run locally`)

---

## 🕒 Prioritization Hint

You have up to **8 hours** to build as much functional value as possible.  
Prioritization of features is entirely up to you — this will also be part of the evaluation.

---

## 📤 What to Submit

- Link to your **GitHub repository**  
- Export or screenshots of your **Cursor history**  
- The **`.cursor/` folder**
