# ADR 0011 — Validation strictness posture

- **Status:** Accepted
- **Date:** 2026-07-04

## Context

zod objects default to **stripping** unknown keys. Surfaces in the domain layer
split into two behaviors:

- Top-level resources (via `resourceUnion` / `parseResource`) **strip** unknown
  keys — `parseResource({resourceType:'Patient', intent:'order'})` succeeds and
  drops `intent`.
- `contained` resources, and a few unmodeled backbones (`Timing`, `Signature`,
  `Bundle.entry.response.outcome`), use `.passthrough()` — they keep everything.

An adversarial review flagged this as inconsistent. We must decide: unify, or
document the split as intentional.

## Decision

Keep the split, and document it as policy:

1. **Validated boundaries (top-level resources) strip.** We validate against an
   authored schema; unknown elements are dropped. FHIR's extension mechanism
   belongs in the modeled `extension` / `modifierExtension` fields, not in
   arbitrary top-level keys, so stripping unknown keys enforces our model
   without losing legitimate extensions.

2. **`contained` passthrough.** Contained resources may be of a type we don't
   model; stripping or rejecting them would lose data. Preserve fidelity.

3. **Unmodeled backbones (`Timing`, `Signature`, response `outcome`) passthrough
   with an inline comment.** These are datatypes/backbones not yet modeled in
   the reference subset (ADR 0002); preserve the data rather than drop or reject
   it. Each passthrough site carries a comment pointing here.

## Reasoning (first principles)

Validation has two competing goals: **enforce the contract** (catch malformed
input) and **preserve fidelity** (don't silently lose data the receiver sent).
At a boundary where we have a schema we trust, enforcing wins — drop the
unknown. At a boundary where we deliberately haven't modeled the shape,
preserving wins — don't pretend to validate what we can't. Forcing one behavior
everywhere either weakens validation (passthrough on top-level) or loses
fidelity (strip on `contained`). The split serves both goals where each applies.

## Consequences

- Top-level payloads lose unknown keys. Callers needing round-trip fidelity for
  unmodeled elements must send them inside modeled containers (e.g. `extension`).
- `contained` and the flagged backbones preserve all data.
- A future hardening pass could model `Timing`/`Signature` fully and tighten
  `contained.resourceType` to a FHIR-resourceType regex; until then the split is
  documented and intentional.

## Related

- ADR 0002 (zod single source of truth; deliberate FHIR subset)
- @verify gap report (2026-07-04): flagged the strip-vs-passthrough inconsistency
