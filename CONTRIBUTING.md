# Contributing to Asclepius

Thanks for your interest in improving Asclepius — a reference implementation of a
FHIR-native clinical data platform. This document explains how to set up the
project and what's expected of a contribution.

## Regulatory posture (read first)

Asclepius is a **reference / educational implementation**, **not** certified and
**not** for real patient data. Contributions must not:

- Soften or remove the `NOT_FOR_CLINICAL_USE` markers or disclaimers.
- Imply the DDI knowledge base is comprehensive.
- Add code that connects to real clinical systems, pharmacies, or EHRs.

## Prerequisites

- **Node.js ≥ 22** (see `.nvmrc` for the dev version; the CI matrix covers 22 and 24).
- A C++ toolchain (for `better-sqlite3`'s native build) — present by default on
  macOS/Linux dev machines and GitHub runners.

## Setup

```bash
npm install
npm run gate   # format:check → lint → typecheck → test → build
```

A contribution is not finished until `npm run gate` is green locally. CI runs the
same gate on every pull request.

## Architecture rules (must respect)

- **Dependencies point inward.** `domain` depends on nothing. `service` depends
  on `domain` + `port`. `adapter` depends on `port` + `domain`. Never import
  from an adapter inside `service` or `domain`.
- **`src/app.ts` is the only composition root.** Adapters are wired there.
- **Ports first.** A new external dependency (DB, IdP, message bus) gets a port
  interface in `src/port/` before any adapter implements it.
- **zod is the single source of truth for FHIR types.** Author a schema, derive
  the TS type with `z.infer`. Do not hand-write a parallel interface.

## TypeScript (max-strict)

The project runs with `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, and `verbatimModuleSyntax`:

- Use `import type` / `export type` for type-only imports.
- When `noUncheckedIndexedAccess` flags an index access, handle the `undefined`
  case explicitly — do not silence it with `!`.
- No `any` in `src/` (tests may use it); reach for `unknown` + narrowing.

## Testing

- Unit tests are **co-located** (`*.test.ts` next to the module).
- Integration tests live in `tests/integration/`.
- Every new behavior ships with a test.
- FHIR fixtures go in `tests/fixtures/` as JSON.

## Decisions

Non-trivial architectural decisions are recorded as ADRs in
[`docs/adr/`](docs/adr/) (see the README there for the format). If your change
introduces or reverses a decision, add or update an ADR.

## Commits & pull requests

- Conventional-commit-ish titles: `feat(search): warfarin bleeding-risk rule`.
- Small, reviewable diffs — one logical change per commit.
- Never commit secrets, `*.db` files, or `dist/`.
- Open a pull request against `main`; CI must pass before merge.

By contributing, you agree that your contributions are licensed under the
[Apache-2.0 License](LICENSE).
