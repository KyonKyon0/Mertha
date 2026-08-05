# Too Good To Be Waste - Buyer App

A mobile-first web application connecting users with surplus food from local merchants.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Supabase SSR for Auth and Database
- Lucide React & Embla Carousel

## Prerequisites
- Node.js >= 18
- npm
- Supabase project credentials

## Environment Variables
Create a `.env.local` file based on `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (local/admin use only, do not expose to client)
- `LOCAL_ADMIN_EMAIL`: `admin123@gmail.com`
- `LOCAL_ADMIN_PASSWORD`: `Admin123`
- `ALLOW_PRODUCTION_SEED`: set to `true` if seeding admin to a hosted remote database safely.

## Setup & Local Development
1. Install dependencies: `npm install`
2. Push Supabase Migrations: Applied to the linked remote DB (`tqtgdmjjbifybworebnm`)
3. Seed the local admin: `npm run seed:local-admin` (Creates the default `admin123@gmail.com` account)
4. Start Next.js dev server: `npm run dev`
5. Open http://localhost:3000

## Supabase Schema
See `docs/database.md` for a full schema breakdown. We use `profiles`, `merchants`, `products`, `orders`, and `refunds`. Row Level Security (RLS) protects user records.

## Scripts
- `npm run dev`: Starts development server
- `npm run build`: Builds the application for production
- `npm run lint`: Runs ESLint
- `npm run seed:local-admin`: Idempotent script that ensures the local/remote database has the `admin123@gmail.com` user initialized.

## Vercel Deployment
1. Connect this GitHub repository to Vercel.
2. In the Vercel Dashboard, configure the following Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *Do not add `SUPABASE_SERVICE_ROLE_KEY` unless you plan to run admin-only secure scripts on Vercel Edge/Serverless functions safely.*
3. Trigger a deployment.
4. Ensure Supabase Authentication redirect URLs match your new `*.vercel.app` domain.

## Known Limitations
- Dummy data is used on some pages (e.g., `jelajahi`) to visualize the UI/UX accurately from Stitch. Future phases will hydrate fully from the `products` table.
