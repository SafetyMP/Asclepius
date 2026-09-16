# Copilot / community agents

Asclepius is a **typed FHIR R4 teaching kit**, not a clinical data platform
and **not** a server for PHI. Keep [`AGENTS.md`](../AGENTS.md) as the community
contract — do not wrap this repo in a factory overlay.

Ports, adapters, and FHIR types: [`.github/skills/fhir-ports-adapters`](skills/fhir-ports-adapters).
Positioning: [`docs/DESIGN-PIVOT.md`](../docs/DESIGN-PIVOT.md).

## Verify

- `./scripts/verify.sh` (preferred — `npm ci` + gate)
- `npm run gate` (format → lint → typecheck → test → build)

Do not claim green without observed command output.

## Never

- Never remove or soften `NOT_FOR_CLINICAL_USE`.
- Never imply the DDI knowledge base is complete.
- Never connect to real EHRs, pharmacies, or clinical systems.
- Never store, process, or demo with real patient data (synthetic fixtures only).
- Never import an adapter from `service` or `domain`.
- Never construct adapters outside `src/app.ts`.
- Never hand-write a FHIR TypeScript interface that can drift from its zod schema.

## Coding standards

Follow path-specific files in [`.github/instructions/`](instructions/). Copilot code review loads [`.github/skills/code-review/`](skills/code-review/).
