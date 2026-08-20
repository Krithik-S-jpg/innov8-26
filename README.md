# INNOV8'26

Squid Game-themed event website with a Supabase backend for player registration,
team creation, team-code joining, and individual event registration.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run
   `supabase/migrations/202608190001_innov8_backend.sql`.
3. Copy `.env.example` to `.env.local`.
4. In Supabase **Project Settings > API**, copy the Project URL and anon key into
   `.env.local`.
5. In Supabase **Authentication > URL Configuration**:
   - Set **Site URL** to `https://innov8-26.vercel.app/` (or your live site URL).
   - Add `https://innov8-26.vercel.app/**` to **Redirect URLs**.
6. Restart the Vite server with `npm run dev`.

Do not put the Supabase service-role key in this frontend. The migration enables
Row Level Security, hides participant and team data from public table queries,
and exposes only the required validated database functions.

## Local commands

```bash
npm install
npm run dev
npm run build
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
