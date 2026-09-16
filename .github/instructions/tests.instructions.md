---
applyTo: "**/*.{test,spec}.ts,**/*.{test,spec}.tsx,**/tests/**/*.ts,**/tests/**/*.tsx"
---

# Test standards (September 2026)

- Ship behavior with a test in the existing layout (co-located `*.test.ts` or `tests/`).
- Do not skip, delete, or weaken verify, lint, typecheck, or adversarial gates to land a change.
- Do not invent a passing gate from prose. Run the documented verify command.
- Fixtures are synthetic. Never commit real PII, PHI, payroll, or credentials.

## This repository

- Unit tests are co-located (`*.test.ts`). Integration tests live in `tests/integration/`.
- FHIR fixtures go in `tests/fixtures/` as JSON. Synthetic only.
- Done means `./scripts/verify.sh` or `npm run gate` is green.
