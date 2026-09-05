---
name: fhir-ports-adapters
description: "Apply Asclepius ports-and-adapters and zod-as-FHIR-source-of-truth rules. Use when adding FHIR types, adapters, or DDI behavior. Never imply clinical completeness or connect to real EHRs."
---

# FHIR ports and adapters

Asclepius is a typed FHIR R4 teaching kit. **NOT FOR CLINICAL USE.** Do not
imply clinical completeness or connect to real EHRs.

## Architecture

- **Dependencies point inward.** `domain` depends on nothing. `service` depends
  on `domain` + `port`. `adapter` depends on `port` + `domain`. Never import
  from an adapter inside `service` or `domain`.
- **`src/app.ts` is the only composition root.** Wire adapters there. Do not
  construct adapters inside services.
- **Ports live in `src/port/`.** A new external dependency (DB, IdP, message
  bus) gets a port interface first; adapters implement it.
- **zod is the single source of truth for FHIR types.** Author a schema, derive
  the TS type with `z.infer`. Do not hand-write a parallel interface that can
  drift from the validator.

## DDI and safety

- The DDI knowledge base is incomplete by design. Never imply it is
  comprehensive.
- Never remove or soften the `NOT_FOR_CLINICAL_USE` marker.
- Never add code that connects to real clinical systems, pharmacies, or EHRs.

## Verify

A change is not done until `./scripts/verify.sh` or `npm run gate` is green.
Prefer validate and ports tests as the product — not `web/` clinical chrome.

See [AGENTS.md](../../../AGENTS.md), [ADR 0002](../../../docs/adr/0002-zod-single-source-of-truth.md),
and [ADR 0003](../../../docs/adr/0003-ports-and-adapters.md).
