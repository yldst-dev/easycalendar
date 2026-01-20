# AGENTS.md

Repository guidelines for agentic coding work. Keep this file current as tooling or
conventions evolve.

## Project Snapshot
- Framework: Next.js App Router (see `package.json`; currently `next` 16.1.4).
- Language: TypeScript (strict mode).
- UI: React 19, Tailwind CSS 4, shadcn/ui components, lucide-react icons.
- State: `useReducer` with centralized state in `src/lib/state.ts`.
- AI pipeline: `/api/plan` routes requests to Groq/OpenRouter based on env config.

## Workflow Rules
- Plan work in named phases when changes are non-trivial.
- Check off phase items when a phase completes.
- Run `npx tsc --noEmit` after each phase to catch type issues early.
- Run `npm run lint` and clear warnings before starting the next phase.

## Key Directories
- `src/app/`: App Router pages, layouts, route handlers.
- `src/components/ui/`: shadcn/ui components (new-york theme).
- `src/lib/`: business logic, types, utilities.
- `public/`: static assets, referenced by `/asset-name` paths.

## Commands
Development
- `npm run dev` (Next dev server, webpack).

Build / Start
- `npm run build` (production build).
- `npm run start` (run built app).

Lint / Typecheck
- `npm run lint` (ESLint).
- `npx tsc --noEmit` (TypeScript check).

Testing
- No test runner configured in `package.json` yet.
- When a test runner is added, document the single-test command here.

## Required Quality Gates (Order Matters)
Run these after any coding task and before requesting review:
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

## TypeScript Configuration
- Strict mode enabled (`tsconfig.json`).
- Path alias: `@/*` maps to `./src/*`.
- Module resolution: `bundler` with Next.js plugin.

## ESLint Configuration
- Extends `eslint-config-next` via `eslint.config.mjs`.
- Custom rule: `react-hooks/set-state-in-effect` is disabled.
- Ignore patterns: `.next/`, `out/`, `build/`, `node_modules/`, `next-env.d.ts`.

## Code Style
General
- Use `.ts`/`.tsx` only.
- Prefer small, typed helpers over ad-hoc inline logic.
- Avoid type erasure; do not use `any` unless absolutely unavoidable.

Formatting
- 2-space indentation.
- Trailing commas preferred.
- Tailwind classes: order as layout -> spacing -> color.

Naming
- Components: `PascalCase`.
- Hooks: `use`-prefixed `camelCase`.
- Utilities: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE`.

Imports
- Use `@/` alias for internal modules under `src/`.
- No enforced import ordering; match nearby files when editing.

Error Handling
- Do not swallow errors; avoid empty `catch` blocks.
- Surface errors in UI or return typed errors from helpers.
- Follow existing error handling patterns within the module you touch.

## File and Module Placement
- Routes and route handlers belong in `src/app/`.
- Stateless utilities live in `src/lib/`.
- Global styles live in `src/app/globals.css`.
- Prefer class-based styling over new global stylesheets.
- Root configs (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
  `postcss.config.mjs`) should only be changed with documented impact.

## State and Data Flow
- Actions and types: `src/lib/types.ts`.
- Reducer and state transitions: `src/lib/state.ts`.
- AI route: `src/app/api/plan/route.ts` selects provider based on env.
- Export formats: `src/lib/exporters.ts` (JSON/ICS).

## Implementation Notes
- System prompts live in `src/lib/prompts.ts`.
- Message helpers live in `src/lib/message-utils.ts`.
- Conversation UI exposes a provider selector in the header.

## UI and Styling
- Use shadcn/ui components from `src/components/ui/` when possible.
- Prefer Tailwind utility classes over bespoke CSS.
- Keep shared styles in `src/app/globals.css` only when necessary.
- Match existing component patterns and prop naming.

## Environment Variables
- `PLANNER_AI_PROVIDER`: `openrouter`, `groq`, or `auto` (default).
- `NEXT_PUBLIC_DEFAULT_AI_PROVIDER`: default for UI provider selector.
- `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_VISION_MODEL`.
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_VISION_MODEL`.

## Testing Guidelines (Future)
- Preferred location: `src/__tests__/`.
- File naming: `<feature>.test.tsx` or `<feature>.spec.ts`.
- Favor high-value flows over snapshots.

## Commit and PR Guidelines
- Conventional Commits (e.g., `feat: calendar day view`).
- Keep commits scoped to one logical change plus required config edits.
- PRs should link issues, note testing, and include UI screenshots for visuals.

## Phase Tracker (Historical)
2025-11-18
- [x] Phase 1: Groq provider integration & API validation
- [x] Phase 2: Documentation, env templates, privacy updates
- [x] Phase 3: Conversation UI provider selector & runtime override plumbing
- [x] Phase 4: Docs/env/privacy refresh for selector toggle
- [x] Phase 5: Build shadcn Select component for provider control
- [x] Phase 6: README copy tweaks & regression checks

2025-12-20
- [x] Phase 1: Verify advisory targets & align React/Next versions
- [x] Phase 2: Validate checks (tsc/lint/build) and push

2025-12-20 (Next 16.0.10 pin)
- [x] Phase 1: Pin Next.js 16.0.10 and align tooling
- [x] Phase 2: Validate checks (tsc/lint/build) and push

2026-01-20
- [x] Phase 1: Mobile UI/UX layout improvements

## Editor Rules
- No Cursor rules found in `.cursor/rules/` or `.cursorrules`.
- No Copilot instructions found in `.github/copilot-instructions.md`.
