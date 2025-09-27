# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EasyCalendar is a Next.js 15 application that allows users to create and manage schedules through natural language conversation with AI. Users can describe their plans in Korean or attach images, and the AI generates structured calendar events that can be edited and exported.

## Architecture

**Framework**: Next.js 15 with App Router and React 19
**Styling**: Tailwind CSS with custom design system using shadcn/ui components
**State Management**: React useReducer with centralized state in `src/lib/state.ts`
**AI Integration**: OpenRouter API through `/api/plan` route for natural language processing
**UI Library**: Lucide React icons with shadcn/ui components styled with "new-york" theme

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/ui/` - Reusable UI components (shadcn/ui based)
- `src/lib/` - Core business logic, types, and utilities

### Core Data Flow
1. User input → Reducer actions in `src/lib/state.ts`
2. AI requests → `/api/plan/route.ts` → OpenRouter API
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

- `OPENROUTER_API_KEY` - Required for AI functionality
- `OPENROUTER_MODEL` - Optional, defaults to "x-ai/grok-4-fast"

## Key Implementation Details

**State Management**: The app uses a reducer pattern with actions defined in `src/lib/types.ts` and implemented in `src/lib/state.ts`. All schedule and conversation state flows through this centralized system.

**TypeScript Configuration**: Uses strict mode with path aliases (`@/*` maps to `./src/*`) and Next.js plugin for optimal IDE support.

**UI Components**: Built with shadcn/ui using Tailwind CSS variables for theming. Components support Korean language interface with proper image attachment handling.

**AI Integration**: Conversations are processed through OpenRouter with image attachment support. The system prompt and message utilities are in `src/lib/prompts.ts` and `src/lib/message-utils.ts`.

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