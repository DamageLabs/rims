# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RIMS (React Inventory Management System) is a full-stack inventory management system with a React frontend and Express/better-sqlite3 backend. Supports multiple inventory types (Electronics, Firearms, Ammunition) with per-type custom field schemas.

## Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start both frontend (Vite :5173) and backend (Express :3001)
npm run dev:client   # Start frontend only
npm run dev:server   # Start backend only
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test:run     # Run tests
```

## Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript, Vite, React Bootstrap, React Router v6
- **Backend**: Express with TypeScript (tsx), better-sqlite3
- **Data Storage**: SQLite file at `data/rims.db` (server-side)
- **API**: REST API at `/api/*`, proxied from Vite dev server

### Directory Structure
```
src/                          # Frontend
├── components/
│   ├── auth/                 # Login, Register, EditProfile, ProtectedRoute
│   ├── common/               # AlertDisplay, Pagination, ConfirmModal
│   ├── items/                # ItemList, ItemDetail, ItemForm, etc.
│   ├── bom/                  # BOM management
│   ├── reports/              # Dashboard, ValuationReport, MovementReport
│   ├── settings/             # CategoryManager, InventoryTypeManager
│   ├── layout/               # Header, Footer, Layout
│   └── users/                # UserList, UserDetail
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── AlertContext.tsx       # Flash messages
├── services/
│   ├── api.ts                # Fetch wrapper for backend API
│   ├── authService.ts        # Auth (login/register/profile via API)
│   ├── itemService.ts        # Item CRUD (async API calls)
│   ├── inventoryTypeService.ts
│   ├── categoryService.ts
│   ├── stockHistoryService.ts
│   ├── costHistoryService.ts
│   ├── bomService.ts
│   ├── userService.ts
│   ├── itemTemplateService.ts
│   ├── vendorService.ts      # Mock vendor price lookups
│   └── storage.ts            # localStorage (session only)
├── types/                    # TypeScript type definitions
server/                       # Backend
├── index.ts                  # Express app, route registration, seed
├── db/
│   ├── index.ts              # Database connection, generic query helpers
│   ├── schema.ts             # CREATE TABLE SQL
│   ├── mapper.ts             # snake_case ↔ camelCase + JSON field handling
│   └── seed.ts               # Seed data (users, types, categories, items)
├── routes/
│   ├── auth.ts               # /api/auth/* (login, register, verify, profile)
│   ├── items.ts              # /api/items/*
│   ├── inventoryTypes.ts     # /api/inventory-types/*
│   ├── categories.ts         # /api/categories/*
│   ├── stockHistory.ts       # /api/stock-history/*
│   ├── costHistory.ts        # /api/cost-history/*
│   ├── templates.ts          # /api/templates/*
│   ├── boms.ts               # /api/boms/*
│   └── users.ts              # /api/users/*
└── services/
    └── emailService.ts       # Email verification
```

### Key Patterns
- All frontend services are **async** — they call the backend REST API
- Server uses **generic query helpers** (queryAll, queryOne, insert, update, deleteById)
- **snake_case ↔ camelCase** mapping happens automatically in the DB layer
- **JSON fields** (customFields, schema, items, defaultFields) are serialized/deserialized automatically
- **Inventory types** define per-type field schemas (FieldDefinition[])
- Items have `customFields: Record<string, unknown>` for type-specific data

### Default Credentials
- Admin: admin@example.com / changeme
- User: user@example.com / changeme

### Data Models

**Item**: id, name, description, quantity, unitValue, value, picture, category, location, barcode, reorderPoint, inventoryTypeId, customFields, timestamps

**InventoryType**: id, name, icon, schema (FieldDefinition[]), timestamps

**Category**: id, name, sortOrder, inventoryTypeId, timestamps

## Contributing

- Sign the CLA before contributing
- Branch naming: `rims-[issue-num]`
- Use `Fixes #123` in commit messages to auto-close issues
