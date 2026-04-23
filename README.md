# Content Pipeline Studio

> **Agency-grade AI content automation — from keyword to published article in under 10 minutes.**

Built with [Bright Data](https://brightdata.com?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio)'s Discover API, SERP API, Web Unlocker, and Browser API for screenshot-grade research grounded in real web data — not hallucinated context.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdanishashko%2Fcontent-pipeline-studio&env=OPENROUTER_API_KEY,BRIGHT_DATA_API_KEY,BRIGHT_DATA_SERP_ZONE,BRIGHT_DATA_UNLOCKER_ZONE,BRIGHT_DATA_BROWSER_AUTH,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,CRON_SECRET&project-name=content-pipeline-studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Powered by Bright Data](https://img.shields.io/badge/Powered%20by-Bright%20Data-0066FF?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiLz48L3N2Zz4=)](https://brightdata.com?utm_source=github&utm_medium=badge&utm_campaign=content-pipeline-studio)

---

## What It Does

Content Pipeline Studio takes a **keyword** and a **brand config** and returns a fully-researched, on-brand, internally-linked article — automatically.

No generic AI slop. Every article is grounded in:
- Live SERP data from Google (via Bright Data Discover API)
- Scraped competitor content (via Bright Data Web Unlocker)
- Real statistics from authoritative sources
- Your sitemap, product pages, messaging principles, and customer pain points

The result is content that ranks, converts, and sounds like it was written by a senior editor who actually knows your product.

---

## The 4-Stage Pipeline

```
Keyword → [Research] → [Write] → [Validate] → [Publish]
              ↑              ↑            ↑            ↑
         Bright Data    Claude        Claude       WP REST
         Discover API   Sonnet 4.6    Sonnet 4.6    API
```

### Stage 1 — Research
Bright Data **Discover API** fires two parallel queries: one for top competitor pages (with full content included), one for statistics sources from authoritative domains (McKinsey, Gartner, .gov, .edu). Your sitemap is scraped to surface existing internal content. Everything is synthesised by Claude Sonnet into a structured content brief — target keyword, outline, internal link targets, competitor gaps, and cited statistics.

### Stage 2 — Write
Claude Sonnet 4.6 writes a 2,000–4,500 word article from the brief, in your brand's exact voice — using your messaging principles, guardrails, product pages, and case studies. For listicle-style articles, vendor screenshots are captured automatically via **Bright Data Browser API** (cloud Chromium, cookie-banner aware) and injected into the content.

### Stage 3 — Validate
A second Claude Sonnet pass fact-checks every claim, verifies internal links point to real pages, checks word count, and normalises formatting. Only the validated output reaches publish.

### Stage 4 — Publish
If WordPress credentials are configured, the article posts as a draft via the WP REST API — with SEO title, meta description, slug, categories, and featured image. Otherwise the stage is skipped and the article stays available in the studio UI.

---

## Powered by Bright Data

This project uses **four Bright Data products** to make every article grounded in real web data:

| Product | Role in the pipeline |
|---------|----------------------|
| [Discover API](https://brightdata.com/products/web-scraper/serp?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio) | Primary research — SERP results with scraped content in one call |
| [SERP API](https://brightdata.com/products/serp-api?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio) | Fallback when Discover is unavailable |
| [Web Unlocker](https://brightdata.com/products/web-unlocker?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio) | Scrapes competitor pages, sitemap XML, and data sources — bypasses bot protection |
| [Browser API](https://brightdata.com/products/scraping-browser?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio) | Captures full-resolution vendor screenshots via cloud Chromium |

**[Get your Bright Data API key →](https://brightdata.com/cp/start?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio)**

---

## Features

- **Multi-site** — run independent pipelines for different brands from one dashboard
- **Rich site config** — brand voice, messaging principles, insight guardrails, pain points, case studies, product pages, sitemap integration
- **Vendor screenshots** — automatically detects tool names in listicle headings, resolves their domains, captures screenshots via Bright Data Browser API, uploads to Supabase Storage
- **Internal linking** — AI links to your real product pages using the content brief; sitemap scraping prevents dead links
- **Lead collection** — email gate with per-user article limits and Bright Data upgrade CTA
- **Scheduled publishing** — cron-based keyword queues for consistent content cadence
- **Mobile-first UI** — fully responsive dashboard, article reader, and site config forms
- **Docs built in** — `/docs` tab explains every feature, stage, and config field

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 19 + Tailwind v4 |
| Database | Supabase (Postgres + Storage) |
| LLM | Claude Sonnet 4.6 via OpenRouter |
| Web data | Bright Data (Discover, SERP, Web Unlocker, Browser API) |
| Screenshots | Bright Data Browser API (Playwright over CDP) |
| Image generation | Google Gemini Flash |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/danishashko/content-pipeline-studio.git
cd content-pipeline-studio
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in the required keys (see [Environment Variables](#environment-variables) below).

### 3. Set up Supabase

Create a Supabase project, then run the migration:

```bash
# Via Supabase CLI
supabase db push

# Or paste supabase/migrations/001_initial.sql into the Supabase SQL editor
```

Create two public storage buckets: `screenshots` and `featured-images`, with INSERT and SELECT policies allowing public access.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default password: set `CPS_PASSWORD` in your env (or see `/app/api/auth/route.ts`).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | OpenRouter key for Claude Sonnet access |
| `BRIGHT_DATA_API_KEY` | ✅ | Bright Data API token |
| `BRIGHT_DATA_SERP_ZONE` | ✅ | Your SERP zone name (e.g. `serp_n8n`) |
| `BRIGHT_DATA_UNLOCKER_ZONE` | ✅ | Your Web Unlocker zone name |
| `BRIGHT_DATA_BROWSER_AUTH` | ✅ | Browser API credentials: `brd-customer-XXXXX-zone-ZONENAME:PASSWORD` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `CRON_SECRET` | ✅ | Secret for authenticating cron endpoint |
| `GEMINI_API_KEY` | ☑️ | For featured image generation (optional) |
| `SEMRUSH_API_KEY` | ☑️ | For keyword suggestions (optional) |

**[Get your Bright Data API key →](https://brightdata.com/cp/start?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio)**

---

## Site Configuration

Each site in the platform has a rich config object that shapes every article written for it. The more context you provide, the more opinionated and accurate the output.

```json
{
  "companyName": "Acme Corp",
  "companyDescription": "...",
  "domains": ["acme.com"],
  "industries": ["SaaS", "DevTools"],
  "competitors": ["competitor.com"],
  "cta": { "url": "/pricing", "defaultText": "Start free trial" },
  "productPages": [
    { "url": "/products/scraper", "title": "Web Scraper", "description": "..." }
  ],
  "mainSitemapUrl": "https://acme.com/sitemap.xml",
  "blogSitemapUrl": "https://acme.com/blog-sitemap.xml",
  "messagingPrinciples": ["Lead with data, not claims", "..."],
  "insightGuardrails": ["Never claim 100% uptime", "..."],
  "customerPainPoints": {
    "Slow data collection": "Teams spend 3 days/week manually scraping..."
  },
  "caseStudies": [
    {
      "name": "Acme customer",
      "problem": "...",
      "solution": "...",
      "results": ["Cut data ops costs by 60%"],
      "quote": "This changed how we work. — CTO, Acme"
    }
  ]
}
```

---

## Project Structure

```
app/
  articles/         # Article list + detail reader
  docs/             # Built-in documentation
  pipeline/         # Real-time job monitor
  queue/            # Keyword queue management
  sites/            # Site config management
  api/              # Next.js API routes
components/
  layout/           # Sidebar, theme toggle
  dashboard/        # Stats cards
hooks/
  use-is-mobile.ts  # Responsive hook
lib/
  bright-data.ts    # Discover API + SERP + Web Unlocker
  screenshots.ts    # Browser API screenshot capture
  openrouter.ts     # Claude Sonnet via OpenRouter
  pipeline/         # Research, Write, Validate, Publish stages
supabase/
  migrations/       # DB schema
```

---

## Roadmap

- [ ] WordPress auto-publish with Yoast SEO metadata
- [ ] Image generation per section (not just featured image)
- [ ] Multi-language support
- [ ] A/B title testing
- [ ] Google Search Console integration for performance tracking
- [ ] Keyword clustering and content gap analysis

---

## Author

**Daniel Shashko** — GTM Strategy × AI Automations

- 🌐 [LinkedIn](https://www.linkedin.com/in/danielshashko)
- 🐦 Demos & updates: [@danielshashko](https://twitter.com/danielshashko)

Built and demoed live at **BrightonSEO AI Conference 2026**.

---

## License

MIT — use it, fork it, build on it. If you use Bright Data's APIs, [sign up here](https://brightdata.com/cp/start?utm_source=github&utm_medium=readme&utm_campaign=content-pipeline-studio) to get your API key and $5 in free credit.
