# Content Pipeline Studio

AI-powered content automation platform with GEO-optimized writing. 4-stage pipeline: Research, Write, Validate, Publish.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdanishashko%2Fcontent-pipeline-studio&env=OPENROUTER_API_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,CRON_SECRET&envDescription=Required%20API%20keys%20for%20the%20content%20pipeline&envLink=https%3A%2F%2Fgithub.com%2Fdanishashko%2Fcontent-pipeline-studio%2Fblob%2Fmaster%2F.env.example&project-name=content-pipeline-studio)

## Stack

- Next.js 16 + React 19 + Tailwind v4
- Supabase (Postgres + Storage)
- OpenRouter (multi-model LLM)
- Gemini 3.1 Flash (featured image generation)
- SEMrush API (topic suggestions)
- Bright Data (web scraping + SERP)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys. See the example file for all available options.

## Local Development

```bash
npm install
npm run dev
```

## Database

Run the migration in `supabase/migrations/001_initial.sql` against your Supabase project.
