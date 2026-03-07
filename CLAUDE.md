# CLAUDE.md — Starfox Calendar

## Project Overview

Starfox Calendar is a dual-platform meeting calendar application for the Starfox team. The **web app** (React/TypeScript/Vite) is the primary target, deployed to GitHub Pages at calendar.rspmgmt.com. A **Flutter mobile app** (lib/) mirrors the same functionality for Android/iOS.

### Current Architecture

- **State**: Zustand with localStorage persistence (`store/useStore.ts`)
- **Storage**: Local-first IndexedDB (`idb`) with optional Supabase cloud sync
- **Auth**: Supabase Auth (Google, Microsoft, Apple OAuth)
- **Calendar sync**: Google Calendar, Outlook, Apple iCal via OAuth + PKCE
- **Styling**: Tailwind CSS 3 with system-preference dark mode
- **Routing**: No router library — conditional rendering via `currentView` state in `App.tsx`
- **Testing**: None currently configured
- **CI/CD**: GitHub Actions → GitHub Pages on push to main

### Key Entry Points

| Purpose | File |
|---|---|
| Web app root | `web-app/src/main.tsx` → `App.tsx` |
| State store | `web-app/src/store/useStore.ts` |
| Type definitions | `web-app/src/types/index.ts` |
| Storage adapter | `web-app/src/services/storageAdapter.ts` |
| IndexedDB ops | `web-app/src/services/storage.ts` |
| Supabase client | `web-app/src/services/supabase.ts` |
| Flutter entry | `lib/main.dart` |
| Deploy workflow | `.github/workflows/deploy-web.yml` |

### Commands

```bash
cd web-app
npm install          # Install dependencies
npm run dev          # Dev server at localhost:5173
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint (zero warnings enforced)
npm run preview      # Preview production build locally
```

---

## Session Goals

This session focuses on five objectives:

1. **Modernize** — Upgrade dependencies, patterns, and tooling to current best practices
2. **Local install version** — Support installable PWA (Progressive Web App) for offline-first desktop/mobile use
3. **Enterprise-level code quality** — Testing, error handling, observability, and maintainability
4. **Frictionless Microsoft 365 integration** — One-click Outlook/Teams calendar connect (no developer console required)
5. **Slack bot** — Meeting notifications, daily digests, and conflict alerts posted to Slack channels

All work must also satisfy **accessibility (a11y)** and **evidence-based UI/UX** standards as defined below.

---

## Code Standards

### TypeScript

- **Strict mode** is enabled — keep it that way
- No `any` types in new code; incrementally remove existing `any` usage
- Prefer discriminated unions over string enums where applicable
- Use `satisfies` operator for type-safe object literals
- All public function signatures must have explicit return types
- Prefer `interface` for object shapes, `type` for unions/intersections

### React Patterns

- Functional components only; no class components
- Custom hooks for reusable logic — extract from components when logic exceeds ~15 lines
- Colocate component, hook, and test files (e.g., `WeeklyView.tsx`, `WeeklyView.test.tsx`)
- Avoid prop drilling beyond 2 levels — use Zustand selectors or context
- Memoize expensive computations with `useMemo`; memoize callbacks passed to children with `useCallback`
- Prefer controlled components for form inputs
- All components must accept and spread an optional `className` prop for composition

### File Organization

```
web-app/src/
├── components/       # UI components (colocated with tests)
├── hooks/            # Shared custom hooks
├── contexts/         # React contexts
├── store/            # Zustand store slices
├── services/         # External integrations (storage, auth, sync)
├── types/            # Shared TypeScript types
├── models/           # Default/seed data
├── utils/            # Pure utility functions
└── constants.ts      # App-wide constants
```

### Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils/services: `camelCase.ts`
- Types/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- CSS classes: Tailwind utilities; custom classes use kebab-case
- Test files: `*.test.tsx` or `*.test.ts` colocated with source

### Error Handling

- Never swallow errors silently — log and surface to user via toast system
- Use `ErrorBoundary` components at route/view boundaries
- Services must return typed error results, not throw unexpectedly
- Network calls: always handle timeout, offline, and auth-expired states
- Storage operations: graceful degradation from Supabase → IndexedDB → in-memory

### Git & Commits

- Conventional Commits format: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `perf:`, `a11y:`
- One logical change per commit
- Branch naming: `claude/<description>-<session-id>`

---

## Accessibility (a11y) Standards

All UI must meet **WCAG 2.2 Level AA** at minimum. Apply these rules to every component:

