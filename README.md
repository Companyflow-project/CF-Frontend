# CompanyFlow Frontend

A modern React + TypeScript application for managing employees, contacts, handbooks, and company accounts. Built with a feature-based architecture for scalability and maintainability.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development Guidelines](#development-guidelines)
- [API Integration](#api-integration)
- [Scripts](#scripts)

## Overview

CompanyFlow is a comprehensive employee management platform that allows organizations to:
- **Manage Employees**: Add, view, and track employee information, statistics, and message logs
- **Manage Contacts**: Store and organize internal and external contacts
- **Manage Handbook**: Create, edit, and publish company handbooks with sections and pages
- **Account Management**: Handle account settings, billing, and security

The application follows a **feature-based architecture** where each feature (auth, employees, contacts, handbook, account) is self-contained with its own API, hooks, components, and pages.

## Tech Stack

- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 5.0
- **Routing**: React Router v6 (with route-level code splitting via `React.lazy`)
- **Server State**: TanStack React Query v5 (caching, deduplication, background refresh)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui primitives
- **HTTP Client**: Axios (centralized client with auth + rate-limit interceptors)
- **Notifications**: Sonner (toast)
- **Icons**: Lucide React

## Project Structure

```
src/
├── features/                    # Feature-based modules
│   ├── account/                 # Account management feature
│   │   ├── api.ts              # API functions
│   │   ├── hooks.ts            # Data hooks
│   │   ├── queries.ts         # React Query keys
│   │   ├── routes.ts          # Route constants
│   │   └── pages/             # Feature pages
│   │
│   ├── auth/                   # Authentication feature
│   ├── contacts/               # Contacts management feature
│   ├── employees/              # Employees management feature
│   └── handbook/               # Handbook management feature
│
├── components/                 # Global shared components
│   ├── common/                 # Shared non-feature components
│   ├── layout/                 # Layout components
│   └── ui/                     # shadcn/ui primitives
│
├── context/                    # React context providers
│   └── auth-context.tsx        # Authentication context
│
├── layouts/                    # Page layouts
│   ├── app-layout.tsx          # Main app layout
│   └── auth-layout.tsx         # Auth pages layout
│
├── lib/                        # Utilities
│   ├── axios-client.ts         # Axios configuration
│   └── utils.ts                # Helper functions
│
├── pages/                      # Shared pages (non-feature)
│   └── console/                # Dashboard/home page
│
├── router/                     # Central routing configuration
│   └── index.tsx
│
├── types/                      # TypeScript type definitions
│   └── models.ts
│
├── app.tsx                     # Root app component
├── main.tsx                     # Entry point
└── index.css                   # Global styles
```

## Architecture

### Feature-Based Structure

This project uses a **feature-based architecture** where each business feature is organized as a self-contained module. This approach provides:

- **Isolation**: Features are independent and don't depend on each other
- **Scalability**: Easy to add new features without affecting existing ones
- **Maintainability**: Related code is grouped together

### Feature Module Pattern

Each feature follows this exact structure:

```
<feature-name>/
  ├── api.ts          # API functions using axiosClient from lib/
  ├── routes.ts       # Route path constants
  ├── queries.ts      # React Query key factories
  ├── hooks.ts        # useQuery/useMutation hooks wrapping API logic
  ├── components/     # Feature-specific UI components
  └── pages/          # Feature pages (list, detail, create)
```

### Server State (React Query)

All data fetching uses **TanStack React Query v5**. Hooks in `hooks.ts` use `useQuery` backed by key factories in `queries.ts`. This gives us:

- **Caching**: Data is served from cache on repeated views — no redundant network requests
- **Deduplication**: Simultaneous mounts of the same hook share a single in-flight request
- **Background refresh**: Stale data is refetched automatically when windows regain focus (disabled globally) or when explicitly invalidated after mutations
- **`staleTime` per hook**: Contacts list = 30s, potential employees = 60s, areas = 5min

After a mutation (create / update / delete), call `refetch()` from the hook to invalidate and re-sync.

### Code Splitting

All route-level components are loaded with `React.lazy()` + a top-level `<Suspense>` boundary in `src/router/index.tsx`. Only the auth/layout shell is in the initial bundle; every feature (including TipTap-heavy handbook pages) loads on demand.

### Import Rules

- **Feature pages** import from within their feature: `../hooks`, `../components`, `../api`, `../routes`
- **Feature components** import from their feature's API/hooks or global shared components
- **Global components** import from `@/components/ui` or `@/components/common`
- **Router** imports lazily from `@/features/<feature>/pages` and `@/features/<feature>/routes`

### Global Shared Folders

These folders are shared across all features:

- `components/ui/` - shadcn/ui primitives (reusable UI components)
- `components/common/` - Shared non-feature components (e.g., PageHeader, SidebarCard)
- `components/layout/` - Layout components (PageShell, TopNav)
- `context/` - React context providers (currently only auth-context)
- `lib/` - Utility functions (axios-client, utils)
- `router/` - Central routing configuration with lazy-loaded routes
- `pages/console/` - Dashboard page (shared, not feature-specific)

## Development Guidelines

### Creating a New Feature

1. Create a new directory under `src/features/<feature-name>/`
2. Add the required files:
   - `api.ts` - API functions using `axiosClient` from `@/lib/axios-client`
   - `routes.ts` - Route constants (e.g., `export const featureRoutes = { list: '/feature' }`)
   - `queries.ts` - React Query key factories (use the same pattern as `contacts/queries.ts`)
   - `hooks.ts` - `useQuery` / `useMutation` hooks backed by `queries.ts` keys
   - `components/` - Feature-specific components
   - `pages/` - Feature pages

3. Add a lazy import + route to `src/router/index.tsx`

### Adding a New Component

- **Feature-specific component**: Add to `src/features/<feature>/components/`
- **Shared component**: Add to `src/components/common/` or `src/components/layout/`
- **UI primitive**: Add to `src/components/ui/` (if it's a reusable UI component)
- Wrap table/list components in `React.memo` when their parent holds interactive state

### Writing Hooks

- Use `useQuery` for reads; always provide a `staleTime` appropriate to how frequently the data changes
- Use `useMutation` + `queryClient.invalidateQueries` for writes (or call `refetch()` from the hook)
- Define query keys in the feature's `queries.ts` using factory functions so invalidation is precise

### Code Style

- TypeScript for all files
- `@/` alias for imports from `src/`
- Kebab-case for file and folder names
- Named exports over default exports
- Functional components with hooks
- Wrap expensive derived values in `useMemo`, event handlers in `useCallback`
- Keep components focused — extract sub-components when a file exceeds ~200 lines

## API Integration

### Axios Client

The axios client is configured in `src/lib/axios-client.ts` and includes:
- Base URL from `VITE_API_BASE_URL` environment variable
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: handles 429 rate-limit errors

### API Functions

All API functions live in `src/features/<feature>/api.ts` and call `axiosClient` directly. They return typed data; error handling is left to the calling hook or component.

### React Query Setup

`QueryClientProvider` is mounted at the root in `src/app.tsx` with:
- `retry`: disabled on 429 responses, max 1 retry otherwise
- `refetchOnWindowFocus`: `false`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**Note**: The default backend URL is `http://localhost:3001/api` (matching the OpenAPI spec). The backend is currently read-only, so write operations (create, update, delete) will throw errors.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Authentication

Authentication is handled through:
- `src/context/auth-context.tsx` - Auth context provider (session check on mount, login/logout)
- `src/features/auth/` - Login and signup pages
- `RequireAuth` / `RedirectIfAuth` guards in `src/router/index.tsx`

## Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components for consistent UI primitives
- Global styles in `src/index.css`

## Dependencies

### Core
- `react` & `react-dom` — React framework
- `react-router-dom` — Routing
- `@tanstack/react-query` — Server state management
- `axios` — HTTP client
- `typescript` — Type safety

### UI & Styling
- `tailwindcss` — CSS framework
- `lucide-react` — Icons
- `sonner` — Toast notifications
- `clsx` & `tailwind-merge` — Class name utilities
- `@radix-ui/react-select` — Accessible select primitive

### Rich Text
- `@tiptap/*` — Rich text editor (used in handbook pages, loaded lazily)

### Development
- `vite` — Build tool
- `eslint` — Linting
- `@vitejs/plugin-react` — Vite React plugin

## Team

Chelle (UI/UX) rfuertes@mysigrid.com
Miguel (Dev) - mgasang@mysigrid.com