# Pain2Gain

Transform pain points into business opportunities.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp env.local.example .env.local
   ```

3. Set up Supabase database:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your URL and anon key
   - Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
   - This creates the `ideas`, `sources`, and `subscriptions` tables
   - Enable Authentication: Go to Authentication > Providers and enable "Email" provider

4. Fill in your environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL (required)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key (required)
   - `OPENAI_API_KEY` – OpenAI key for idea generation (required)
   - `RESEND_API_KEY` – Resend API key for digest emails (required to send email)
   - `RESEND_FROM_EMAIL` – Verified sending address for Resend (optional; defaults to `onboarding@resend.dev`)
   - `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` – Reddit credentials for live data (optional; falls back to bundled mock data)
   
   **Note:** We use `NEXT_PUBLIC_` prefix for Supabase variables because they're needed on both server and client. The anon key is meant to be public - security comes from Row Level Security (RLS) policies.

5. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
  app/
    feed/        # Feed page
    api/         # API routes
  assets/        # Static assets (images, icons, fonts)
  lib/           # Pure logic (LLM, Reddit, Supabase, Email)
  types/         # Shared TypeScript interfaces
data/            # Mock/static data
docs/            # Project documentation
```
