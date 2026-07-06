# Asclepius — FHIR-native Clinical Data Platform

[![CI](https://github.com/SafetyMP/Asclepius/actions/workflows/ci.yml/badge.svg)](https://github.com/SafetyMP/Asclepius/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/SafetyMP/Asclepius/blob/main/LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-339933?logo=node.js&logoColor=white)](#getting-started)

> ⚠️ **NOT FOR CLINICAL USE.** Asclepius is a **reference implementation** that
> demonstrates the architecture of a FHIR-native clinical data platform. It is
> **not** HIPAA-certified, **not** a regulated medical device, and its
> drug-interaction knowledge base is intentionally **incomplete**. Do **not**
> store, process, or base clinical decisions on real patient data with this
> software. See the [regulatory disclaimer](#regulatory-disclaimer) below.

A from-scratch, layered implementation of the pillars of a clinical data
platform, built to be **correct and testable** rather than feature-complete.
Every architectural choice is documented with first-principles reasoning and an
honest "better tool for production" callout in [Architecture Decision Records](docs/adr/).

## Status

This is a **partial implementation** — the foundation is real and tested; most
pillars are planned. The status column is the source of truth for what exists
today.

| Pillar                    | Implementation                                                                                                                                                                                                                                                                | Status                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| FHIR R4 resource model    | Hand-authored zod schemas (single source of truth → inferred TS types); 9 resources, primitives, datatypes, Bundle, OperationOutcome                                                                                                                                          | ✅ Built                                                            |
| Storage                   | `ResourceRepository` **port** + in-memory versioned adapter (immutable snapshots, history, soft delete)                                                                                                                                                                       | ✅ Built                                                            |
| Storage (persistent)      | SQLite adapter via `better-sqlite3`                                                                                                                                                                                                                                           | 🚧 Planned ([ADR 0004](docs/adr/0004-storage-sqlite-and-memory.md)) |
| FHIR search               | Hand-built query-plan **compiler** (param types, modifiers, prefixes) + **executor** (path extraction, per-type matching, reference chaining, `_sort`/`_count`/`_page`)                                                                                                       | ✅ Built                                                            |
| REST API                  | Hono HTTP adapter: create/read/vread/update(+create-on-update)/delete, ETag/Location/versioning, instance + type history Bundles, search (GET ?params + POST _search → searchset Bundle, incl. reference chaining + self/next/prev pagination links), OperationOutcome errors | ✅ Built ([ADR 0005](docs/adr/0005-hono-http.md))                   |
| Validation                | zod runtime validation against authored FHIR profiles                                                                                                                                                                                                                         | 🚧 Planned                                                          |
| Clinical Decision Support | Composable rule DSL → CDS Hooks "cards"                                                                                                                                                                                                                                       | 🚧 Planned ([ADR 0007](docs/adr/0007-cds-rule-dsl.md))              |
| Drug–drug interactions    | Structured JSON knowledge base + graph-aware checker (severity + mechanism)                                                                                                                                                                                                   | 🚧 Planned                                                          |
| AuthN/AuthZ               | JWT (HS256, jose) + SMART-style scope middleware (`system/Patient.read`, `user/*.write`); dev-only `/auth/token` issuer (prod-disabled). Patient-compartment filtering + role-based overrides deferred                                                                        | ✅ Built ([ADR 0008](docs/adr/0008-jwt-and-smart-scopes.md))        |
| Audit                     | Hash-chained, append-only, tamper-evident log                                                                                                                                                                                                                                 | 🚧 Planned ([ADR 0009](docs/adr/0009-hash-chained-audit.md))        |

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
        └───────────────────────────────┼───────────────────────────────────┘
                                        │ port interfaces
        ┌───────────────────────────────▼───────────────────────────────────┐
        │  adapter/storage: in-memory · sqlite   (port implementations)      │
        └───────────────────────────────────────────────────────────────────┘
```

_Target architecture — see the [Status](#status) table above for what is
implemented today (e.g. SQLite/HTTP/auth/audit adapters are not yet built)._

Dependencies point **inward**: `domain` depends on nothing; `service` depends on
`domain` + `port`; adapters depend on `port` + `domain`. `src/app.ts` is the
single composition root that wires adapters to services.

## Getting started

Requires **Node.js ≥ 22** (see `.nvmrc` for the dev version).

```bash
npm install              # dependencies (builds better-sqlite3's native module)
npm run dev              # run via tsx (no compile step), hot reload
npm test                 # run the test suite
npm run gate             # format:check → lint → typecheck → test → build
```

The project is configured for **max-strict TypeScript** (`strict`,
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`).
A change is not done until `npm run gate` is green.

## Why these tools (and where there's a better one)

Every component choice is documented with its first-principles rationale and an
honest "better tool for production" callout in `docs/adr/`. Summary:

- **TypeScript** — models FHIR's structural types; compiler verifies shape.
  _Production FHIR servers: Java (HAPI) or .NET (Firely)._
- **zod** — single source of truth for types + runtime validation.
  _Full FHIR profiling: Firely validator._
- **In-memory + SQLite** — zero-config real persistence + fast tests.
  _Scale: Postgres + JSONB/GIN._
- **Hono** — web-standard, portable, fast. _Larger ecosystem: Fastify._
- **Hand-built search** — the hard core; no library does FHIR search correctly.
  _Scale: Elasticsearch._
- **CDS rule DSL** — testable pure functions. _Production: CQL._
- **JWT + scopes** — models FHIR's resource/action access.
  _Production: full SMART-on-FHIR OAuth2 via a real IdP._

See [`docs/adr/`](docs/adr/) for the full reasoning on each.

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md)
(the `npm run gate` requirement, code style, and the ADR-first decision process)
before opening a pull request. For security issues, see [`SECURITY.md`](SECURITY.md)
— **do not** file vulnerabilities as public issues.

## Regulatory disclaimer

Asclepius is a **reference / educational implementation**. It is **not** a
certified medical device, is **not** HIPAA- or HITRUST-compliant, and carries no
warranty of fitness for any clinical purpose. The DDI knowledge base is
intentionally incomplete; missing interaction data is a patient-safety hazard.
**Never** connect this software to real clinical systems, pharmacies, or EHRs,
or use it to store or make decisions about real patient data.

## License

Licensed under the **Apache License, Version 2.0**. See [`LICENSE`](LICENSE) and
[`NOTICE.md`](NOTICE.md). Unless required by applicable law or agreed to in
writing, software distributed under the License is distributed on an "AS IS"
BASIS, **WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND**, express or implied.
