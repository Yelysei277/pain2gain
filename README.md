# Pain2Gain

Transform pain points into business opportunities.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

3. Fill in your API keys in `.env.local`:
   - `OPENAI_API_KEY` - OpenAI API key for idea generation
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key
   - `EMAIL_API_KEY` - Email service API key (Resend or SendGrid)

4. Run the development server:
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
  lib/           # Pure logic (LLM, Reddit, Supabase, Email)
  types/         # Shared TypeScript interfaces
data/            # Mock/static data
docs/            # Project documentation
```

