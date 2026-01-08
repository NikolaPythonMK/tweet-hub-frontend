# Tweet Hub Frontend

## Overview
Next.js web app for Tweet Hub. It covers authentication, feeds, post details,
profiles, bookmarks, and notifications.

## Architecture
- App Router with route groups: public screens under `src/app/(public)` and the
  main app under `src/app/(app)`.
- Feature views live inside their route folders with local `components/` and
  `hooks/`.
- Shared UI and layout pieces are in `src/components`.
- API layer sits in `src/lib/api` and calls `/api`, which is proxied to the
  backend by `src/app/api/[...path]/route.ts` (keeps HttpOnly cookies intact).
- Shared hooks/utilities live in `src/lib/hooks` and `src/lib`.

## Tech Stack
- Next.js (App Router) + React + TypeScript
- CSS Modules
- Fetch API with cookie-based auth
- lucide-react icons
- IntersectionObserver for infinite scroll

## Run Locally

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env.local` file (or update your existing one). Example:
```bash
BACKEND_URL=http://localhost:3001
```

### 3) Start the dev server
```bash
npm run dev
```

Open `http://localhost:3000`. Make sure the backend is running (see the backend
README for migrations and seed data).

## Useful Scripts
```bash
npm run dev
npm run build
npm run start
npm run lint
```
