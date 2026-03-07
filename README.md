# ⚡ Street Tasker

A modern neighbourhood services marketplace built for Nigeria — connecting people with trusted local barbers, cleaners, plumbers, electricians, nail artists, tutors and more.

🌐 **Live site:** https://kiyomigroup.github.io/Neighborhood-Link/

---

## ✨ What's included

- Smart search with autocomplete
- Bento grid service categories with illustrated scenes
- Featured Tasker cards with business images
- Interactive pin map showing nearby taskers
- 3-tier subscription system (Free / Pro / Elite) in Nigerian Naira (₦)
- Booking counter + paywall modal when limit is reached
- Step-by-step tasker onboarding with photo uploads
- Provider Dashboard with Instagram-style post composer
- Client Dashboard with social feed (likes + comments)
- Pricing page (₦0 / ₦9,900 / ₦24,900 per month)
- Custom 404 page
- Mobile-first responsive design

---

## 💰 Subscription Plans

| Plan  | Price       | Bookings       | Extras                          |
|-------|-------------|----------------|---------------------------------|
| Free  | ₦0          | 5 total        | Basic listing                   |
| Pro   | ₦9,900/mo   | 100/month      | Priority listing, analytics     |
| Elite | ₦24,900/mo  | Unlimited      | Featured homepage + search top  |

---

## 📁 File Structure

```
Neighborhood-Link/
├── index.html        ← Full app (React SPA, no build step needed)
├── 404.html          ← Custom error page
├── README.md         ← This file
├── nojekyll          ← Rename to .nojekyll before pushing
└── deploy-workflow.yml  ← Rename/move to .github/workflows/deploy.yml
```

---

## 🚀 How to deploy

### Option A — GitHub Pages (simple, recommended)

1. Upload all files to your repo
2. Rename `nojekyll` → `.nojekyll`
3. Go to **Settings → Pages**
4. Set Source: **Deploy from branch** → `main` → `/ (root)`
5. Click Save — live in ~60 seconds

### Option B — GitHub Actions (auto-deploy on push)

1. Create folder `.github/workflows/` in your repo
2. Move `deploy-workflow.yml` into it and rename to `deploy.yml`
3. Go to **Settings → Pages**
4. Set Source: **GitHub Actions**
5. Every push to `main` auto-deploys

---

## 🛠️ Tech Stack

| Layer       | Tech                            |
|-------------|----------------------------------|
| UI          | React 18 (CDN, no build needed) |
| JSX         | Babel Standalone                |
| Fonts       | Fraunces + Plus Jakarta Sans    |
| Forms       | Formspree                       |
| Currency    | Nigerian Naira (₦)              |
| Hosting     | GitHub Pages                    |

---

## 📬 Formspree

All forms post to `https://formspree.io/f/mwvnjrba`.

To use your own endpoint:
1. Sign up free at [formspree.io](https://formspree.io)
2. Create a form and copy the ID
3. Replace `mwvnjrba` in `index.html` (line ~38)

---

## 📄 License

MIT — free to use, modify and distribute.
