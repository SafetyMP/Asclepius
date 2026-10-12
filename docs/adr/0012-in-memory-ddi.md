# ADR 0012 — In-memory drug–drug interaction checker

- **Status:** Accepted
- **Date:** 2026-10-11

The checker and the static list already existed. This record was added because
`src/port/ddi.ts` and `src/service/ddi/knowledge-base.ts` cited ADR 0012 before
the file was in `docs/adr/`.

## Context

Medication requests need a way to surface known interactions. A teaching kit
cannot ship a licensed interaction database, and the port should not call a
network service.

## Decision

`DdiChecker` is a pure function. The caller supplies the knowledge base. The
shipped base is the six-record array in `src/service/ddi/knowledge-base.ts`.
Matching is bidirectional on sorted pair keys. There is no I/O.

That list is a sample. It is not DrugBank, First Databank, or a complete
RxNorm interaction table. A production adapter would implement the same port
against a licensed database.

## Consequences

- Alerts only exist for pairs present in that array.
- Codes follow the RxNorm strings already used by the CDS rules.
- The README regulatory disclaimer still applies: this is not for clinical use.
