# Design pivot — typed FHIR R4 teaching kit

> ⚠️ **NOT FOR CLINICAL USE.** Asclepius is not a server for PHI. Do not store,
> process, or base clinical decisions on real patient data. The DDI knowledge
> base is incomplete by design. Never connect this software to a real EHR,
> pharmacy, or clinical system.

## What we are stopping

Asclepius was presented as a **FHIR-native clinical data platform** — a
from-scratch stand-in for the pillars of a production clinical stack (storage,
search, CDS, DDI, SMART scopes, audit, a clinical console).

That framing is crowded and misleading. Medplum, HAPI FHIR, and IBM FHIR already
are production FHIR servers. Calling this repo a platform invites PHI, implied
completeness, and comparisons we will lose on features.

## What we are becoming

A **typed FHIR R4 teaching kit**: architecture you can read in one sitting.

| This kit | Production FHIR (Medplum, HAPI, IBM FHIR) |
| -------- | ----------------------------------------- |
| zod schemas are the source of truth; TypeScript types are `z.infer` | Full R4/R5 conformance, profiling, terminology |
| Ports and adapters; `src/app.ts` is the only composition root | Operable multi-tenant servers and managed cloud |
| DDI knowledge base is **incomplete by design** | Clinical knowledge you must not invent here |
| Validate + port tests are the product | Persistence of real patient data |
| Readable subset of resources | A server for PHI |

Use **Medplum** when you need a production TypeScript FHIR platform. Use
**HAPI FHIR** or **IBM FHIR** when you need a Java FHIR server you can certify
and operate. Use **this repo** when you want to see hexagonal adapters, a
hand-authored resource model, and `$validate` tests without an EHR.

## Non-negotiables

- Never soften or remove `NOT_FOR_CLINICAL_USE`.
- Never imply the DDI table is comprehensive — missing interactions are a
  patient-safety hazard.
- Never add adapters that talk to real EHRs, pharmacies, or clinical networks.
- Community contract: [`AGENTS.md`](../AGENTS.md). Do not wrap this repo in a
  factory overlay.

## Product surface (now vs next)

**Keep as the product**

- Hand-authored zod FHIR R4 subset and inferred types ([ADR 0002](adr/0002-zod-single-source-of-truth.md)).
- Inward-only ports and adapters; composition root in `src/app.ts`
  ([ADR 0003](adr/0003-ports-and-adapters.md)).
- `$validate`, repository contract tests, and search/DDI/CDS unit tests.
- Honest ADRs with a “better tool for production” callout.

**Next slice (not this change)**

- Shrink `web/` clinical chrome (patient census, CDS theater, interaction
  console as a fake product).
- Keep a thin local UI only where it demonstrates validate/ports — or drop
  chrome that implies a clinical workstation.
- Leave the API as a local teaching harness, not a deployment target for PHI.

This document is positioning only. No application code moves in the September
2026 community revamp.
