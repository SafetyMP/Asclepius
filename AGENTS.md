# AGENTS.md — Asclepius repo conventions

These conventions apply to all work in this repository (human or agent) and
layer on top of the global `~/.config/opencode/AGENTS.md`.

## Regulatory posture (non-negotiable)

- Asclepius is a **reference implementation**, NOT certified and NOT for real
  patient data. Never remove or soften the `NOT_FOR_CLINICAL_USE` marker.
- The DDI knowledge base is intentionally incomplete. Never imply it is
  comprehensive — incomplete interaction data is a patient-safety hazard.
- Do not add code that connects to real clinical systems, real pharmacies, or
  real EHRs without an explicit instruction.

## Architecture rules

- **Dependencies point inward.** `domain` depends on nothing. `service` depends
  on `domain` + `port`. `adapter` depends on `port` + `domain`. Never import
  from an adapter inside `service` or `domain`.
- **`src/app.ts` is the only composition root.** All adapter wiring happens
  there. Do not construct adapters inside services.
- **Ports live in `src/port/`.** A new external dependency (DB, IdP, message
  bus) gets a port interface first; adapters implement it.
- **zod is the single source of truth for FHIR types.** Author a schema, derive
  the TS type with `z.infer`. Do not hand-write a parallel interface that can
  drift from the validator.

## TypeScript rules (max-strict)

- The project runs with `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`.
- Use `import type` / `export type` for type-only imports (enforced).
- When `noUncheckedIndexedAccess` flags an index access, handle the
  `undefined` case explicitly — do not silence it with `!`.
- No `any` in `src/` (tests may use it). Reach for `unknown` + narrowing.

## Testing rules

- Unit tests are **co-located** (`*.test.ts` next to the module).
- Integration tests live in `tests/integration/`.
- Every new behavior ships with a test. `npm run gate` must be green.
- FHIR fixtures go in `tests/fixtures/` as JSON.

## Verification

- A change is not done until `npm run gate` (format → lint → typecheck → test →
  build) is green. Run `gate_run` from the harness to confirm.
- Do not claim green without observed output.

## Commit / PR style

- Conventional-commit-ish: `feat(cds): warfarin bleeding-risk rule`.
- Small, reviewable diffs. One logical change per commit.
- Never commit secrets, `*.db` files, or `dist/`.
