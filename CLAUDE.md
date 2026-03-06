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

This session focuses on three objectives:

1. **Modernize** — Upgrade dependencies, patterns, and tooling to current best practices
2. **Local install version** — Support installable PWA (Progressive Web App) for offline-first desktop/mobile use
3. **Enterprise-level code quality** — Testing, error handling, observability, and maintainability

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
