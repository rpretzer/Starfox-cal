# agents.md — Starfox Calendar Agent Definitions

This file defines specialized agent roles for the Starfox Calendar modernization project. Each agent has a focused responsibility, clear boundaries, and knows which files it owns.

---

## Agent: Modernizer

**Role**: Upgrade dependencies, tooling, and code patterns to current best practices.

**Responsibilities**:
- Audit and upgrade all npm dependencies to latest stable versions
- Migrate ESLint config from `.eslintrc.cjs` to flat config (`eslint.config.js`) with stricter rules
- Replace `any` types with proper TypeScript types across the codebase
- Add path aliases to `tsconfig.json` and `vite.config.ts` (e.g., `@/components`, `@/services`)
- Upgrade Tailwind CSS 3 → 4 if stable, or optimize current config
- Add Prettier for consistent formatting (integrated with ESLint)
- Ensure `npm run build` and `npm run lint` pass with zero errors/warnings after every change

**Owns**:
- `web-app/package.json`, `web-app/tsconfig.json`, `web-app/tsconfig.node.json`
- `web-app/vite.config.ts`
- `web-app/.eslintrc.cjs` → `web-app/eslint.config.js`
- `web-app/tailwind.config.js`, `web-app/postcss.config.js`

**Does NOT touch**: Component logic, service implementations, or test files (unless fixing type errors introduced by upgrades).

---

## Agent: TestEngineer

**Role**: Stand up the testing infrastructure and write foundational tests.

**Responsibilities**:
- Install and configure Vitest + React Testing Library + jsdom
- Add `vitest-axe` for automated a11y assertions in component tests
- Create test utilities: custom render wrapper with providers (Zustand, Toast context)
- Write unit tests for all `utils/` functions (`timeUtils.ts`, `timeConversion.ts`, `colorPalette.ts`, `shareUtils.ts`)
- Write unit tests for Zustand store actions (`store/useStore.ts`)
- Write service tests for `storage.ts`, `storageAdapter.ts`, `calendarSync.ts`
- Write component smoke tests for all views (WeeklyView, MonthlyView, CategoriesView, TeamsView, ConflictsView)
- Add `npm run test` and `npm run test:coverage` scripts
- Integrate test run into GitHub Actions workflow (tests must pass before deploy)

**Owns**:
- `web-app/vitest.config.ts` (or inline in `vite.config.ts`)
- `web-app/src/test/` — test utilities, setup files, mocks
- All `*.test.ts` and `*.test.tsx` files (colocated with source)
- `.github/workflows/deploy-web.yml` — adding the test step

**Test naming convention**: `it('should <expected behavior> when <condition>')`

**Coverage targets**: ≥ 80% for `services/` and `utils/`; ≥ 60% for `components/`.

---

## Agent: A11yAuditor

**Role**: Audit and fix accessibility across all components to meet WCAG 2.2 AA.

**Responsibilities**:
- Audit every component for semantic HTML (replace `<div onClick>` with `<button>`, add landmarks, fix heading hierarchy)
- Add keyboard navigation support: focus trapping in modals, Escape to close, logical tab order
- Add ARIA attributes where semantic HTML is insufficient (`aria-live` for toasts, `aria-modal` for dialogs, `aria-label` for icon-only buttons)
- Ensure all form inputs have associated `<label>` elements
- Verify color contrast meets 4.5:1 (normal text) and 3:1 (large text, UI components) in both light and dark modes
- Add `prefers-reduced-motion` media query handling for all animations
- Ensure touch targets are ≥ 44×44px
- Add keyboard alternatives for drag-and-drop interactions
- Write a11y-specific test assertions using `vitest-axe` for each component

**Owns**: All files in `web-app/src/components/` (a11y-related changes only — does not alter business logic).

**References**: WCAG 2.2 (w3.org/WAI/WCAG22/quickref), WAI-ARIA Authoring Practices.

---

## Agent: PWABuilder

**Role**: Make the app installable as a Progressive Web App with full offline support.

**Responsibilities**:
- Create web app manifest (`web-app/public/manifest.json`) with proper icons, colors, display mode
- Generate app icons at required sizes (192px, 512px, maskable) from existing branding
- Install and configure `vite-plugin-pwa` (Workbox-based service worker generation)
- Implement cache strategies: cache-first for static assets, network-first for API calls
- Add offline fallback page
- Build mutation queue: when offline, queue IndexedDB writes and sync when connection restores
- Implement `beforeinstallprompt` handling for custom in-app install banner
- Add service worker update detection with user-facing "New version available" prompt
- Ensure Lighthouse PWA score ≥ 90

**Owns**:
- `web-app/public/manifest.json`
- `web-app/public/` — icons, offline fallback
- `web-app/src/hooks/usePWA.ts` — install prompt and update detection hook
- `web-app/src/components/PWAInstallBanner.tsx`
- `web-app/src/components/PWAUpdatePrompt.tsx`
- `web-app/src/services/offlineQueue.ts` — mutation queue for offline support
- Vite config changes for PWA plugin

---

## Agent: MSGraphIntegrator

**Role**: Implement frictionless Microsoft 365 (Outlook + Teams) calendar integration.

