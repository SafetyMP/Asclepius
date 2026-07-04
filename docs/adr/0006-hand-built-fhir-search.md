# ADR 0006 — Hand-build the FHIR search engine

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

FHIR search is specified but not implemented by any general-purpose library:
parameter types (`string`, `token`, `date`, `quantity`, `reference`, `uri`),
prefixes (`eq`, `ne`, `gt`, `ge`, `lt`, `le`, `sa`, `eb`, `ap`), modifiers
(`:exact`, `:contains`, `:missing`, `:above`, `:below`, `:text`), chained and
reverse-chained parameters, plus result operators (`_sort`, `_count`,
`_include`, `_revinclude`, `_summary`, pagination).

## Decision

Build a small **query-plan compiler**: parse a FHIR search expression into an
AST, then have each repository adapter execute that plan (in-memory evaluates
predicates; SQLite compiles to parameterized SQL).

## Reasoning (first principles)

There is no correct off-the-shelf library for FHIR search; a text-search index
(Lunr, FlexSearch) covers only the `string` type and none of the structured
operators. The honest path is to model search as: **expression → AST → plan**,
and let the adapter lower the plan to its native query mechanism. This is the
hard, interesting core of the platform and is fully testable as pure logic
(parse → plan) independent of storage.

## Better tool (honest)

At scale, real FHIR servers build dedicated **search-parameter index tables**
(HAPI) or push search into **Elasticsearch/OpenSearch**. Our compiler is a
correct, readable reference; it is not built for billion-row scale.

## Consequences

- Search parsing/plan-building is pure and unit-tested without a store.
- Adding a new search parameter type is a localized change.
- Scale work later means an adapter that lowers plans to ES queries.
