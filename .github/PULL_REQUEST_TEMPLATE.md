<!-- Thanks for contributing! Provide a short summary above. -->

## Summary

<!-- What does this change do, and why? Reference an issue if applicable. -->

## Change type

- [ ] feat — new capability
- [ ] fix — bug fix
- [ ] refactor — no behavior change
- [ ] docs — documentation only
- [ ] test — tests only
- [ ] chore — tooling, deps, CI

## Checklist

- [ ] `npm run gate` is green locally (format · lint · typecheck · test · build).
- [ ] New behavior is covered by a test (`*.test.ts` next to the module).
- [ ] No `any` in `src/`; `import type` used for type-only imports.
- [ ] Dependencies still point inward (`domain` ← `service` ← `adapter`; no
      adapter imports in `service`/`domain`).
- [ ] No secrets, `*.db`, or `dist/` staged.
- [ ] Regulatory posture preserved: `NOT_FOR_CLINICAL_USE` markers and the
      DDI-incompleteness caveat are not weakened.
- [ ] If this introduces or reverses a decision, an ADR is added/updated in
      `docs/adr/`.

## Security

If this change fixes a security vulnerability, **stop** and follow
[SECURITY.md](../SECURITY.md) instead of opening a public PR.
