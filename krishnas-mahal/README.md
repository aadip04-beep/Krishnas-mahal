# Krishna's Mahal — घर निर्माण सहायक

A fast, installable Android app (PWA) for managing a family's two-floor house construction: every expense, every stage, every rupee — in Hindi and English, shared live between all family members. Runs 100% on free tiers (Supabase + Vercel/Netlify + GitHub).

## What it does

| Area | Features |
|---|---|
| **Expenses** | Add in 10 seconds (amount → category tile → save). Category, date, floor (Plot / Ground / First / Common), description, vendor (auto-suggest), quantity + unit, payment mode (Cash / UPI / Bank / Cheque / Udhaar), paid/unpaid with due date, bill photo from camera. Edit, delete, duplicate. Search + filters (category, floor, date range, user, unpaid only) + sort. |
| **Categories** | 16 Indian construction categories pre-loaded (Plot, Cement, Steel, Sand, Bricks, Aggregate, Labour, Electrical, Plumbing, Tiles, Doors & Windows, Paint, Architect, Govt fees, Misc…). **Anyone can add a new category any time** from the expense form. Admin can rename / recolour / change icon. |
| **Dashboard** | Total spent vs total budget with progress bar, this month, stages done, pending udhaar, spend by category (vs category budget), monthly trend chart, by floor, by family member, recent entries. |
| **Stages** | 17 construction milestones pre-loaded (Bhoomi Pujan → Griha Pravesh) by floor, tap to cycle Pending → In progress → Done, target dates, notes, overall % progress. |
| **Reports** | 8 reports: detailed, category, floor, vendor, month-wise (with running total), user-wise, pending payments, budget vs actual. Date range + category filter. **Excel (.xlsx)** download and **PDF** (via print → Save as PDF, Hindi text renders correctly). |
| **Admin panel** | Create users with just **name + username + password** (no email/OTP). Roles (admin/member), deactivate, category manager, per-category budgets, project settings (name, total budget, start date, plot area), activity log (who added/edited/deleted what). |
| **Multi-user, live** | Everyone sees the same data instantly (Supabase Realtime). Members can edit/delete only their own entries; admin can edit anything. |
| **Lag-free + offline** | Data cached on the phone → instant open. Entries added while offline are queued and synced automatically when back online. |
| **Hindi / English** | One-tap language switch, everywhere, including reports. |
| **Theme** | Krishna theme — Shyam midnight-blue, mor-pankh teal, pitambar gold. Dark & light mode (follows phone setting). |
| **Install** | Add to Home Screen on Android → opens full screen like a native app with its own icon. |

---

## Setup (≈ 20 minutes, all free)

### 1. Supabase (database + login) — free
1. Go to https://supabase.com → **New project** (choose region *Mumbai (ap-south-1)*, set any DB password, keep it).
2. Left menu → **SQL Editor** → **New query** → paste the whole content of `supabase/schema.sql` → **Run**. (Creates tables, default categories, stages, security rules, storage bucket.)
3. Left menu → **Authentication → Providers → Email**: turn **OFF** "Confirm email" (users log in with a username; no real emails are used). Save.
4. Left menu → **Project Settings → API**: copy **Project URL** and **anon public** key.

### 2. GitHub — free
1. Create a new repository (private is fine), e.g. `krishnas-mahal`.
2. Upload this folder (or `git init`, `git add .`, `git commit -m "Krishna's Mahal"`, push).  
   `node_modules`, `dist`, `.env` are ignored automatically.

### 3. Vercel (hosting) — free  *(Netlify works the same way)*
1. https://vercel.com → **Add New → Project** → import the GitHub repo.
2. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
3. **Environment Variables** → add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
4. **Deploy**. You get a link like `https://krishnas-mahal.vercel.app`.

   *Netlify:* Add new site → Import from GitHub → build `npm run build`, publish `dist`, same two environment variables. `public/_redirects` is already included.

### 4. First login (creates the admin)
Open the link on your phone. Because no user exists yet, the app shows **First-time setup** — enter your name, a username and a password. This becomes the **admin**.  
Then **More → Admin panel → Add user** to create logins for other family members (name + username + password only). Share those with them.

### 5. Install on Android
Open the link in Chrome → ⋮ menu → **Add to Home screen** (or tap *Install app* in More). It opens full-screen with the Krishna's Mahal icon.

> **Without Supabase keys the app runs in Demo mode** with sample data stored only on that phone — handy for trying it out first.

---

## Running locally (optional)
```bash
npm install
cp .env.example .env    # fill in the two Supabase values
npm run dev             # http://localhost:5173
```

## Updating the app later
Push a change to GitHub → Vercel/Netlify rebuilds automatically → phones get the update on next open (auto-updating service worker).

## Resetting a user's password
Supabase Dashboard → Authentication → Users → the user (`username@krishnasmahal.app`) → ⋯ → **Reset password** / set a new one. Users can also change their own password from **More → Change my password**.

## Free-tier limits (more than enough for one house)
Supabase free: 500 MB database, 1 GB file storage (bill photos), unlimited API calls for this scale; pauses after 7 days of **no** use — opening the app once a week keeps it active (or just click *Restore* in the dashboard). Vercel/Netlify free: 100 GB bandwidth/month.

## Project structure
```
supabase/schema.sql      database, default data, security policies (run once)
src/i18n/strings.js      every Hindi / English text — edit freely
src/lib/store.jsx        data layer: Supabase, cache, offline queue, realtime
src/lib/export.js        Excel + PDF generation
src/pages/               Dashboard, Expenses, Stages, Reports, Admin, More, Login
src/components/          ExpenseForm, ExpenseRow, UI kit (sheet, nav, icons, feather logo)
src/styles.css           Krishna theme design tokens (dark + light)
```

## Tech
React 18 + Vite 5 · Supabase (Postgres, Auth, Realtime, Storage) · Recharts · SheetJS · Lucide icons · vite-plugin-pwa. No paid services.
