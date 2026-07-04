# ADR 0004 — Storage: repository port + in-memory and SQLite adapters

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

Storage must support CRUD, FHIR **versioning** (each update creates a new
version; history is queryable), and structured search — while remaining
swappable so the same code runs in tests and in a real deployment.

## Decision

Define a `ResourceRepository` port; implement it twice:

1. **In-memory** (`adapter/storage/memory`) — zero-dependency, default, used by
   tests and `npm run dev`.
2. **SQLite** (`adapter/storage/sqlite`, `better-sqlite3`) — real ACID
   persistence in a single file, JSON-column storage.

## Reasoning (first principles)

FHIR's versioning + history requirements mean a store isn't just a key-value
map — each `(resourceType, id)` has a version chain. Both adapters must honor
that contract. The port captures the contract; two adapters prove the seam is
real (not theater) and let the platform run anywhere from a laptop to a server
without code changes. SQLite gives genuine ACID + SQL query power with zero
ops; in-memory gives speed + hermetic tests.

## Better tool (honest)

At **production scale**, use **Postgres with `JSONB` columns + GIN indexes** for
the combination of relational integrity and JSON document querying, or a
**dedicated FHIR store**. **MongoDB** is also a strong document-native fit.
SQLite is the best _reference_ choice for zero-config portability.

## Consequences

- Search is expressed against the port; SQLite compiles it to SQL, in-memory
  evaluates it as predicates (see ADR 0006).
- Migrating to Postgres later means a third adapter, not a rewrite.
