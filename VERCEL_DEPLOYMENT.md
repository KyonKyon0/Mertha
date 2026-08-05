# Vercel & Supabase Deployment Guide

## 1. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Go to **SQL Editor** and execute `supabase/migrations/00000000000000_initial_schema.sql`.
3. Execute `supabase/seed.sql` for demo data.
4. Go to **Project Settings -> API** to get your `URL` and `anon public` key.

## 2. Google Gemini Setup

1. Go to [Google AI Studio](https://aistudio.google.com).
2. Generate an API Key.

## 3. Vercel Deployment

1. Push this repository to GitHub.
2. In Vercel, import the repository.
3. In the **Environment Variables** section, add the following:
   - `NEXT_PUBLIC_SUPABASE_URL` (From Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (From Supabase)
   - `GEMINI_API_KEY` (From Google AI Studio)
4. Click **Deploy**.

The Next.js App Router API endpoints (`/api/ai/food-review`) will automatically be deployed as Serverless Functions.
