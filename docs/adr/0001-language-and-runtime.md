# ADR 0001 — Language and runtime: TypeScript on Node

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

A FHIR-native platform's core job is to model, store, query, and validate JSON
resources that are **recursive, polymorphic, and structural** (e.g. a
`Bundle.entry[].resource` can be any of ~150 resource types). We need a
language whose type system can express that shape and verify it at compile time,
plus mature async I/O for HTTP + storage and a strong test ecosystem.

## Decision

Use **TypeScript on Node.js** (ESM, Node 20+).

## Reasoning (first principles)

The hardest, most error-prone work here is keeping the resource model correct.
A structural type system maps directly to FHIR's JSON shapes; discriminated
unions model polymorphic resources (`resourceType` discriminates); the compiler
catches shape errors for free. Node's async story is mature for HTTP + a
database driver.

## Better tool (honest)

For a **regulated deployment**, the domain-leading FHIR implementations are
**Java (HAPI FHIR)** and **.NET (Firely)** — battle-tested conformance and
tooling. For **ML-heavy clinical inference**, **Python** would be a better
complement (and could be added as a microservice). TypeScript is chosen for
verifiability and iteration speed in a reference build, not for production
conformance.

## Consequences

- We get compile-time shape safety and fast iteration.
- We must author a FHIR type subset ourselves (no full R4 coverage out of the
  box) — see ADR 0002.
- Interop with CQL/clinical tooling (mostly Java) will need an adapter.
