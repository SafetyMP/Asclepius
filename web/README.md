# Asclepius — Web UI

FHIR reference console. **NOT FOR CLINICAL USE.**

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 with three-layer design tokens
- BFF proxy: `/api/*` → FHIR server (`ASCLEPIUS_API_URL`, default `http://127.0.0.1:8787`)

## Commands

```bash
cd web
npm install
npm run dev          # http://localhost:3200
npm run verify       # typecheck + build + @smoke Playwright + axe-core
```

Start the API from repo root: `npm run dev` (port 8787). Issue a dev token at `/auth` before protected routes.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Overview |
| `/patients` | Patient search/read |
| `/interactions` | MedicationRequest `$check-interactions` |
| `/cds` | CDS Hooks-style invocation |
| `/validate` | `$validate` operation |
| `/auth` | Dev token issuer |
