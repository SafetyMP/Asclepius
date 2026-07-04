# Architecture Decision Records

An ADR captures **one** architectural decision: its context, the choice, and the
consequences. Each was reasoned from first principles (not analogy) and includes
an honest "better tool for production" callout.

| #                                          | Decision                                                                              | Status   |
| ------------------------------------------ | ------------------------------------------------------------------------------------- | -------- |
| [0001](0001-language-and-runtime.md)       | Use TypeScript on Node, not Java/.NET                                                 | Accepted |
| [0010](0010-max-strict-typescript.md)      | Enable max-strict TS (incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) | Accepted |
| [0002](0002-zod-single-source-of-truth.md) | zod as single source of truth for FHIR types                                          | Accepted |
| [0003](0003-ports-and-adapters.md)         | Hexagonal (ports & adapters) internal layout                                          | Accepted |
| [0004](0004-storage-sqlite-and-memory.md)  | Repository port + in-memory and SQLite adapters                                       | Accepted |
| [0005](0005-hono-http.md)                  | Hono for the REST API                                                                 | Accepted |
| [0006](0006-hand-built-fhir-search.md)     | Hand-build the FHIR search engine                                                     | Accepted |
| [0007](0007-cds-rule-dsl.md)               | A focused CDS rule DSL instead of CQL                                                 | Accepted |
| [0008](0008-jwt-and-smart-scopes.md)       | JWT + RBAC + SMART-style scopes                                                       | Accepted |
| [0009](0009-hash-chained-audit.md)         | Hash-chained append-only audit log                                                    | Accepted |

Future decisions (storage indexing, transactions, bundle handling) land here as
they're made.
