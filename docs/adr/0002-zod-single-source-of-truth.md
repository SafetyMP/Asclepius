# ADR 0002 — zod as single source of truth for FHIR types

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

We need both a **static type** (for the compiler) and a **runtime validator**
(for untrusted JSON at the API boundary). If these are two artifacts, they
**drift**: a validator accepts a shape the type forbids, or vice versa.

## Decision

Author **zod schemas** for each supported FHIR resource; derive the TypeScript
type with `z.infer<typeof Schema>`. The schema is the source; the type follows.

## Reasoning (first principles)

Two artifacts describing one contract invite inconsistency; one artifact
describing both cannot. zod is the TS-native library that yields both a
runtime parser and an inferred type from a single declaration, with good error
messages. Co-locating schema and type means changing one changes the other.

## Scope

Hand-authored subset of FHIR R4 (Patient, Practitioner, Organization,
Encounter, Observation, Condition, MedicationRequest, AllergyIntolerance,
DiagnosticReport, Bundle, OperationOutcome). Full R4 is out of scope for a
reference build.

## Better tool (honest)

For **full FHIR profiling conformance** (extensions, slicing, code bindings,
invariants), use the **Firely validator** (Java/.NET) — the reference
implementation used in certification. zod gives pragmatic, readable validation
for the profiles we support, not conformance-grade checking.

## Consequences

- Types and validators cannot drift by construction.
- We maintain the schemas; full R4 coverage is a deliberate non-goal.
- Error messages at the API boundary are zod's, formatted into OperationOutcome.
