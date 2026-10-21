# 🎬 ÉNOUEMENT 2K27

> A cinematic, immersive digital memory of the senior batch — **Class of 2027, Ethiopia**.
> Not a normal school website. A movie trailer meets a premium agency site. Every screen makes people say *wow*.

🟡💛 Bright Yellow · 🟢 Vivid Green · 🌿 Mint on deep green-black / warm cream.

---

## ✨ Features

### Public experience
- **Cinematic preloader** with curtain reveal, animated % counter, batch name, skip button (once per session).
- **Smooth scrolling** (Lenis) + custom animated cursor + scroll progress bar.
- **Sticky glass navbar** with animated active indicator; full-screen immersive mobile menu.
- **Home** — full-screen 3D hero (@react-three/fiber: floating icosahedron + particles), crossfading ken-burns slideshow, giant animated title, **live countdown to graduation**, animated stat counters, latest announcements, featured gallery masonry, live-feed preview, marquee.
- **Our Story** — scroll-driven cinematic timeline (Grade 9 → 12) with parallax visuals + glowing progress line.
- **Live Moments** — Instagram-style masonry feed, like button (localStorage), lightbox with swipe, auto-poll for new posts.
- **Gallery** — album grid with 3D tilt cards, category filters, fullscreen masonry lightbox.
- **Seniors** — search + section filter, hover-reveal cards, profile modals.
- **Events** — Timeline + Calendar views, live countdown to next event, detail pages.
- **Announcements** — list + detail with markdown body, pinned/urgent highlights.
- **Graduation** — epic countdown hero, program schedule, Wall of Seniors, thank-you section.
- **Merch** — interactive showcase with image gallery, color/size selectors.
- **Videos / Cinema** — cinematic player grid with embed support.
- **Contact** — validated form (zod + react-hook-form) with honeypot + rate limiting.
- **Light & Dark mode** — fully designed (not inverted), animated theme toggle, respects system preference.
- **Responsive** — flawless from 360px to 4K. Touch gestures, safe-area insets, `100dvh`.
- **Performance** — code-split 3D (`ssr:false`), SmartImage with gradient fallback, lazy loading, `prefers-reduced-motion` honored.

### Admin panel (`/admin`)
- **Auth** — NextAuth.js (credentials + bcrypt + JWT), Super Admin & Admin roles, server-enforced.
- **Dashboard** — live stats (posts, students, events, messages, videos), recent activity.
- **Full CRUD** for: Site Settings, Hero Media, Story Chapters, Posts/Moments (+ reactions), Albums (+ media), Merch, Announcements, Events, Graduation content, Students, Videos, Contact Messages, Users (Super Admin only), Audit Log.
- **Mobile-friendly** — sidebar collapses to drawer, responsive tables.
- **Optimistic UX** — toasts, confirmation dialogs, loading skeletons, search/pagination.

### Backend
- **Neon PostgreSQL** (serverless Postgres) via Prisma ORM.
- **Row-level security** via server-side role checks on every admin route (`requireAdmin` / `requireSuperAdmin`).
- **Zod validation** on all inputs. **Rate limiting** on public write endpoints.
- **Audit logging** of all admin mutations.

---

## 🛠 Tech Stack

| Layer | Tech |
|------|------|
| Framework | **Next.js 16** (App Router) + **TypeScript 5** |
| Styling | **Tailwind CSS 4** + shadcn/ui (New York) + CSS variables |
| Motion | **Framer Motion** (UI) + **GSAP/ScrollTrigger** (scroll) + **Lenis** (smooth scroll) |
| 3D | **Three.js** via @react-three/fiber + @react-three/drei |
| Database | **Neon PostgreSQL** via **Prisma ORM** |
| Auth | **NextAuth.js v4** (Credentials + JWT + bcrypt) |
| State | **Zustand** (client) + **TanStack Query** (server) |
| Forms | **React Hook Form** + **Zod** |
| Icons | **lucide-react** |
| Fonts | **Syne** (display) + **Inter** (body) via next/font |

---

## 📁 Folder Structure

```
enouement/
├── prisma/
│   ├── schema.prisma        # All models (User, Post, Event, Student, …)
│   └── seed.ts               # Demo content + Super Admin
├── public/                   # logo, manifest, robots
├── src/
│   ├── app/
│   │   ├── (public)/...      # Home, Story, Moments, Gallery, …
│   │   ├── admin/            # Admin login + (panel)/…
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── admin/...     # Protected CRUD routes
│   │   │   ├── posts/        # Public paginated feed
│   │   │   └── contact/      # Public contact form
│   │   ├── layout.tsx
│   │   ├── globals.css       # Cinematic design system
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── hero/ home/ story/ graduation/ seniors/ moments/
│   │   ├── gallery/ videos/ events/ announcements/ merch/ contact/
│   │   ├── admin/            # Admin shell + managers
│   │   ├── navbar.tsx footer.tsx preloader.tsx …
│   ├── lib/
│   │   ├── db.ts             # Prisma client (Neon)
│   │   ├── auth.ts           # NextAuth config
│   │   ├── session.ts        # requireAdmin / requireSuperAdmin / logAudit
│   │   └── data.ts           # Public data accessors
│   └── hooks/
├── .env.example
├── DEPLOYMENT.md
└── README.md
```

---

## 🚀 Quick Start (Local)

```bash
# 1. Install deps
bun install

# 2. Copy env and fill in your Neon URL + secrets
cp .env.example .env

# 3. Push the Prisma schema to Neon
bun run db:push

# 4. Seed demo content + create the Super Admin
bun run seed

# 5. Run the dev server
bun run dev
```

Open **http://localhost:3000**. Admin at **http://localhost:3000/admin/login** using the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from your `.env`.

---

## 📜 Scripts

| Script | What it does |
|--------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint (Next + TS rules) |
| `bun run db:push` | Push Prisma schema → Neon |
| `bun run db:generate` | Regenerate Prisma Client |
| `bun run seed` | Seed demo data + Super Admin |

---

## 🔐 Admin Guide

1. **First Super Admin** — created by `bun run seed` using `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` env vars. Never hardcoded.
2. **Roles**:
   - `SUPER_ADMIN` — full access, can manage other admins, view audit log.
   - `ADMIN` — content management only.
3. **Adding an admin** — Sign in as Super Admin → `/admin/users` → "New" → set email, name, password, role.
4. **All content is editable** — every text, image, date, toggle on the public site comes from the DB and is editable in `/admin/*`.

---

## 🌐 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Vercel + Neon guide.

---

## 🎨 Credits

**Énouement 2K27 — Class of 2027, Ethiopia.** 🟡🟢

Crafted with obsessive attention to detail. Made with 💛💚.

> Every moment, every face, every story — preserved forever.
