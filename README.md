# ⚡ Street Tasker

> A modern neighbourhood marketplace connecting people with trusted local service providers — barbers, cleaners, plumbers, electricians, nail artists, tutors and more.

🌐 **Live site:** [https://kiyomigroup.github.io/Neighborhood-Link/](https://kiyomigroup.github.io/Neighborhood-Link/)

---

## ✨ Features

- **Smart Search** — Auto-suggest services with location filtering
- **Bento Grid Categories** — Visual service categories with hover animations
- **Featured Taskers** — Rated provider cards with pricing and profiles
- **Interactive Map** — Pin map showing nearby taskers with hover cards
- **Tasker Profiles** — Full profile pages with services, portfolio, and contact
- **Provider Dashboard** — Manage business info, services, and portfolio
- **Become a Tasker** — Sign-up flow for new service providers
- **Formspree Integration** — All forms connected to live email notifications
- **Mobile-first Responsive** — Works beautifully on all screen sizes

---

## 🗂️ File Structure

```
street-tasker/
├── index.html          # Main SPA — homepage, search, profiles, dashboard
├── 404.html            # Custom 404 page
├── .nojekyll           # Disables Jekyll processing on GitHub Pages
├── CNAME               # (optional) Custom domain config
└── README.md           # This file
```

---

## 🚀 Deploy to GitHub Pages

1. Push all files to your `main` branch
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Your site will be live at `https://<username>.github.io/<repo>/`

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18 (via CDN, no build step) |
| JSX Transform | Babel Standalone |
| Fonts | Fraunces + Plus Jakarta Sans (Google Fonts) |
| Forms | Formspree |
| Hosting | GitHub Pages |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#0A0F1E` (Ink) |
| Accent | `#FF6B35` (Orange) |
| Teal | `#0FA89A` |
| Background | `#F5F3EF` (Bone) |
| Font (Display) | Fraunces (serif) |
| Font (Body) | Plus Jakarta Sans |

---

## 📬 Formspree Setup

All forms post to `https://formspree.io/f/mwvnjrba`. To use your own:

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form and copy your endpoint ID
3. Replace `mwvnjrba` in `index.html` with your ID

---

## 📄 License

MIT — free to use and modify.
