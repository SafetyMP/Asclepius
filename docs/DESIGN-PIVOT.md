# Design pivot — a contextual teaching experience

> **NOT_FOR_CLINICAL_USE — NOT FOR CLINICAL USE.** Do not store, process, or base
> clinical decisions on real patient data. The DDI knowledge base is
> intentionally incomplete. Never connect this software to a real EHR,
> pharmacy, or clinical system.

## Historical pivot: September 2026

Asclepius was originally presented as a FHIR-native clinical data platform. The
September pivot narrowed that positioning to a typed FHIR R4 teaching kit:
hand-authored Zod schemas, inferred types, ports and adapters, and testable local
examples. It deliberately stopped presenting this subset as a production FHIR
server or a place for PHI.

At that point the pivot was documentation-only. A future slice proposed
removing the clinical-workstation presentation from `web/`. The UI still led
with patient search, interactions, CDS, and token setup, even though the stated
product was educational. That historical mismatch motivates this redesign.

## Current redesign: November 2026

The user selected **healthcare stakeholders exploring synthetic workflows** as
the primary audience and **a calm, polished developer workspace** as the visual
direction. The new entry point is a fictional care journey with contextual,
linked FHIR records. Validation remains available as a deeper learning tool.

This is a change to the educational interface, not a return to the clinical
platform claim. The backend remains a local teaching harness.

| Before | Implemented direction |
| --- | --- |
| Equal-weight clinical-console tool grid | Synthetic case as the primary entry point |
| Server and token setup before interaction | Static browser demo with no account or API requirement |
| Raw payloads without much context | Case context, resource explanations, and inspectable JSON |
| Single validation sample and raw outcome | Two journeys of nine examples each, field-level feedback, reset, and a repair exercise |
| Clinical endpoint controls in the public UI | Source-linked explanations of local auth, CDS, and DDI examples |
| Local-only web console | Static export prepared for GitHub Pages at `/Asclepius` |

The hypothesis is that a recognizable story makes resource relationships easier
to understand and that a working first interaction reduces setup friction.
No engagement study or customer usability test has established those outcomes.
Visual review and automated checks cover the implemented experience, not
customer preference or clinical validity.

## Preserve the teaching core

- Zod schemas remain the source of truth for the supported types
  ([ADR 0002](adr/0002-zod-single-source-of-truth.md)).
- Dependencies remain inward-facing; the local backend’s composition root stays
  in `src/app.ts` ([ADR 0003](adr/0003-ports-and-adapters.md)).
- The browser validation lab reuses the core validation service and rules,
  rather than introducing a separate approximate validator.
- Local storage, API, search, rule examples, authentication, and audit remain
  available for synthetic development exercises.
- Passing validation means passing this teaching subset. It does not establish
  full FHIR conformance, terminology validity, reference existence, clinical
  correctness, or a treatment’s safety.

## Acceptance and evidence limits

The implementation is checked for an immediately usable synthetic journey,
resource exploration, validation and repair feedback, keyboard/mobile use,
accessibility, and static route behavior at the Pages base path. The repository
root gate protects the retained teaching kit. Exact test results and deployment
status belong to the observed run; this design document is not a pass receipt.

The [Pages workflow](../.github/workflows/pages.yml) describes the deployment
path. Publication is confirmed separately by a successful deployment and a
reachable site; preparing the export alone does not establish either.

## Non-negotiables

- Preserve `NOT_FOR_CLINICAL_USE` and synthetic-only context.
- Do not imply that the DDI knowledge base is comprehensive. A missing match is
  not a safety judgment.
- Do not connect to real clinical systems, pharmacies, or EHRs.
- Do not present this teaching subset as a production FHIR platform.
- Preserve the [repository conventions](../AGENTS.md) and existing stack.

## Referral and handoff extension

The second journey follows Maya Chen from Willow’s referring team to Cedar’s
receiving team. Its nine synthetic records include a ServiceRequest, a Task, and
distinct referring/receiving practitioners, organizations, and encounters. Record
identity uses resource type plus ID; references resolve within the chosen journey.

The request is active, coordination is completed, and the receiving visit is
planned. Stage navigation presents a fixed snapshot, not a live referral process.
Both journeys retain independent navigation context. The validation lab shares
the core’s eleven limited schemas; new Task values support references and strings.

Acceptance covers isolated record graphs, duplicate-type navigation, all samples
passing the shared validator, correct lab reload/return context, independent
journey progress, and desktop/mobile accessibility at the Pages subpath.
