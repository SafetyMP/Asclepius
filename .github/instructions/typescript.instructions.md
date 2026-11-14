---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript coding standards

- Write TypeScript, not new application JavaScript. Leave existing tooling `.js` / `.mjs` / `.cjs` files alone.
- Place imports at the top of the module. Do not use inline `import()` in function bodies except for a documented circular-dependency or optional-runtime case.
- Prefer early returns over nested conditionals.
- On `switch` over a discriminated union or enum, handle every variant. Use a `never` check in `default` so newly added variants fail at compile time.
- Do not introduce `any` in new production code. Prefer `unknown` plus narrowing. Do not use non-null assertions to silence `strict` or `noUncheckedIndexedAccess`.
- Match this repository's existing formatter and linter. Do not add a second style system.
- Keep public unions narrow. Do not widen a literal union to `string` without a spec change.
- Do not weaken validation, authentication, or verification gates to make types compile.

## This repository

- Preserve each package's compiler settings. The root core uses `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`.
- Use `import type` / `export type` for type-only imports.
- zod is the source of truth for FHIR types. Derive TS with `z.infer`. Do not hand-write a parallel interface.
- Dependencies point inward. Never import an adapter from `service` or `domain`.
- `src/app.ts` is the local API composition root. Do not construct adapters inside services.
- Keep `web/` static and independent of local API availability. Reuse the core validator.
- Preserve complete `ResourceType/id` identities and resolve references within the selected journey.
- Never soften `NOT_FOR_CLINICAL_USE` or connect to real EHRs.
