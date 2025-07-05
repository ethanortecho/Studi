# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a React Native Expo study tracking application built with TypeScript. The main app code is located in `studi-app/`.

### Key Architecture Components

- **File-based routing**: Uses Expo Router with files in `app/` directory
- **Context-based state management**: `StudySessionContext` manages global session state
- **API integration**: Backend API calls through `utils/studySession.ts` and `utils/fetchApi.tsx`
- **Component organization**: Modular components organized by feature (analytics, timer, insights, etc.)

### Critical State Management

The app revolves around `StudySessionContext` which manages:
- Active study sessions with start/stop/pause/resume functionality
- Category blocks (time segments within sessions)
- Session statistics and modals
- Category management and break categories

## Development Commands

All commands should be run from the `studi-app/` directory:

```bash
# Start development server
npm run start
# or
npx expo start

# Platform-specific development
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web browser

# Testing and code quality
npm run test         # Run Jest tests
npm run lint         # Run Expo linting

# Project utilities
npm run reset-project # Reset to blank project template
```

## Key Configuration

- **API Configuration**: `config/api.ts` contains API base URL (currently set to `0.0.0.0:8000`)
- **Styling**: Uses NativeWind (Tailwind CSS for React Native) + custom theme system
- **TypeScript**: Strict mode enabled with path aliases (`@/*` maps to root)
- **Navigation**: Tab-based navigation with screens for Home, Insights, and Settings

## Important Data Flow

1. **Session Management**: Sessions are created/managed through `StudySessionContext`
2. **Category System**: Categories have colors and are used for time tracking
3. **Analytics**: Daily/weekly insights are fetched from backend API
4. **Timer Components**: Three timer types (Stopwatch, Countdown, Pomodoro) with shared logic

## Testing

- Jest configuration with `jest-expo` preset
- Component tests in `components/__tests__/`
- Test command: `npm run test`

## Development Notes

- Uses Expo SDK 53 with React Native 0.79
- Supports iOS, Android, and web platforms
- API calls expect a backend running on port 8000
- Color scheme supports both light and dark modes

## Development Workflow Rules

You are an expert software architect and developer. Follow this STRICT workflow for every feature request:

### PHASE 1: Requirements Gathering (ALWAYS DO FIRST)
Before writing ANY code, ask clarifying questions:

1. What is the specific user need/problem?
2. What are the expected inputs and outputs?
3. Are there any constraints or edge cases?
4. How should errors be handled?
5. What is the expected scale/performance requirement?

### PHASE 2: Architecture Proposal
After understanding requirements, provide 2-3 high-level solutions considering:

1. Scalability and performance implications
2. Code maintainability and testing strategy
3. Trade-offs for each approach

Wait for user to choose an approach before proceeding.

### PHASE 3: Implementation Planning
For the chosen approach:

1. Break down into 3-5 small, testable steps
2. Identify any additional implementation details needed
3. List the files that will be created/modified
4. Define success criteria for each step

### PHASE 4: Incremental Implementation

1. Implement ONE step at a time
2. Ensure each step works before moving to next

### CRITICAL RULES:

- CR1: NEVER skip directly to implementation
- CR2: ALWAYS ask questions first, even for "simple" features
- CR3: Prefer composition over complexity
- CR4: Consider error states and edge cases upfront

### Expected Response Format:
"I'll help you implement [feature]. Let me first understand your requirements:
1.1: [Specific clarifying question]
1.2: [Another clarifying question]
2.1: [Edge case consideration]
This will help me propose the best architecture for your needs."