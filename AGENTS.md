# Repository Guidelines

Stay aligned on the Next.js calendar app; revise these notes as workflows evolve.

## Workflow Rules
- phase대로 짜고 계획하기 — define named phases and capture objectives before coding.
- phase가 끝나면 첨부된 md 파일의 체크박스에 체크하기 — tick the phase-tracker markdown checklist when each phase ends.
- 타입스크립트 문법 문제 체크하기 — run `tsc --noEmit` after every phase to catch type issues early.
- 타입스크립트 린트 문제 체크하기 — run `npm run lint` and clear warnings before starting the next phase.

## Project Structure & Module Organization
- Core routes live in `src/app`; add feature folders like `src/app/events/page.tsx` and share layouts via `layout.tsx`.
- Utilities stay in `src/lib`; keep helpers stateless and typed.
- Global Tailwind styles live in `src/app/globals.css`; prefer class-based styling over new global files.
- Static assets belong in `public`; import them with `/asset-name` paths.
- Touch root configs (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`) only with documented impact.

## Build, Test, and Development Commands
- `npm run dev` — local dev server with fast refresh; keep running while iterating.
- `npm run build` — production bundle; run before PRs that affect routing or tooling.
- `npm run start` — serves the compiled `.next`; smoke-test production mode.
- `npm run lint` — runs `next/core-web-vitals`; fix warnings before pushing.

## Coding Style & Naming Conventions
- Use `.tsx`/`.ts`; add explicit return types on exported helpers when clarity helps.
- Indent 2 spaces with trailing commas; favor descriptive names over abbreviations.
- Components use PascalCase, hooks use `use`-prefixed camelCase, utilities camelCase, constants SCREAMING_SNAKE_CASE.
- Order Tailwind classes as layout → spacing → color for readability.

## Testing Guidelines
- Add Testing Library or Playwright when ready and mirror specs under `src/__tests__`.
- Name files `<feature>.test.tsx` or `<feature>.spec.ts`; cover high-value flows over snapshots.
- Add `npm run test` once tooling lands and run it before requesting review.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat: calendar day view`) to keep the log readable.
- Keep commits focused on one logical change plus necessary config edits.
- Pull requests should link issues, note testing, and attach UI screenshots when visuals change.
- Request review only after lint/build pass locally and document reproduction steps for complex fixes.
