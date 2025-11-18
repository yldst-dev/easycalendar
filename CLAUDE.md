# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EasyCalendar is a Next.js 15 application that allows users to create and manage schedules through natural language conversation with AI. Users can describe their plans in Korean or attach images, and the AI generates structured calendar events that can be edited and exported.

## Architecture

**Framework**: Next.js 15 with App Router and React 19
**Styling**: Tailwind CSS with custom design system using shadcn/ui components
**State Management**: React useReducer with centralized state in `src/lib/state.ts`
**AI Integration**: `/api/plan` dynamically selects Groq (Llama 4 multimodal) or OpenRouter models for natural language + vision processing, and the chat UI exposes a provider toggle in the conversation header.
**UI Library**: Lucide React icons with shadcn/ui components styled with "new-york" theme

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/ui/` - Reusable UI components (shadcn/ui based)
- `src/lib/` - Core business logic, types, and utilities

### Core Data Flow
1. User input → Reducer actions in `src/lib/state.ts`
2. AI requests → `/api/plan/route.ts` → Groq or OpenRouter API (depending on env config)
3. Schedule generation → State updates → UI re-renders
4. Export functionality → `src/lib/exporters.ts` (JSON/ICS formats)

## Development Commands

```bash
npm run dev     # Start development server (port 3000)
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Environment Variables Required

- `PLANNER_AI_PROVIDER` – `openrouter`, `groq`, or `auto` (default). `auto` prefers Groq when `GROQ_API_KEY` is present.
- `NEXT_PUBLIC_DEFAULT_AI_PROVIDER` – Mirrors the server default for the UI toggle. If omitted, the selector defaults to `auto`.
- `GROQ_API_KEY` – Needed to call Groq's low-latency Llama 4 models (optional unless provider requires it).
- `GROQ_MODEL` / `GROQ_VISION_MODEL` – Override Groq text vs. VLM defaults.
- `OPENROUTER_API_KEY` – Still required when running in OpenRouter-only mode or as fallback.
- `OPENROUTER_MODEL` / `OPENROUTER_VISION_MODEL` – Override OpenRouter defaults.

## Key Implementation Details

**State Management**: The app uses a reducer pattern with actions defined in `src/lib/types.ts` and implemented in `src/lib/state.ts`. All schedule and conversation state flows through this centralized system.

**TypeScript Configuration**: Uses strict mode with path aliases (`@/*` maps to `./src/*`) and Next.js plugin for optimal IDE support.

**UI Components**: Built with shadcn/ui using Tailwind CSS variables for theming. Components support Korean language interface with proper image attachment handling.

**AI Integration**: Conversations are proxied through `/api/plan`, which chooses Groq's Llama 4 Maverick for multimodal inputs or OpenRouter models as configured. Users can override in real time via the "모델 제공자" selector (stored in `localStorage`). The system prompt and message utilities are in `src/lib/prompts.ts` and `src/lib/message-utils.ts`.

## Code Quality Checks

**IMPORTANT**: After completing any coding tasks, you MUST run the following checks in order:

```bash
# 1. TypeScript type checking
npx tsc --noEmit

# 2. ESLint checking
npm run lint

# 3. Build verification
npm run build
```

All checks must pass before considering the work complete. If any check fails, fix the issues and re-run all checks.

## Testing

This project uses the default Next.js testing setup. Check `package.json` scripts for available test commands.
