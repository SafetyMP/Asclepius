# ADR 0005 — HTTP framework: Hono

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

FHIR is a REST/JSON spec. We need path/query parsing, content negotiation,
fast routing, and types that flow from request to handler to response.

## Decision

Use **Hono** with `@hono/node-server`.

## Reasoning (first principles)

Hono is built on the **web-standard** `Request`/`Response` types. That means
handlers are portable across Node/Bun/Deno/edge, and — critically — the types
of the request body, params, and query flow into the handler rather than
arriving as untyped strings. It is also among the fastest frameworks and has a
tiny dependency footprint.

## Better tool (honest)

**Fastify** is equally valid with a larger plugin ecosystem and first-class
schema/OpenAPI generation; if we needed auto-generated OpenAPI or heavy
middleware we'd reconsider. **Express** is ubiquitous but slower and older; we
avoid it for new work.

## Consequences

- Handlers use web-standard types; portable and type-safe.
- One runtime dependency for the whole HTTP layer.
