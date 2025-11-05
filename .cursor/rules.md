# rules.md — Pain2Gain Project Standards

This file defines the architectural and style rules for AI-assisted development in Cursor.

---

## ⚙️ Architecture Principles

1. **Framework:** Next.js (App Router) + TypeScript
   - Use server components where possible.
   - API routes live in `src/app/api/*`.

2. **File Structure:**

   ```
   src/
     app/
       feed/
       api/
     lib/
     types/
   data/
   docs/
   ```

3. **Code Separation:**
   - `lib/` → pure logic (LLM, Reddit, Supabase, Email)
   - `types/` → shared interfaces
   - `data/` → mock/static data

4. **External Services:**
   - OpenAI for idea generation
   - Supabase for database + auth
   - Resend or SendGrid for email

5. **Serverless-first design:**
   - Every async operation should be idempotent.
   - Prefer API endpoints over background loops.
   - For scheduled tasks, use Vercel Cron.

---

## 💻 Code Style Rules

1. **Language:** TypeScript (strict mode on)
2. **Imports:** Absolute imports from `src/`
3. **Formatting:** Prettier + ESLint (`semi: true`, `singleQuote: true`)
4. **Naming conventions:**
   - Files: kebab-case
   - Classes: PascalCase
   - Functions & vars: camelCase
5. **No `any` types**
6. **Return Promises explicitly for async functions**
7. **Error Handling:** wrap all LLM and DB calls with `try/catch`
8. **Commits:**
   ```
   feat: add idea generation logic
   fix: correct API response format
   refactor: improve type safety
   docs: update README
   ```

---

## 🧠 AI Collaboration Rules

- AI must **follow the tasks in `/docs/tasks/*.md`** exactly.
- Never change architecture or folder layout without explicit approval.
- When unsure, AI must ask for clarification instead of guessing.
- When generating code:
  1. Read the task file (e.g. `T2.md`).
  2. Plan implementation in steps.
  3. Generate complete, type-safe code.
  4. Use concise, meaningful comments.

---

## ✅ Quality Criteria

- Code runs locally with `npm run dev`
- Lint passes (`npm run lint`)
- Consistent naming and folder structure
- Each feature has a clear API route and UI component

---

## 🔒 Security & Env Rules

- Never expose real API keys
- Use `.env.local` for all secrets
- Mock or sanitize sensitive data in examples