### Semantic HTML

- Use landmarks: `<main>`, `<nav>`, `<header>`, `<aside>`, `<section>` with `aria-label`
- Headings (`h1`–`h6`) must follow a logical hierarchy — no skipped levels
- Use `<button>` for actions, `<a>` for navigation — never `<div onClick>`
- Lists of items use `<ul>`/`<ol>`/`<li>`
- Tables for tabular data use `<th scope>`, `<caption>`, and proper `<thead>`/`<tbody>`

### Keyboard Navigation

- All interactive elements must be focusable and operable via keyboard
- Visible focus indicators on every focusable element (minimum 2px outline, 3:1 contrast)
- Logical tab order; use `tabIndex={0}` only when necessary, never positive values
- Modal dialogs trap focus; Escape closes them; focus returns to trigger on close
- Drag-and-drop interactions must have a keyboard alternative (e.g., arrow keys or a menu)

### ARIA

- Prefer semantic HTML over ARIA — add ARIA only when HTML semantics are insufficient
- Dynamic content updates use `aria-live="polite"` (toasts, status messages) or `aria-live="assertive"` (errors)
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title
- Loading states: `aria-busy="true"` on the updating region
- Toggle buttons: `aria-pressed`; expandable sections: `aria-expanded`
- Form inputs: always associate `<label>` or use `aria-label`/`aria-labelledby`

### Color & Contrast

- Text contrast minimum 4.5:1 (normal text) or 3:1 (large text, ≥18px bold / ≥24px)
- UI component contrast minimum 3:1 against adjacent colors
- Never rely on color alone to convey information — pair with icons, patterns, or text
- Dark mode must independently meet all contrast requirements
- Test with simulated color vision deficiencies (protanopia, deuteranopia, tritanopia)

### Motion & Responsiveness

- Respect `prefers-reduced-motion` — disable or simplify all animations
- Touch targets minimum 44×44px (WCAG 2.2 Target Size)
- Support 200% browser zoom without loss of content or functionality
- Content must reflow at 320px viewport width (no horizontal scrolling)

### Testing a11y

- Run axe-core or similar automated checks as part of CI
- Manual screen reader testing (NVDA/VoiceOver) for new views and modals

---

## UI/UX Standards

Apply evidence-based principles from Nielsen Norman Group, Material Design 3, and Human Interface Guidelines:

### Layout & Visual Hierarchy

- **F-pattern/Z-pattern** scanning: Place primary actions and critical info top-left and along the top
- **8px grid system**: All spacing and sizing aligned to multiples of 4px/8px
- **Progressive disclosure**: Show only essential information first; details on demand
- **Consistent gutters and padding**: Use Tailwind spacing scale consistently (e.g., `p-4`, `gap-4`)

### Interaction Design

- **Immediate feedback**: Every user action gets visible feedback within 100ms (hover states, active states, optimistic updates)
- **Forgiving design**: Undo support for destructive actions (deleting meetings); confirm dialogs for bulk operations
- **Recognition over recall**: Use icons + labels together; prefer dropdowns over free text for constrained choices
- **Fitts's Law**: Frequently used actions get larger click targets and closer placement to cursor flow
- **Loading states**: Skeleton screens preferred over spinners for layout-stable loads; spinners for indeterminate waits < 2s

### Navigation & Information Architecture

- **Persistent navigation**: Current view always identifiable; breadcrumbs or tab highlighting
- **Shallow hierarchy**: Minimize clicks to reach any meeting (target: ≤ 3 clicks from app root)
- **Consistent positioning**: Modals, drawers, and action buttons appear in predictable locations across all views

### Typography

- **System font stack**: Inter / system-ui for performance; fallback to sans-serif
- **Limited type scale**: Use 3–4 font sizes maximum (e.g., `text-sm`, `text-base`, `text-lg`, `text-xl`)
- **Line length**: 45–75 characters per line for body text readability

### Feedback & Messaging

- **Toast notifications**: Non-blocking, auto-dismiss (5s default); persistent for errors requiring action
- **Empty states**: Helpful illustration or message + clear CTA when no data exists
- **Error messages**: Specific, actionable, blame-free (e.g., "Couldn't save — check your connection" not "Error 500")

### Dark Mode

- True dark backgrounds (`gray-900`/`gray-950`), not pure black
- Reduce white-on-dark contrast slightly to avoid halation (use `gray-100` not `white` for body text)
- Elevation expressed through lighter surface tones, not shadows
- Test both modes independently for all new components

