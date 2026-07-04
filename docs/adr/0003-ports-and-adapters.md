# ADR 0003 — Ports & adapters (hexagonal) internal layout

- **Status:** Accepted
- **Date:** 2026-07-03

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
