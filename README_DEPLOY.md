# Deploy Guide (Vite + React, SPA)

This project is a Vite + React SPA. Use one of the following:

## Option A — Netlify (Git-based)
1. Push this folder to a GitHub repository.
2. In Netlify → "Add new site" → "Import an existing project" → connect the repo.
3. Build command: `npm run build`
4. Publish directory: `dist`
_This repo includes `netlify.toml` and `public/_redirects` so SPA routes and Node version 20 are configured._

## Option B — Vercel (Git-based)
1. Push to GitHub.
2. In Vercel → "Add New Project" → import the repo.
3. Framework: Vite (auto-detected). Output directory: `dist`.
4. This repo includes `vercel.json` with SPA rewrites.

## Option C — Direct upload (Netlify Drop / Cloudflare Pages)
1. Build locally:
   ```bash
   npm ci
   npm run build
   ```
2. Upload the `dist/` folder to Netlify Drop or Cloudflare Pages (as a static site).

## SPA Routing
- Netlify/Cloudflare: `public/_redirects` ensures all routes go to `index.html`.
- GitHub Pages: `public/404.html` helps route back to SPA root.

## Node Version
- `netlify.toml` pins Node 20 during build. Prefer Node 20+ locally as well.

## Base44 SDK
- If your app requires allowed origins or OAuth redirects, add your final domain to Base44's allowed origins in their dashboard.
