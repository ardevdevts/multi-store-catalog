# AGENTS.md

## Purpose
This file defines coding standards for agents and contributors working in this repository.

## Project Snapshot
- Stack: Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Prisma, tRPC.
- Key folders: `app/` routes and pages, `components/` UI and feature components, `context/` React context providers, `hooks/` reusable hooks, `server/` API routers and backend logic, `lib/` shared utilities.

## Project Structure
- `app/`: Next.js App Router entrypoint.
- `app/(storefront)/...`: public storefront pages (catalog home at `/`, product detail at `/product/[slug]`, favicon route, store layout).
- `app/admin/...`: flat admin backoffice pages (dashboard, products, categories, subcategories, currencies, media, theme, branding, settings, users).
- `app/api/...`: route handlers (auth, media, setup, admin actions, tRPC handler).
- `components/ui/`: base reusable UI primitives (buttons, dialogs, fields, etc.).
- `components/products/`, `components/cart/`, `components/filters/`, `components/search/`, `components/wishlist/`: storefront feature components.
- `components/admin/`: admin feature components/forms.
- `components/layout/`, `components/theme/`, `components/utils/`: shared app scaffolding and utilities.
- `context/`: React context state (`cart`, `wishlist`, etc.).
- `hooks/`: custom React hooks used across features.
- `lib/`: framework-agnostic helpers (auth, currency, formatting, theme, utils).
- `server/api/`: tRPC server setup and routers (including `admin` subrouters).
- `trpc/`: client-side tRPC wiring.
- `prisma/`: schema, migrations, seed scripts.
- `scripts/`: one-off internal scripts.
- `public/`: static assets and manifests.

## Tooling (Mandatory)
- Use Bun for all package and script commands.
- Do not use `npm`, `pnpm`, or `yarn` commands in this repo.

Use these commands:
- `bun install`
- `bun run dev`
- `bun run build`
- `bun run db:seed`
- `bunx prisma ...`
- `bunx tsx ...`

## React Rules
- Prefer Server Components by default. Use `"use client"` only when you need browser APIs, local interactive state, or client-only hooks.
- Keep state minimal and intentional. Do not store values in state if they can be derived from props/data on render.
- Do not abuse `useEffect` for derivations or sync that can be computed directly.
- `useEffect` is for side effects only: subscriptions, timers, imperative browser APIs, or explicit external synchronization.
- Avoid `any` in component props, API responses, and event handlers. Define explicit types.
- Keep heavy logic out of JSX. Move it to helpers or custom hooks.

### `useEffect` Anti-Pattern (Avoid)
```tsx
useEffect(() => {
  if (product.variants && product.variants.length > 0) {
    const inStockVariant = product.variants.find((v: any) => v.stock > 0 && v.isActive);
    setSelectedVariantId(inStockVariant ? inStockVariant.id : product.variants[0].id);
  }
}, [product.variants]);
```

Prefer:
- Derive defaults during render (`const defaultVariant = ...`), then compute selected value from user state + fallback.
- Initialize state once with a lazy initializer when needed.
- If product identity changes, prefer remount by key or explicit reset based on stable identity (for example `product.id`), not broad object deps.

## Tailwind CSS Rules
- Use design tokens already defined in `app/globals.css` (`bg-background`, `text-foreground`, `border-border`, etc.).
- Avoid hardcoded colors/spacing when a token or utility exists.
- **Do not use hardcoded color values** like `bg-white`, `bg-black`, `text-white`, `text-black`. Use theme variables instead: `bg-background`, `bg-card`, `text-foreground`, etc.
- **Avoid `rounded-*` classes** unless specifically required. Prefer using the design system's default border radius or no rounding.
- **Avoid `shadow-*` classes** unless specifically required. Use sparingly and prefer design system defaults.
- Keep class strings readable. If a `className` gets large/complex, extract with `cn(...)`, `cva`, or small presentational components.
- Prefer utility composition over ad-hoc custom CSS. Add global CSS only for shared primitives/animations.
- Use mobile-first responsive classes and keep breakpoints consistent.
- Use semantic UI primitives in `components/ui` instead of re-creating common patterns.

## Type Organization Rules
- Centralize shared and cross-feature types in a shared module under `lib/` (API contracts live in `lib/api-validators.ts`, site settings in `lib/site.ts`).
- If a feature has many specific types, create a local `types.ts` near that feature and export shared contracts from `lib/`.
- Do not scatter duplicate interfaces/types across multiple files.
- Do not define large inline object types inside components when they can be extracted and reused.
- Keep names explicit and domain-based (for example `ProductVariant`, `StoreThemeConfig`, `CartItemInput`).
- Avoid vague names like `Data`, `ItemType`, `Obj`, `Payload2`.
- Keep naming consistent between Zod schemas and inferred types (for example `productSchema` + `Product`).
- Prefer `type` for unions/compositions and `interface` for extendable object contracts.
- Replace `any` with concrete types, generics, or `unknown` + narrowing.
- When changing API shapes, update related type definitions in the same PR/task.

## Component Size Limit
- New components must stay under 300 lines.
- If a component approaches the limit, split it into local subcomponents, feature sections, or custom hooks for state/behavior.
- Existing oversized files may remain temporarily, but all new work should move toward smaller units.

## Quality Checklist
If possible mostly use the available tools from VScode for you. If not then use other commands to check for errors.


## AGENTS.md Maintenance Rule
- Any agent adding a new folder, feature area, domain module, or architectural convention must update this `AGENTS.md` in the same change.
- Keep `Project Structure` current: add new paths and a one-line purpose.
- If code is moved between folders, reflect that move here.
- If this file is not updated when structure changes, the task is incomplete.