---

## PWA / Local Install Requirements

When implementing the installable PWA:

- **Service Worker**: Workbox-based, cache-first for static assets, network-first for API
- **Web App Manifest**: `name`, `short_name`, `icons` (192px, 512px, maskable), `start_url`, `display: standalone`, `theme_color`, `background_color`
- **Offline support**: Full functionality using IndexedDB; queue mutations for sync when online
- **Install prompt**: Custom in-app install banner using `beforeinstallprompt` event
- **Update flow**: Notify user of new version; apply on next navigation or refresh

---

## Microsoft 365 Integration (Outlook + Teams)

### Current State & Problems

The existing Outlook sync (`services/calendarSync.ts`) requires users to:
1. Visit Azure Portal and create an app registration
2. Configure redirect URIs manually
3. Copy/paste a client ID into a multi-step setup wizard

This is unacceptable friction for non-technical users. The goal is **one-click connect**.

### Target Architecture

#### Pre-registered Multi-Tenant Azure AD App
- Register a single Azure AD app under the Starfox org with **multi-tenant** support (`/common` endpoint)
- Client ID shipped as a build-time env var (`VITE_MS_CLIENT_ID`) — not a secret, safe for SPA
- Users click "Connect Microsoft 365" → redirected to Microsoft login → consent → done
- No setup wizard steps for Microsoft; no client ID input fields

#### MSAL.js Integration
- Replace raw `fetch`-based OAuth with **@azure/msal-browser** (Microsoft Authentication Library)
- Use **PKCE authorization code flow** (recommended for SPAs; implicit flow is deprecated)
- Silent token refresh via hidden iframe — users stay logged in across sessions
- Scopes requested:
  - `Calendars.Read` — read Outlook calendar events
  - `OnlineMeetings.Read` — read Teams meeting details (join URLs, attendees)
  - `User.Read` — basic profile for display name / avatar
  - `Presence.Read` (optional, future) — show availability status

#### Microsoft Graph API Endpoints
| Feature | Endpoint | Notes |
|---|---|---|
| List calendars | `GET /me/calendars` | Let user pick which calendar(s) to sync |
| Calendar events | `GET /me/calendarView` | Time-range filtered, handles recurrence expansion |
| Teams meetings | `GET /me/onlineMeetings` | Pull Teams-specific metadata (join URL, lobby settings) |
| Free/busy | `POST /me/calendar/getSchedule` | Check availability for conflict detection |

#### Event Mapping Enhancements
- Detect Teams meetings from `onlineMeeting` property on Graph events → auto-set `meetingLinkType: 'teams'` and extract join URL
- Import attendee response status (accepted/tentative/declined)
- Preserve organizer info for display
- Map Graph `sensitivity` field to `publicVisibility`
- Support recurring event series via `seriesMasterId`

#### Token Management
- Access tokens held in memory only (MSAL cache in `sessionStorage` with encryption)
- Refresh tokens managed by MSAL silently — no user action needed
- On token expiry: silent refresh → if fails, show non-blocking "Reconnect" prompt
- On logout/disconnect: revoke tokens and clear MSAL cache

#### Sync Behavior
- **Initial sync**: Pull 30 days of events on connect
- **Incremental sync**: Use Graph `delta` queries for efficient polling (only changed events)
- **Background sync**: Poll every 5 minutes when app is visible; sync-on-focus when tab reactivated
- **Conflict resolution**: External calendar is source of truth for synced events; local edits flagged as overrides

### UX Flow

1. User clicks **"Connect Outlook / Teams"** button (prominent, branded with Microsoft logo)
2. Microsoft login popup opens (MSAL popup flow — no full-page redirect)
3. User signs in with work/school or personal Microsoft account
4. Consent screen shows requested permissions (first time only)
5. Popup closes → calendar list loads → user selects calendars to sync
6. Events appear in the app within seconds
7. Status indicator shows "Connected to Microsoft 365" with last sync time

---

## Slack Bot Integration

### Overview

A Slack bot that posts meeting-related notifications to team channels. Runs as a **lightweight backend service** (can be a Supabase Edge Function, Cloudflare Worker, or standalone Node.js service).

### Slack App Configuration
- **Bot token scopes**: `chat:write`, `channels:read`, `groups:read`, `users:read`
- **Event subscriptions** (optional, for interactive features): `app_mention`, `message.channels`
- **Slash commands** (optional): `/meetings today`, `/meetings conflicts`, `/meetings next`
- **OAuth**: Slack "Add to Workspace" flow for team installation

