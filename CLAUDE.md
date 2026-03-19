# CLAUDE.md

## Context
TimeForge — A premium, weightless Project & Timesheet SaaS built with React, Supabase, and GSAP.

## Core Principles
- **Weightless Design**: Use floating cards, translucent glassmorphism (`backdrop-filter`), and soft diffused shadows.
- **Mobile-First**: Every feature must work seamlessly with one hand on mobile. Bottom navigation for small screens.
- **Motion First**: Staggered entrances, smooth transitions (ease-out), and subtle parallax. No instant snapping.

## Manual Entry Protocol
- All manual logs should have a date picker and a visual distinction from timer logs.
- Marking work as "Past Work" should be a clear toggle that adjusts the entry metadata.

## Tech Stack
- React + Vite
- Supabase (Auth, DB, RLS)
- GSAP (GreenSock) for Premium Motion
- Lucide React for adaptive iconography

## Essential Commands
- `npm run dev` — Start dev environment
- `npm run build` — Production build
- `check-db.js` — Database health check
