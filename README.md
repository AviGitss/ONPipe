# Open Netrikkan — Sales Pipeline (Protected)

Next.js 14 + Supabase Auth + Vercel. Magic-link login with email allowlist.

## How access control works
1. User enters email on `/login`
2. App checks `allowed_users` table in Supabase — if email not found, access denied
3. If allowed, Supabase sends a magic link to their inbox
4. One click → they're in, session cookie set
5. Middleware protects every route except `/login` and `/auth/callback`

## Adding / removing users
Go to **Supabase Studio → Table Editor → allowed_users** and add or delete rows.
No redeploy needed — takes effect immediately.

```sql
-- Add a user
insert into allowed_users (email, name) values ('colleague@company.com', 'Name');

-- Remove a user
delete from allowed_users where email = 'colleague@company.com';
```

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "initial"
gh repo create on-pipeline --private --push --source .
```

### 2. Supabase — enable magic link emails
In Supabase Dashboard → Authentication → Providers → Email:
- Enable **magic link** ✓
- Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
- Add to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

### 3. Import in Vercel
1. vercel.com → Add New → Import `on-pipeline`
2. Framework: Next.js (auto-detected)
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`      = `https://jbisnfqijtmyhqgtogld.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbG...`
4. Deploy

## File structure
```
app/
  layout.tsx          — root layout
  globals.css         — brand palette + pill styles
  page.tsx            — protected pipeline table (server component)
  page.module.css     — table styles
  login/page.tsx      — magic link login form
  auth/callback/      — Supabase OAuth callback handler
components/
  SignOutButton.tsx   — client-side sign-out
lib/
  supabase.ts         — shared types + anon client
  supabase-server.ts  — cookie-based server client
  supabase-browser.ts — browser singleton client
middleware.ts         — route guard (redirects unauthenticated requests)
```

## Supabase tables
| Table | Purpose |
|---|---|
| `pipeline` | Deal data — edit rows to update the dashboard |
| `allowed_users` | Email allowlist — controls who can sign in |