### Features — Phased Rollout

#### Phase 1: Notifications (Push from Calendar → Slack)
- **Daily digest**: Post a morning summary of today's meetings to a configured channel (e.g., `#team-calendar`)
- **Conflict alerts**: When a new conflict is detected, post to channel with affected meetings and people
- **Meeting reminders**: Configurable pre-meeting reminder (e.g., 10 min before) with join link
- **Sync status**: Post when calendar sync succeeds or fails (to an admin/ops channel)

#### Phase 2: Interactive (Slack ↔ Calendar)
- **Slash commands**: `/starfox today` — list today's meetings; `/starfox conflicts` — show current conflicts
- **Block Kit messages**: Rich meeting cards with buttons (Join Meeting, View Details, Snooze Reminder)
- **Channel mapping**: Map Slack channels to calendar categories/teams (e.g., `#frontend-team` ↔ "Frontend" category)

#### Phase 3: Bidirectional (Future)
- Create/update meetings from Slack via modal dialogs
- RSVP to meetings from Slack reactions or buttons
- Presence sync: show meeting status in Slack user status

### Architecture

```
┌─────────────┐     Webhook/Cron      ┌──────────────────┐
│  Starfox    │  ──────────────────►  │  Slack Bot        │
│  Web App    │                       │  (Edge Function)  │
│  (Supabase) │  ◄──────────────────  │                   │
└─────────────┘     Slash Commands    └──────────────────┘
       │                                      │
       │ Supabase DB                          │ Slack API
       ▼                                      ▼
  ┌──────────┐                         ┌───────────┐
  │ Meetings │                         │  Slack    │
  │ Table    │                         │  Channels │
  └──────────┘                         └───────────┘
```

- **Trigger mechanism**: Supabase Database Webhooks on meeting insert/update/delete → call Edge Function → post to Slack
- **Cron for digests**: Supabase `pg_cron` or external scheduler triggers daily digest Edge Function
- **Config storage**: New `slack_config` table in Supabase (webhook URL, channel mappings, notification preferences)
- **No secrets in frontend**: Slack bot token and webhook URLs stored server-side only (Supabase secrets / Edge Function env vars)

### Configuration UX (In-App)

- Settings page gets a **"Slack Integration"** section
- **Connect to Slack** button → Slack OAuth "Add to Workspace" flow
- Channel selector: pick which Slack channel receives notifications
- Notification preferences: toggles for digest, reminders, conflict alerts
- Test button: sends a test message to verify connection

### Data Types

```typescript
interface SlackConfig {
  id: string;
  teamId: string;              // Slack team/workspace ID
  botToken: string;            // Stored server-side only, never sent to client
  defaultChannelId: string;    // Default notification channel
  channelMappings: {           // Category → Slack channel mapping
    categoryId: string;
    channelId: string;
    channelName: string;
  }[];
  notifications: {
    dailyDigest: boolean;
    dailyDigestTime: string;   // e.g., "08:30" in team timezone
    conflictAlerts: boolean;
    meetingReminders: boolean;
    reminderMinutesBefore: number;
  };
  installedBy: string;         // User ID who installed the bot
  installedAt: string;         // ISO timestamp
}
```

---

## Testing Requirements

- **Framework**: Vitest (aligned with Vite) + React Testing Library
- **Coverage target**: ≥ 80% line coverage for services and utils; ≥ 60% for components
- **Unit tests**: All utility functions, store actions, and service methods
- **Component tests**: Render, user interaction, and a11y assertions (via `jest-axe` or `vitest-axe`)
- **Integration tests**: Storage adapter switching, auth flow, calendar sync parsing
- **No snapshot tests** — they add noise and break on cosmetic changes
- **Test naming**: `it('should <expected behavior> when <condition>')` format
- **CI enforcement**: Tests must pass before deploy in GitHub Actions workflow

---

## Performance Budgets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **JavaScript bundle**: < 200KB gzipped (total)
- **Lighthouse score**: ≥ 90 for Performance, Accessibility, Best Practices, PWA

---

## Security

- No secrets in source code — use environment variables (`VITE_*` prefix)
- Supabase Row Level Security (RLS) enforced on all tables
- OAuth tokens stored in memory only, never persisted to localStorage
- CSP headers configured for production deployment
- Dependencies audited (`npm audit`) with no critical vulnerabilities
