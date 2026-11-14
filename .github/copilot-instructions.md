# Copilot and community agents

Read [AGENTS.md](../AGENTS.md) for the repository contract and task-specific
reading map. Asclepius explains connected care through two synthetic journeys
for healthcare stakeholders, with a separate local TypeScript FHIR teaching
core. The browser demo is static, requires no account or API, and uses shared
validation. Preserve its calm style and plain-language context.

## Product and safety

- Preserve `NOT_FOR_CLINICAL_USE`, synthetic-only data, and the incomplete DDI
  warning. Never imply clinical fitness or full FHIR conformance.
- Do not connect to real EHRs, pharmacies, or clinical systems.
- Keep journey records isolated by full `ResourceType/id` and preserve progress
  when switching. A completed coordination task is not a completed receiving visit.
- Keep technical details optional and navigation keyboard-accessible.

## Implementation

Follow [path-specific instructions](instructions/) and the
[FHIR architecture skill](skills/fhir-ports-adapters/SKILL.md) when relevant.
Dependencies point inward; never import adapters into services or domain code.
Wire local API adapters in `src/app.ts`. Define FHIR schemas with Zod and infer
TypeScript types instead of maintaining parallel models.

## Verification

Run `npm run gate` or `./scripts/verify.sh` for the core. For web changes also run
`npm run verify --prefix web` and the full browser suite described in
[web/README.md](../web/README.md). Report actual output and checks not run. Local
success, CI success, publication, and live verification are distinct evidence.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for setup and
[the review skill](skills/code-review/SKILL.md) for review checks.
