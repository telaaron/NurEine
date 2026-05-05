# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lichtblick** — a German-language, curated "good news" web publication. Static site built with SvelteKit. Displays one featured story per day, a searchable archive, a map of stories by location, local stories, and a newsletter signup with paid tiers.

## Commands

- `pnpm dev` — Start development server with HMR
- `pnpm build` — Production build (static site export to `build/`)
- `pnpm preview` — Preview production build locally
- `pnpm check` — Run type checking (`svelte-kit sync && svelte-check`)
- `pnpm check:watch` — Type checking in watch mode

There are no tests, linting, or formatting tools configured.

## Tech Stack

- **Framework:** SvelteKit 2 with Svelte 5 (runes mode enforced via `svelte.config.js`)
- **Language:** TypeScript 6
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Build:** Vite 8
- **Package manager:** pnpm (engine-strict)
- **Adapter:** `@sveltejs/adapter-static` — fully prerendered static site
- **Base path:** All routes served under `/sites/lichtblick` — use `$app/paths` `base` constant for all internal links

## Architecture

### Data Layer (`src/lib/data/stories.ts`)
All content is hardcoded as an array of `Story` objects (no backend/database). The `Story` type includes: slug, title, dek (summary), body (markdown-style text), category, region, country, coords, source, publishedAt, readingMinutes, impactScore (0–100), tone, hero (emoji), and optional flags. Helper exports: `featuredOfDay`, `byCategory(cat)`, `localStories()`.

### Routes
| Route | Purpose |
|---|---|
| `/` | Homepage: featured hero, stats strip, story grid, CTA |
| `/archiv` | Filterable/sortable archive of all stories |
| `/geschichte/[slug]` | Individual story detail with prev/next nav, related stories |
| `/karte` | SVG world map with clickable story dots |
| `/lokal` | Local stories + submission form |
| `/manifest` | Editorial manifesto + impact index methodology |
| `/newsletter` | Subscription tiers (free, Plus €5/mo, B2B/schools) |

### Components (`src/lib/components/`)
- `Header.svelte` — Nav bar with logo, links, newsletter CTA
- `Footer.svelte` — Site footer with links, about text, copyright
- `StoryCard.svelte` — Reusable story card component

### Static Generation
- Individual story pages export `prerender = true` and define `entries()` returning all slugs
- Prerender is configured with `crawl: true` and `entries: ['/']`

### Design System (`src/app.css`)
- **Canvas:** `#f5f1ea` | **Paper:** `#faf6ee` | **Ink:** `#1a1815`
- **Brand tones (4 color palettes):** amber (hopeful), sage (environmental), rose (health/humanitarian), sky (science/innovation)
- **Fonts:** Inter (body), Fraunces (headings/prose), JetBrains Mono (code)
- **Animation:** `rise` keyframe (fade-up 0.8s) with staggered delays
- Styling uses Tailwind utility classes throughout

## Notes
- `src/lib/utils.ts` contains date formatting helpers and a `toneColorMap` for the four brand tones
- `src/lib/index.ts` is an empty placeholder for the `$lib` alias
- The `Design.md` file at project root is from a different project (VoltFleet fleet dashboard) and does not describe this codebase's design
