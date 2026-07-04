# ADR 0007 — Clinical Decision Support: a focused rule DSL, not CQL

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

A CDS engine evaluates rules over a patient's record (conditions, meds,
observations, allergies, labs) and produces alerts. HL7 standardizes both the
logic language (**CQL**, Clinical Quality Language) and the response wire
format (**CDS Hooks**).

## Decision

Implement a focused, composable **rule DSL** (rules as pure functions
`PatientContext → Alert[]` plus a declarative registry), and emit results as
**CDS Hooks "cards"**.

## Reasoning (first principles)

A clinical rule has three parts: **query** the record, **evaluate** a
predicate, **emit** an action. Modeling each rule as a pure function makes the
predicate trivially testable (give it a context, assert the alerts) and the
registry extensible without code changes elsewhere. Emitting CDS Hooks cards
keeps the _output_ on a real standard even though the _logic_ uses a simpler
language. Choosing CQL would add a parser + execution engine + its learning
curve without changing the demonstrated architecture.

## Better tool (honest)

**CQL** with an engine like **cql-execution (JS)** or the **CQL Execution
Framework (Java)** is the production standard and is required for sharing
rules across organizations / quality reporting. Our DSL is a readable subset
that demonstrates the architecture; migrating to CQL later is an engine swap
behind the same card-emitting interface.

## Consequences

- Rules are short, pure, and unit-tested per-case.
- Output is CDS-Hooks-compatible (cards with indicator/severity/source).
- Not interoperable with external CQL libraries — documented limitation.