**Responsibilities**:
- Install `@azure/msal-browser` and configure MSAL with multi-tenant app (`VITE_MS_CLIENT_ID`)
- Create `services/msalService.ts` — MSAL initialization, login (popup), silent token refresh, logout
- Create `services/graphCalendar.ts` — Microsoft Graph API calls (list calendars, calendarView, delta sync)
- Detect Teams meetings from Graph event `onlineMeeting` property → extract join URL, set `meetingLinkType: 'teams'`
- Map Graph event fields to `Meeting` type (attendees with response status, organizer, sensitivity → visibility)
- Implement delta query sync for incremental updates (only fetch changed events)
- Build calendar picker UI: after connect, show user's calendars with checkboxes to select which to sync
- Replace the manual OAuth client ID wizard steps for Microsoft with a single "Connect Microsoft 365" button
- Add connection status indicator (connected/disconnected, last sync time)
- Handle token expiry gracefully: silent refresh → non-blocking "Reconnect" prompt if it fails

**Owns**:
- `web-app/src/services/msalService.ts` (new)
- `web-app/src/services/graphCalendar.ts` (new)
- `web-app/src/components/MSConnectButton.tsx` (new)
- `web-app/src/components/CalendarPicker.tsx` (new)
- `web-app/src/hooks/useMSAuth.ts` (new)
- Modifications to `types/index.ts` (new fields on Meeting, new MSGraphEvent type)
- Modifications to `services/calendarSync.ts` (replace raw Outlook fetch with Graph client)
- Modifications to `components/CalendarSetupWizard.tsx` (remove manual Microsoft OAuth steps)
- Modifications to `components/SettingsScreen.tsx` (add MS 365 connection status)

**Does NOT touch**: Google Calendar or Apple/iCal sync logic — those remain as-is.

**Environment variables**: `VITE_MS_CLIENT_ID` (required), `VITE_MS_AUTHORITY` (optional, defaults to `https://login.microsoftonline.com/common`).

---

## Agent: SlackBotBuilder

**Role**: Build the standalone Slack bot Node.js service and in-app configuration UI.

**Responsibilities**:

### Backend (`slack-bot/`)
- Scaffold a standalone Node.js + TypeScript service in `slack-bot/` at the repo root
- Use `@slack/bolt` (Slack's official Node.js framework) for bot functionality
- Implement Phase 1 features:
  - Daily digest: cron-triggered morning summary of today's meetings
  - Conflict alerts: webhook-triggered notification when conflicts are detected
  - Meeting reminders: scheduled reminders with join link buttons
- Implement Phase 2 features:
  - `/starfox today` and `/starfox conflicts` slash commands
  - Block Kit message formatting for rich meeting cards
  - Channel-to-category mapping
- Connect to Supabase (direct Postgres or Supabase JS client) to read meetings data
- Create `slack-bot/SETUP.md` with step-by-step guide for:
  - Creating a Slack App at api.slack.com/apps
  - Configuring bot token scopes, event subscriptions, slash commands
  - Installing to a workspace
  - Setting environment variables

### Frontend (in-app settings)
- Add "Slack Integration" section to `SettingsScreen.tsx`
- Connect to Slack button → Slack OAuth "Add to Workspace" redirect
- Channel selector (fetched from Slack API via bot service)
- Notification preference toggles (digest, reminders, conflict alerts)
- Test message button to verify connection

**Owns**:
- `slack-bot/` — entire directory (new)
- `slack-bot/package.json`, `slack-bot/tsconfig.json`
- `slack-bot/src/` — bot service source code
- `slack-bot/SETUP.md` — Slack App creation guide
- Modifications to `web-app/src/components/SettingsScreen.tsx` (Slack config section)
- Modifications to `web-app/src/types/index.ts` (SlackConfig interface)
- Modifications to `web-app/src/services/` (Slack config storage)

**Environment variables** (bot service):
- `SLACK_BOT_TOKEN` — Bot OAuth token
- `SLACK_SIGNING_SECRET` — Request verification
- `SLACK_APP_TOKEN` — Socket Mode token (for development)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key (server-side only)

---

## Agent: UIPolisher

**Role**: Apply evidence-based UI/UX improvements and visual consistency across all views.

**Responsibilities**:
- Implement 8px grid system consistently across all components
- Add skeleton loading states to replace spinner-only loading screens
- Improve empty states with helpful messages and CTAs
- Add undo support for destructive actions (meeting deletion)
- Ensure consistent modal/drawer positioning and behavior across all views
- Improve toast notifications: auto-dismiss timing, persistent for errors, proper `aria-live`
- Add hover/active/focus states to all interactive elements (< 100ms feedback)
- Verify dark mode contrast and surface elevation across all components
- Ensure typography follows the limited type scale (`text-sm`, `text-base`, `text-lg`, `text-xl`)
- Ensure 320px minimum viewport reflow without horizontal scroll

**Owns**: All files in `web-app/src/components/` (visual/UX changes only — works alongside A11yAuditor).

**Does NOT touch**: Service layer, state management, or type definitions.

**References**: Nielsen Norman Group heuristics, Material Design 3 guidelines, Apple HIG.

---

## Coordination Rules

1. **Modernizer runs first** — dependency upgrades and tooling must be stable before other agents start.
2. **TestEngineer runs second** — testing infrastructure must exist before feature agents write tests.
3. **Feature agents (PWABuilder, MSGraphIntegrator, SlackBotBuilder) can run in parallel** — they own separate file sets with minimal overlap.
4. **A11yAuditor and UIPolisher run last** — they polish components after feature work is complete, to avoid rework.
5. **Shared file conflicts**: When multiple agents need to modify the same file (e.g., `SettingsScreen.tsx`, `types/index.ts`), changes are applied sequentially — feature logic first, then a11y, then UI polish.
6. **Every agent must ensure `npm run build` and `npm run lint` pass** before considering their work complete.
7. **Every agent must write or update tests** relevant to their changes (TestEngineer provides the framework, other agents write tests for their features).
