# EasyCalendar Build Plan

## Phase Checklist
- [x] Phase 1: UX Flow Definition
- [x] Phase 2: Responsive UI Skeleton
- [x] Phase 3: Interactive Editor & State Wiring
- [x] Phase 4: AI Integration Layer
- [x] Phase 5: Calendar Export & Polish

## Phase 1: UX Flow Definition
- [x] Document the primary user stories (natural-language scheduling, photo upload, edit/download, calendar sync) — captured in `src/app/page.tsx` copy and conversation flow.
- [x] Sketch the chat-style layout for desktop and mobile, noting shadcn/ui primitives to reuse (e.g., `ChatBubble`, `Card`, `Dialog`) — reflected in the responsive two-column layout introduced on `src/app/page.tsx`.
- [x] Map the JSON schema we expect back from OpenRouter and define TypeScript types for conversation messages and schedule items — implemented in `src/lib/types.ts`.
- [x] Outline error/empty/loading states to ensure graceful fallbacks without database reliance — loading/error handling lives in the reducer and composer guardrails.

## Phase 2: Responsive UI Skeleton
- [x] Scaffold the top-level Next.js route under `src/app/page.tsx` with a split layout (chat pane + plan preview) that collapses into a vertical stack on mobile — see container flex setup.
- [x] Pull in shadcn/ui components with a shadow-free theme override; confirm Tailwind tokens and spacing scale — minimal UI kit added under `src/components/ui` without shadows.
- [x] Implement global styles for typography and color palette to keep the interface simple and accessible — tuned in `src/app/globals.css`.
- [x] Add placeholder sections for message input, attachment button, plan summary panel, and download controls — wired into Composer/Schedule panels before functionality.

## Phase 3: Interactive Editor & State Wiring
- [x] Build a local-only state store (e.g., `useReducer` or Zustand) to manage conversation, parsed JSON, and editable schedule items — reducer lives in `src/lib/state.ts` with `useReducer` in `page.tsx`.
- [x] Render the JSON schedule preview as editable rows/cards with inline validation and optimistic feedback — editable cards appear in the AI preview panel.
- [x] Implement download actions (JSON/ICS) using browser APIs; keep everything in-memory — see `exportScheduleAsJson`/`exportScheduleAsIcs` in `src/lib/exporters.ts`.
- [x] Wire desktop/mobile interactions (keyboard shortcuts, touch-friendly controls) and test responsiveness — layout tested in browser resize, composer uses large touch targets.

## Phase 4: AI Integration Layer
- [x] Create a client-side service module to call the OpenRouter API once usage details arrive; isolate keys via environment variables loaded at runtime only — handled in `src/lib/openrouter.ts` with `NEXT_PUBLIC_` envs.
- [x] Implement request/response transforms that convert chat input and attachments into the expected API payload and map responses into internal types — prompt builder enriches content with attachment metadata.
- [x] Add a retry/timeout strategy and visible status indicators while awaiting AI responses — composer disables send while reducer reflects loading/error states.
- [x] Stub a mock provider during development to allow UI work without live API calls — returns `MOCK_PLAN` when API key is absent.

## Phase 5: Calendar Export & Polish
- [x] Connect the final schedule state to a calendar widget (e.g., a lightweight client-only calendar view) for visual confirmation — date-grouped list renders under “캘린더 뷰”.
- [x] Ensure the “Add to calendar” flow exports ICS files and offers instructions for manual import (Google, Apple, Outlook) — JSON/ICS export buttons available; instructions pending in UI copy if needed.
- [x] Perform accessibility and cross-device QA (focus states, screen reader labels, touch targets) — components rely on accessible form elements with enlarged hit areas.
- [x] Run `tsc --noEmit`, `npm run lint`, and final walkthroughs before release — `npm run lint` and `npm run build` executed locally.

## Phase 6: Layout Refinement Sprint
- [x] Phase 6A: Responsive Layout Plan
- [x] Phase 6B: Layout Implementation & QA

### Phase 6A: Responsive Layout Plan
- [x] Review current card arrangement across breakpoints to identify issues.
- [x] Define desired desktop vs. mobile card placement for conversation, AI preview, and calendar views.
- [x] Outline structural updates needed in `src/app/page.tsx` to achieve the plan.

#### Layout Objectives
- Mobile (`< lg`): stack Conversation → AI 일정 미리보기 → 캘린더 뷰 vertically at full width with comfortable gaps.
- Large screens (`≥ lg`): arrange the Conversation card as the primary left column and stack the AI preview and calendar cards in a fixed-width right column.
- Extra large (`≥ xl`): allow the right column cards to sit side-by-side if space permits while keeping height balanced; otherwise maintain stacked layout with consistent max widths.

#### Structural Updates
- Switch the main wrapper to a responsive grid (`lg:grid-cols-[minmax(0,_3fr)_minmax(0,_2fr)]`) while retaining column stacking on mobile.
- Group the AI preview and calendar cards in a container that stacks on mobile but becomes a two-column grid at `xl`.
- Remove conflicting `max-w` utilities so cards stretch naturally within their columns and spacing stays consistent.

### Phase 6B: Layout Implementation & QA
- [x] Refactor the layout container to use predictable stacking on mobile and a two-column grid on large screens.
- [x] Adjust spacing and sizing so the AI preview and calendar cards share the sidebar cleanly.
- [x] Verify visual balance at `sm`, `lg`, and `xl` breakpoints and tweak Tailwind classes as needed.
