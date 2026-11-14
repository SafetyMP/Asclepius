# Architecture Decision Records

An ADR records a dated architectural decision, its context, and its consequences.
The decisions below remain useful for the local teaching core, while the current
product is a stakeholder-facing browser experience with synthetic care journeys.
**NOT_FOR_CLINICAL_USE.**

Start with [ADR 0013](0013-browser-teaching-demo.md) for the current interface and
publishing model, [project scope](../PROJECT.md) for boundaries, and
[the design pivot](../DESIGN-PIVOT.md) for the transition. Earlier ADRs preserve
their original reasoning with current-scope notes. Historical comparisons with
production tools are not maintained recommendations or evidence of conformance,
security, regulatory compliance, or production readiness.

| Record | Decision | Current applicability |
| --- | --- | --- |
| [0001](0001-language-and-runtime.md) | TypeScript on Node | Retained; current runtime requirements are in package manifests and CI |
| [0002](0002-zod-single-source-of-truth.md) | Zod as the source of truth for FHIR types | Shared by the browser and local API; now eleven resource schemas |
| [0003](0003-ports-and-adapters.md) | Inward dependencies and ports/adapters | Retained for the local core |
| [0004](0004-storage-sqlite-and-memory.md) | In-memory and SQLite repository adapters | Local synthetic exercises only |
| [0005](0005-hono-http.md) | Hono HTTP framework | Separate local API; not called by the public demo |
| [0006](0006-hand-built-fhir-search.md) | Query-plan search implementation | Supported teaching subset, not full FHIR search |
| [0007](0007-cds-rule-dsl.md) | Composable rule examples | Local synthetic examples, not clinical advice |
| [0008](0008-jwt-and-smart-scopes.md) | JWT and SMART-style scopes | Local auth example, not a full SMART-on-FHIR service |
| [0009](0009-hash-chained-audit.md) | Hash-chained append-only log | Limited integrity demonstration, not a compliance claim |
| [0010](0010-max-strict-typescript.md) | Strict TypeScript compiler settings | Retained, with a correction to the original optionality explanation |
| [0011](0011-validation-strictness-posture.md) | Strip unknown keys at validated boundaries | Retained; passing or parsing does not guarantee fidelity or full conformance |
| [0012](0012-in-memory-ddi.md) | In-memory DDI sample behind a port | Intentionally incomplete, never a treatment-safety judgment |
| [0013](0013-browser-teaching-demo.md) | Browser teaching workspace and GitHub Pages | Current stakeholder experience and static deployment decision |

All records are accepted within the scope shown above. Add new decisions when a
material architecture choice changes; do not silently rewrite older reasoning.
Record amendments or supersession explicitly. See [the web guide](../../web/README.md)
for current build and verification commands.
