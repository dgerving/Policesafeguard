# Police Safeguard – Vercel Deployment Guide

This package contains the complete production-ready source code for **Police Safeguard**, configured specifically for instant deployment to [Vercel](https://vercel.com).

---

## 🚀 Option 1: Deploy with Vercel CLI (Fastest, ~1 Minute)

1. Unzip this package into a folder on your computer.
2. Open a terminal / command prompt in that folder.
3. Run:
   ```bash
   npx vercel
   ```
4. Follow the interactive prompts:
   - Set up and deploy? **Yes (`y`)**
   - Which scope? Select your Vercel team/account.
   - Link to existing project? **No (`n`)**
   - What's your project's name? **`policesafeguard`** (or your preferred name)
   - In which directory is your code located? **`./`**
   - Want to modify settings? **No (`n`)** *(Vercel will automatically detect `vercel.json` and Vite)*
5. For production deployment with your live custom domain:
   ```bash
   npx vercel --prod
   ```

---

## 🌐 Option 2: Deploy via Vercel Web Dashboard (GitHub / GitLab)

1. Unzip and push this codebase to a repository on GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and log into your Vercel account.
3. Click **"Import"** next to your repository.
4. Verify the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**. Your app will build and go live within 60 seconds on a global high-speed edge network!

---

## 🔒 Connecting Your Custom Domain (e.g., `www.policesafeguard.com`)

1. In your Vercel Project Dashboard, navigate to **Settings** &rarr; **Domains**.
2. Enter your domain: `www.policesafeguard.com` (and `policesafeguard.com`).
3. Add the DNS records shown by Vercel in your domain registrar (e.g., Epik, GoDaddy, Namecheap, Cloudflare, or Northwest):
   - **A Record**: `@` &rarr; `76.76.21.21`
   - **CNAME Record**: `www` &rarr; `cname.vercel-dns.com`
4. Vercel automatically provisions a free, auto-renewing SSL certificate.

---

## ⚙️ Environment Variables (Optional)

Configure these in your Vercel Project under **Settings** &rarr; **Environment Variables**:
- `GEMINI_API_KEY` – Google Gemini API key for real-time legal assistant copilot queries.
- `STRIPE_SECRET_KEY` – (Optional) Stripe Secret key for backend subscription processing.
- `VITE_APP_URL` – Your production URL (e.g. `https://www.policesafeguard.com`).

---

## 📦 What's Included

- Complete Vite + React 19 + TypeScript frontend application.
- 50-State legal & constitutional rights repository.
- Real-time video/audio recording with FRE 902 certified hash creation.
- Pre-configured `vercel.json` with SPA routing and security headers.
