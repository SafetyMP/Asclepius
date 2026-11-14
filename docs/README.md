# Asclepius documentation

**Connected care, explained.** Asclepius helps healthcare stakeholders explore
how a fictional visit or referral becomes connected FHIR records. The public
experience is a static browser demo; the local TypeScript teaching core supports
deeper development exercises. **NOT_FOR_CLINICAL_USE. Synthetic data only.**

## Choose a starting point

| Reader | Guide |
| --- | --- |
| Healthcare stakeholder | [Live demo](https://safetymp.github.io/Asclepius/) and [written care journeys](JOURNEYS.md) |
| Product or design contributor | [Project vision and priorities](PROJECT.md), then [design rationale](DESIGN-PIVOT.md) |
| Developer | [Root setup](../README.md#run-the-browser-demo-locally), [web guide](../web/README.md), and [architecture decisions](adr/README.md) |
| Contributor or coding agent | [Contributing](../CONTRIBUTING.md), [repository instructions](../AGENTS.md), and the source map below |
| Maintainer improving discovery | [Discoverability and metadata](DISCOVERABILITY.md) |

## Source map

| Path | Responsibility |
| --- | --- |
| [`web/src/lib/journeys.ts`](../web/src/lib/journeys.ts) | Journey labels, stages, owners, statuses, and record ordering |
| [`web/src/lib/examples.ts`](../web/src/lib/examples.ts) | Alex’s nine fictional routine follow-up records |
| [`web/src/lib/referral-examples.ts`](../web/src/lib/referral-examples.ts) | Maya’s nine fictional referral and handoff records |
| [`web/src/lib/record-context.ts`](../web/src/lib/record-context.ts) | Plain-language record facts and connections within a journey |
| [`web/src/components/workspace/`](../web/src/components/workspace/) | Journey switching, progress, exploration, and contextual inspection |
| [`web/src/app/`](../web/src/app/) | Static pages, validation lab, and explanatory routes |
| [`src/domain/fhir/`](../src/domain/fhir/) | Shared Zod schemas and inferred types; limited FHIR R4 subset |
| [`src/service/`](../src/service/) | Validation, search, rules, and intentionally incomplete DDI examples |
| [`src/port/`](../src/port/) and [`src/adapter/`](../src/adapter/) | Local reference interfaces and HTTP, storage, auth, and audit implementations |
| [`src/app.ts`](../src/app.ts) | Local API composition root; not the public demo’s runtime |
| [`tests/`](../tests/) | Synthetic fixtures and core integration tests; unit tests also live beside source |
| [`web/tests/e2e/`](../web/tests/e2e/) | Browser journey, record, validation, accessibility, and export checks |
| [`.github/workflows/`](../.github/workflows/) | CI, security analysis, and GitHub Pages deployment |
| [`docs/adr/`](adr/README.md) | Dated architecture decisions with current-scope notes |
| [`docs/assets/`](assets/README.md) | Current screenshots and preserved historical console captures |

Start with the smallest relevant source set. For a journey change, read its
metadata and records before changing UI behavior; for schema behavior, read the
shared domain schema and validator before editing a browser form.

## Current and historical material

[Project vision](PROJECT.md) describes the current scope. [Design pivot](DESIGN-PIVOT.md)
explains the transition from the original platform framing through the teaching
kit to the stakeholder experience. Earlier ADRs retain their dated reasoning;
their platform or production comparisons do not expand today’s synthetic-only
scope. [ADR 0013](adr/0013-browser-teaching-demo.md) records the browser redesign.

Screenshots demonstrate rendered UI, tests demonstrate their checked behaviors,
and a successful Pages deployment demonstrates publication. None establishes
clinical validity, full FHIR conformance, or improved customer engagement.

## Community and reporting

Canonical community files live at the repository root:
[CONTRIBUTING.md](../CONTRIBUTING.md), [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md),
and [SECURITY.md](../SECURITY.md). Report vulnerabilities through the security
policy, not public issues. Never include real patient data in reports or examples.
