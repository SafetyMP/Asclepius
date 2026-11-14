# ADR 0003 — Ports & adapters (hexagonal) internal layout

- **Status:** Accepted
- **Date:** 2026-07-03

> **Current scope (November 2026):** This dated decision describes the local
> synthetic teaching core. Its original platform framing and production
> comparisons are historical rationale, not current deployment guidance or
> claims of clinical capability. The stakeholder-facing browser demo is defined
> in [ADR 0013](0013-browser-teaching-demo.md); [project scope](../PROJECT.md)
> governs current work. **NOT_FOR_CLINICAL_USE.**

## Context

The platform has many swappable concerns: storage (memory ↔ SQLite ↔ Postgres),
identity, audit sink, even the HTTP framework. If application logic depends
directly on concrete adapters, every swap is a surgery.

## Decision

Organize the codebase into concentric layers with **inward-only** dependencies:

```
domain/   — pure FHIR model + value objects (depends on nothing)
port/     — interfaces describing what the app needs (repositories, etc.)
service/  — application logic (search, validation, cds, ddi); depends on domain + port
adapter/  — implementations: storage (memory, sqlite), http, auth, audit
app.ts    — the ONLY composition root; wires ports to adapters
```

## Reasoning (first principles)

A dependency that doesn't exist can't couple. If every subsystem programs
against a **port** (an interface it defines), then swapping the adapter that
satisfies that port is a one-line change at the composition root — not a
search-and-replace through business logic. This also makes every subsystem
unit-testable with a fake/in-memory port.

## Consequences

- One more level of indirection (a port interface per concern).
- The dependency graph is fully visible in `app.ts`.
- Tests can substitute any adapter without touching domain/service code.
