# ⚡ Street Tasker — Complete Setup Guide

## Overview

Street Tasker is a full-stack marketplace platform connecting people who need tasks done with local taskers. This guide covers everything from database setup to live deployment.

---

## STEP 1 — Create your Supabase project

1. Go to **https://supabase.com** and sign up for a free account
2. Click **"New project"**
3. Fill in:
   - **Name:** Street Tasker
   - **Database password:** (save this somewhere safe)
   - **Region:** Choose closest to Nigeria (e.g. Europe West)
4. Wait ~2 minutes for the project to spin up

---

## STEP 2 — Run the database schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** (Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned" — that means it worked ✅

---

## STEP 3 — Create storage buckets

1. In Supabase dashboard, click **"Storage"**
2. Click **"New bucket"**
3. Create bucket named `avatars` — check **"Public bucket"** ✅
4. Create bucket named `task-photos` — check **"Public bucket"** ✅

---

## STEP 4 — Get your API credentials

1. In Supabase dashboard, click **"Project Settings"** (gear icon)
2. Click **"API"** in the left sidebar
3. Copy:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long JWT string
4. Open `js/config.js` in this project
5. Replace these two lines at the top:
   ```js
   const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
   const SUPABASE_ANON = 'YOUR_ANON_KEY';
   ```
   With your actual values.

---

## STEP 5 — Set up your admin account

1. Open the app and sign up normally at `signup.html`
2. Use your own email and choose "Customer" role
3. After signing up, go to your Supabase dashboard
4. Click **"Table Editor"** → select `profiles`
5. Find your row and change the `role` column from `customer` to `admin`
6. Now you can access `admin.html` for moderation tools

---

## STEP 6 — Deploy to GitHub Pages

### Option A — GitHub Pages (easiest, free)

1. Create a repository at github.com (e.g. `street-tasker`)
2. Upload all project files to the repo root
3. Create a file named `.nojekyll` in the root (leave it empty)
4. Go to **Settings → Pages**
5. Set Source: **Deploy from branch → main → / (root)**
6. Click Save
7. Your site will be live at `https://yourusername.github.io/street-tasker/`

### Option B — Vercel (recommended for production)

1. Push all files to a GitHub repository
2. Go to **https://vercel.com** and sign in with GitHub
3. Click **"Import Project"** and select your repo
4. Leave all defaults — click **"Deploy"**
5. Done. You get a free `.vercel.app` domain instantly

---

## STEP 7 — Test the full flow

### Test as a Customer:
1. Sign up at `/signup.html` (choose "Customer")
2. Post a task at `/post-task.html`
3. View your task in the marketplace

### Test as a Tasker:
1. Open a different browser / incognito window
2. Sign up again with a different email (choose "Tasker")
3. Browse tasks at `/browse-tasks.html`
4. Apply for the task you posted

### Test the full workflow:
1. As the customer, go to the task page — accept the application
2. The task status changes to "Assigned"
3. Chat between customer and tasker now opens
4. Mark the task as In Progress, then Completed
5. Customer leaves a review for the tasker

---

## File Structure

```
street-tasker/
├── index.html          → Homepage (hero, categories, tasks, map)
├── login.html          → Sign in page
├── signup.html         → Sign up page (customer or tasker)
├── browse-tasks.html   → Task marketplace with filters
├── post-task.html      → 3-step task posting form
├── task-details.html   → Full task page (apply, chat, review)
├── dashboard.html      → User dashboard (tasks, apps, notifs, profile)
├── profile.html        → Public profile page with reviews
├── admin.html          → Admin moderation panel
├── 404.html            → Custom error page
├── supabase-schema.sql → Complete database setup
├── css/
│   └── styles.css      → Full design system
└── js/
    └── config.js       → Supabase client + all DB helpers
```

---

## Database Tables

| Table         | Purpose                              |
|---------------|--------------------------------------|
| profiles      | All users (customers + taskers)      |
| tasks         | All posted tasks                     |
| applications  | Tasker applications for tasks        |
| messages      | Real-time chat messages              |
| reviews       | Post-completion ratings              |
| notifications | In-app notification system           |
| categories    | Service category list                |

---

## Features Included

- ✅ Email/password auth via Supabase
- ✅ Role-based accounts (Customer / Tasker / Admin)
- ✅ Full task posting with photos
- ✅ Marketplace with search + filters + categories
- ✅ Application system (apply → accept → hire)
- ✅ Task lifecycle (Open → Assigned → In Progress → Completed)
- ✅ Real-time chat between customer and tasker
- ✅ Review and rating system (auto-updates tasker profile)
- ✅ Notification system (in-app + real-time)
- ✅ Admin panel (ban users, delete tasks, verify accounts)
- ✅ Public profiles with reviews
- ✅ Avatar and task photo uploads
- ✅ Row Level Security on all tables
- ✅ Mobile-first responsive design
- ✅ Nigerian Naira (₦) currency

---

## Customisation

### Change the currency
Find `₦` in `js/config.js` (the `fmt()` function) and replace with your desired currency symbol.

### Add more categories
Edit the `CATS` array in `index.html`, `browse-tasks.html`, and the `categories` table in Supabase.

### Enable email confirmation
In Supabase → Authentication → Settings → disable "Enable email confirmations" for testing, enable for production.

---

## Tech Stack

| Layer       | Technology                  |
|-------------|------------------------------|
| Frontend    | Vanilla HTML + CSS + JS      |
| Auth        | Supabase Auth                |
| Database    | Supabase (PostgreSQL)        |
| Realtime    | Supabase Realtime            |
| Storage     | Supabase Storage             |
| Fonts       | Syne + Instrument Sans       |
| Hosting     | GitHub Pages / Vercel        |
