# 🚀 DEPLOYMENT — Énouement 2K27

This guide gets the site live on **Vercel** with **Neon PostgreSQL** in under 15 minutes.

---

## 0. Prerequisites
- A [GitHub](https://github.com) account (the repo is pushed there).
- A [Vercel](https://vercel.com) account (sign in with GitHub).
- A [Neon](https://neon.tech) account (free tier is fine).

---

## 1. Create the Neon database
1. Go to **https://console.neon.tech** → **New Project**.
2. Name it `enouement-2k27`. Pick a region close to your users.
3. Once created, copy **two** connection strings from the dashboard:
   - **Pooled connection** (recommended for serverless) → this is your `DATABASE_URL`.
   - **Direct connection** → this is your `DIRECT_URL`.
   Both look like: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.

---

## 2. Push the schema & seed
Run these **locally** (with your real Neon URL in `.env`):

```bash
bun install
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, SUPER_ADMIN_*
bun run db:push              # creates all tables on Neon
bun run seed                 # seeds demo content + creates the Super Admin
```

You can verify the admin was created by logging in locally at `http://localhost:3000/admin/login`.

---

## 3. Push to GitHub
```bash
git init
git add .
git commit -m "feat: Énouement 2K27 cinematic batch website"
git branch -M main
git remote add origin https://github.com/speadfreak/enouement.git
git push -u origin main
```

> ⚠️ Make sure `.env` is **not** committed (it's in `.gitignore`). If you ever accidentally push a secret, rotate it immediately.

---

## 4. Deploy on Vercel
1. Go to **https://vercel.com/new**.
2. Import the `speadfreak/enouement` repo.
3. Framework preset: **Next.js** (auto-detected).
4. **Environment Variables** — add ALL of these:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | your Neon **pooled** connection string |
| `DIRECT_URL` | your Neon **direct** connection string |
| `NEXTAUTH_SECRET` | a 32+ char random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (your Vercel URL; update after first deploy if needed) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `SUPER_ADMIN_EMAIL` | your admin email (only needed if you re-run seed) |
| `SUPER_ADMIN_PASSWORD` | your admin password (only needed if you re-run seed) |
| `CLOUDINARY_CLOUD_NAME` | **required for uploads** — from cloudinary.com dashboard |
| `CLOUDINARY_API_KEY` | **required for uploads** — from cloudinary.com dashboard |
| `CLOUDINARY_API_SECRET` | **required for uploads** — from cloudinary.com dashboard |

5. Click **Deploy**. Vercel builds with `next build` automatically.
6. Once deployed, if `NEXTAUTH_URL` didn't match, update it to your final Vercel URL and redeploy.

---

## 5. First login
- Visit `https://your-app.vercel.app/admin/login`.
- Sign in with the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` you set.
- Go to **Users** to add more admins if needed.
- Go to **Site Settings** to set your site name, tagline, countdown date, social links, etc.
- Replace demo content with your own across all the managers.

---

## 6. Custom domain (optional)
1. In Vercel → your project → **Settings → Domains**.
2. Add your domain (e.g. `enouement2k27.et`).
3. Update your DNS (A record or CNAME) as Vercel instructs.
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` env vars to the new domain.
5. Redeploy.

---

## 7. Image / Video uploads
This build uses **SmartImage** with graceful gradient fallbacks, so the site looks full even before you upload real media. To upload real images/videos via the admin panel, you **must configure Cloudinary** — the admin uploader signs uploads on the server and sends files **directly from the browser** to Cloudinary, bypassing Vercel's 4.5MB serverless body limit so even large videos (up to 500MB) work.

1. Create a free account at **cloudinary.com**.
2. From your dashboard, copy `Cloud Name`, `API Key`, and `API Secret`.
3. Add them as Vercel env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
4. Redeploy. The admin upload buttons will now work.

**Why no fallback?** Storing large files (especially videos) as base64 in Neon would fill the free database instantly. Cloudinary's free tier (25GB storage, 25 credits/month) is more than enough for a senior batch site. Without Cloudinary configured, the upload button shows a clear error explaining what to set up.

You can also paste external image/video URLs directly into the "Paste URL" tab of any media field — useful for embedding YouTube videos or using images hosted elsewhere.

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| Login redirects back to `/admin/login` | Ensure `NEXTAUTH_URL` matches your deployed URL exactly (https + domain). |
| `Database connection error` | Verify `DATABASE_URL` + `DIRECT_URL` are the Neon pooler/direct URLs with `?sslmode=require`. |
| `Prisma Client not generated` | Run `bun run db:generate` locally, then redeploy. Vercel runs `prisma generate` in `postinstall`. |
| Images don't load | Add the hostname to `images.remotePatterns` in `next.config.ts`. |
| 404 on `/manifest.json` | Already added in `public/manifest.json` — redeploy. |

---

## ✅ You're live. 🟡🟢

**Énouement 2K27 — Class of 2027, Ethiopia.** Made with 💛💚.
