# Supabase & Email Service Setup Guide

This guide outlines what you need to configure in Supabase and which email service to use for the MVP.

---

## 🗄️ Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Project Name**: `pain2gain` (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Wait for project to be provisioned (~2 minutes)

### 2. Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values to your `.env.local`:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret, for server-side operations)

### 3. Run Database Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

This creates:
- ✅ `sources` table (for Reddit post sources)
- ✅ `ideas` table (for generated product ideas)
- ✅ `subscriptions` table (for email subscriptions)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies

### 4. Verify Tables Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see three tables: `ideas`, `sources`, `subscriptions`
3. Check that indexes are created (go to **Database** → **Indexes**)

### 5. Configure Authentication (For T6 - Future)

When you're ready to implement authentication:

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable **Email** provider:
   - Toggle "Enable Email Provider" to ON
   - Configure email templates (optional for MVP):
     - **Confirm signup** - You can customize or use default
     - **Magic Link** - Optional, disable if not using
     - **Change Email Address** - Optional
     - **Reset Password** - Optional for MVP
3. **Email Auth Settings**:
   - **Enable Email Confirmations**: OFF (for MVP, skip email verification)
   - **Secure Email Change**: OFF (for MVP)
   - **Double Confirm Email Changes**: OFF (for MVP)

### 6. Row Level Security (RLS) Status

The migration already sets up RLS policies:
- ✅ Public read access to `ideas` and `sources` (anyone can view)
- ✅ Public insert access to `ideas` and `sources` (API can create)
- ✅ Public read access to `subscriptions` (will be restricted in T6 with auth)

**For MVP**: These policies are permissive enough. When you add auth (T6), you'll update them to be user-specific.

### 7. Optional: Database Extensions

If needed later, you can enable extensions in **Database** → **Extensions**:
- `uuid-ossp` (for generating UUIDs) - Already available by default
- `pgcrypto` (for encryption) - Available if needed

---

## 📧 Email Service Setup (For T7 - Email Subscriptions)

### Recommended: **Resend** (Best for MVP)

**Why Resend?**
- ✅ **Free tier**: 3,000 emails/month, 100 emails/day
- ✅ **Simple API**: Clean, modern SDK
- ✅ **Great developer experience**: Easy setup, good docs
- ✅ **Fast delivery**: Good deliverability
- ✅ **No credit card required** for free tier

**Setup Steps:**

1. **Sign up at [resend.com](https://resend.com)**
   - Use GitHub/Google to sign up quickly
   - No credit card needed

2. **Create API Key**:
   - Go to **API Keys** in dashboard
   - Click **Create API Key**
   - Name it: `pain2gain-production` (or `pain2gain-dev`)
   - Copy the key (starts with `re_...`)
   - ⚠️ **Save it immediately** - you can't see it again!

3. **Add to `.env.local`**:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

4. **Verify Domain (Optional for MVP)**:
   - For MVP, you can use Resend's default domain: `onboarding@resend.dev`
   - For production, you'll want to verify your own domain
   - This is optional for MVP testing

5. **Install SDK** (when implementing T7):
   ```bash
   npm install resend
   ```

**Usage Example** (for T7):
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'onboarding@resend.dev', // or your verified domain
  to: userEmail,
  subject: 'Fresh ideas from Pain2Gain',
  html: emailTemplate,
});
```

---

### Alternative Options (If Resend doesn't work)

#### Option 2: **SendGrid** (Free Tier: 100 emails/day)

**Pros:**
- ✅ Generous free tier (100/day = 3,000/month)
- ✅ Well-established, reliable
- ✅ Good deliverability

**Cons:**
- ❌ More complex setup
- ❌ Requires domain verification even for free tier
- ❌ More configuration needed

**Setup:**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your email address
3. Create API key in **Settings** → **API Keys**
4. Add to `.env.local`: `SENDGRID_API_KEY=SG.xxxxx`

#### Option 3: **Mailgun** (Free Tier: 5,000 emails/month for 3 months, then 1,000/month)

**Pros:**
- ✅ Good free tier
- ✅ No credit card required initially

**Cons:**
- ❌ Free tier limited to 3 months
- ❌ Requires domain verification
- ❌ More complex than Resend

**Setup:**
1. Sign up at [mailgun.com](https://mailgun.com)
2. Verify domain (can use subdomain)
3. Get API key from dashboard
4. Add to `.env.local`: `MAILGUN_API_KEY=xxxxx`

---

## 📋 Environment Variables Summary

Your `.env.local` should contain:

```bash
# OpenAI (for idea generation)
OPENAI_API_KEY=sk-xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx  # Optional, for admin operations

# Email Service (for T7)
RESEND_API_KEY=re_xxxxx  # Recommended
# OR
# SENDGRID_API_KEY=SG.xxxxx
# OR
# MAILGUN_API_KEY=xxxxx
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Supabase project created
- [ ] Database migration executed successfully
- [ ] Three tables visible in Table Editor: `ideas`, `sources`, `subscriptions`
- [ ] RLS policies enabled (check in **Authentication** → **Policies**)
- [ ] API credentials copied to `.env.local`
- [ ] Email service account created (Resend recommended)
- [ ] Email API key added to `.env.local`
- [ ] Test database connection works (run your app and check logs)

---

## 🚀 Next Steps

1. **T5 (Current)**: Database integration - tables are ready!
2. **T6 (Future)**: Enable Auth provider in Supabase when ready
3. **T7 (Future)**: Use Resend API to send subscription emails
4. **T8 (Future)**: Implement unsubscribe flow with tokens

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs)

---

## 💡 Tips

1. **For Development**: Use Resend's default domain `onboarding@resend.dev` - no verification needed
2. **For Production**: Verify your own domain in Resend for better deliverability
3. **Testing Emails**: Use your own email address for testing subscriptions
4. **Rate Limits**: Be aware of free tier limits (Resend: 100/day, SendGrid: 100/day)
5. **Supabase RLS**: Current policies allow public access. Tighten them when adding auth (T6)

