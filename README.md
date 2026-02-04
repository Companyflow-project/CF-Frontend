# CompanyFlow Frontend

A modern React + TypeScript application for managing employees, contacts, handbooks, and company accounts. Built with a feature-based architecture for scalability and maintainability.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Development Guidelines](#development-guidelines)
- [API Integration](#api-integration)
- [Scripts](#scripts)

## 🎯 Overview

CompanyFlow is a comprehensive employee management platform that allows organizations to:
- **Manage Employees**: Add, view, and track employee information, statistics, and message logs
- **Manage Contacts**: Store and organize internal and external contacts
- **Manage Handbook**: Create, edit, and publish company handbooks with sections and pages
- **Account Management**: Handle account settings, billing, and security

The application follows a **feature-based architecture** where each feature (auth, employees, contacts, handbook, account) is self-contained with its own API, hooks, components, and pages.

## 🛠 Tech Stack

- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 5.0
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui primitives
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📁 Project Structure

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

## 🏗 Architecture

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
  ├── queries.ts      # React Query keys (or query config helpers)
  ├── hooks.ts        # Data hooks wrapping API logic
  ├── components/     # Feature-specific UI components
  └── pages/          # Feature pages (list, detail, create)
```

### Import Rules

- **Feature pages** import from within their feature: `../hooks`, `../components`, `../api`, `../routes`
- **Feature components** import from their feature's API/hooks or global shared components
- **Global components** import from `@/components/ui` or `@/components/common`
- **Router** imports from `@/features/<feature>/pages` and `@/features/<feature>/routes`

### Global Shared Folders

These folders are shared across all features:

- `components/ui/` - shadcn/ui primitives (reusable UI components)
- `components/common/` - Shared non-feature components (e.g., PageHeader, SidebarCard)
- `components/layout/` - Layout components (PageShell, TopNav)
- `context/` - React context providers (currently only auth-context)
- `lib/` - Utility functions (axios-client, utils)
- `router/` - Central routing configuration
- `pages/console/` - Dashboard page (shared, not feature-specific)

## 📝 Development Guidelines

### Creating a New Feature

1. Create a new directory under `src/features/<feature-name>/`
2. Add the required files:
   - `api.ts` - API functions using `axiosClient` from `@/lib/axios-client`
   - `routes.ts` - Route constants (e.g., `export const featureRoutes = { list: '/feature' }`)
   - `queries.ts` - React Query key helpers
   - `hooks.ts` - Data hooks
   - `components/` - Feature-specific components
   - `pages/` - Feature pages

3. Update `src/router/index.tsx` to include the new routes

### Adding a New Component

- **Feature-specific component**: Add to `src/features/<feature>/components/`
- **Shared component**: Add to `src/components/common/` or `src/components/layout/`
- **UI primitive**: Add to `src/components/ui/` (if it's a reusable UI component)

### Code Style

- Use TypeScript for all files
- Follow the existing import patterns
- Use the `@/` alias for imports from `src/`
- Keep files minimal, clean, and idiomatic
- Use functional components with hooks
- Prefer named exports over default exports
- Kebab Case

## 🔌 API Integration

### Axios Client

The axios client is configured in `src/lib/axios-client.ts` and includes:
- Base URL configuration (from environment variable)
- Request interceptors (for adding auth tokens)
- Response interceptors (for error handling)

### API Functions

All API functions are located in feature modules under `api.ts`. They use the shared `axiosClient`:

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**Note**: The default backend URL is `http://localhost:3001/api` (matching the OpenAPI spec). The backend is currently read-only, so write operations (create, update, delete) will throw errors.

## 📜 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🔐 Authentication

Authentication is handled through:
- `src/context/auth-context.tsx` - Auth context provider
- `src/features/auth/` - Auth feature module
- Protected routes in `src/router/index.tsx` using `RequireAuth` component

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components for consistent UI
- Global styles in `src/index.css`
- Component-specific styles using Tailwind classes

## 📦 Dependencies

### Core
- `react` & `react-dom` - React framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `typescript` - Type safety

### UI & Styling
- `tailwindcss` - CSS framework
- `lucide-react` - Icons
- `clsx` & `tailwind-merge` - Class name utilities

### Development
- `vite` - Build tool
- `eslint` - Linting
- `@vitejs/plugin-react` - Vite React plugin

## 👥 Team

Chelle (UI/UX) rfuertes@mysigrid.com
Miguel (Dev) - mgasang@mysigrid.com