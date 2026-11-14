---
applyTo: "**/*.{test,spec}.ts,**/*.{test,spec}.tsx,**/tests/**/*.ts,**/tests/**/*.tsx"
---

# Test standards

- Cover changed behavior with meaningful regressions in the existing layout.
  Root unit tests are co-located; integration tests use `tests/integration/`.
- Shared FHIR JSON fixtures live in `tests/fixtures/`. Use fictional data only;
  never commit real personal or patient information or credentials.
- Browser tests use `web/tests/e2e/`. Preserve coverage for journey isolation,
  full record identities, referral ownership and status, keyboard interactions,
  accessible names, responsive layout, and GitHub Pages subpath routing.
- The public demo must not require local API requests. Browser validation uses
  the same teaching schemas as the core, with explicit limits on its claims.
- Do not skip or weaken format, lint, typecheck, or test gates to land a change.
- Report actual command results. Run the root gate and, for web changes, web
  verification as documented in `AGENTS.md` and `web/README.md`.
- Automated checks do not demonstrate clinical validity or measured usability.
