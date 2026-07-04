# Asclepius — FHIR-native Clinical Data Platform

> ⚠️ **NOT FOR CLINICAL USE.** Asclepius is a **reference implementation** that
> demonstrates the architecture of a FHIR-native clinical data platform. It is
> **not** HIPAA-certified, **not** a regulated medical device, and its
> drug-interaction knowledge base is intentionally **incomplete**. Do **not**
> store, process, or base clinical decisions on real patient data with this
> software.

## What this is

A from-scratch, layered implementation of the pillars of a clinical data
platform, built to be **correct and testable** rather than feature-complete:

| Pillar                    | Implementation                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| FHIR R4 resource model    | Hand-authored, strongly-typed schemas (zod as single source of truth → inferred TS types)                                            |
| Storage                   | Repository **port** + two adapters: in-memory (default, tests) and SQLite (`better-sqlite3`)                                         |
| FHIR search               | Hand-built query-plan compiler: param types (`string`/`token`/`date`/`quantity`/`reference`), modifiers, `_sort`, `_count`, chaining |
| REST API                  | Hono, web-standard `Request`/`Response`, full CRUD + history + versioning + transactions                                             |
| Validation                | zod runtime validation against authored FHIR profiles                                                                                |
| Clinical Decision Support | Composable rule DSL evaluating a patient context → CDS Hooks "cards"                                                                 |
| Drug–drug interactions    | Structured JSON knowledge base + graph-aware checker (severity + mechanism)                                                          |
| AuthN/AuthZ               | JWT + RBAC + SMART-style scopes (`patient/Observation.read`, `user/*.read`)                                                          |
| Audit                     | Hash-chained, append-only, tamper-evident log                                                                                        |

## Architecture (ports & adapters)

```
        ┌─────────────────────── HTTP / CLI (entry) ────────────────────────┐
        │  adapter/http · adapter/auth · adapter/audit                       │
        └───────────────────────────────┼───────────────────────────────────┘
                                        │ depends on ports only
        ┌───────────────────────────────▼───────────────────────────────────┐
        │  service: search · validation · cds · ddi   (application logic)    │
        └───────────────────────────────┼───────────────────────────────────┘
                                        │ depends on domain only
        ┌───────────────────────────────▼───────────────────────────────────┐
        │  domain: fhir resources · value objects · OperationOutcome         │
        └───────────────────────────────┬───────────────────────────────────┘
                                        │ port interfaces
        ┌───────────────────────────────▼───────────────────────────────────┐
        │  adapter/storage: in-memory · sqlite   (port implementations)      │
        └───────────────────────────────────────────────────────────────────┘
```

Dependencies point **inward**: domain depends on nothing; adapters depend on
ports + domain; `src/app.ts` is the single composition root that wires it all.

## Getting started

```bash
npm install              # dependencies
npm run dev              # run via tsx (no compile step), hot reload
npm test                 # run the suite
npm run gate             # format:check → lint → typecheck → test → build
```

## Why these tools (and where there's a better one)

Every component choice is documented with its first-principles rationale and an
honest "better tool for production" callout in `docs/adr/`. Summary:

- **TypeScript** — models FHIR's structural types; compiler verifies shape.
  _Production FHIR servers: Java (HAPI) or .NET (Firely)._
- **zod** — single source of truth for types + runtime validation.
  _Full FHIR profiling: Firely validator._
- **SQLite / in-memory** — zero-config real persistence + fast tests.
  _Scale: Postgres + JSONB/GIN._
- **Hono** — web-standard, portable, fast.
  _Larger ecosystem: Fastify._
- **Hand-built search** — the hard core; no library does FHIR search correctly.
  _Scale: Elasticsearch._
- **CDS rule DSL** — testable pure functions.
  _Production: CQL (Clinical Quality Language)._
- **JWT + scopes** — models FHIR's resource/action access.
  _Production: full SMART-on-FHIR OAuth2 via a real IdP._

See `docs/adr/` for the full reasoning on each.

## License

MIT. Provided "as is", without warranty. See the regulatory disclaimer above.
