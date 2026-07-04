# ADR 0010 — Max-strict TypeScript

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

FHIR optionality is clinically meaningful: a missing `birthDate`, a present-but-
null vs absent field, an array index — each can change a clinical decision. We
must choose how much the compiler enforces.

## Decision

Enable the full strict family: `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, and
`verbatimModuleSyntax`.

## Reasoning (first principles)

Each flag closes a class of bug the type system can prove:

- `noUncheckedIndexedAccess` — array/object access returns `T | undefined`,
  forcing an explicit check. FHIR data is full of optional/array elements;
  assuming they're present is a real source of crashes.
- `exactOptionalPropertyTypes` — distinguishes `{ x?: T }` (may be absent) from
  `{ x: T | undefined }` (present but null). For a domain where presence
  itself carries meaning, this is correctness, not pedantry.
- `verbatimModuleSyntax` — forces `import type`, keeping isolated transpilation
  (required by esbuild/tsup) sound.

## Trade-off

Higher upfront effort: more careful code, explicit `undefined` handling, no
`!` escape hatches. Worth it here because the cost of a shape bug is a wrong
clinical-data operation, not a cosmetic glitch.

## Consequences

- More compiler friction; code is more verbose at boundaries.
- Tests and fixtures must satisfy the same rules.
- Drift between "what we think the data is" and "what it is" shrinks.
