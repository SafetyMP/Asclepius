# ADR 0009 — Audit: hash-chained append-only log

- **Status:** Accepted
- **Date:** 2026-07-03

> **Current scope (November 2026):** This dated decision describes the local
> synthetic teaching core. Its original platform framing and production
> comparisons are historical rationale, not current deployment guidance or
> claims of clinical capability. The stakeholder-facing browser demo is defined
> in [ADR 0013](0013-browser-teaching-demo.md); [project scope](../PROJECT.md)
> governs current work. **NOT_FOR_CLINICAL_USE.**
>
> The hash chain demonstrates a limited integrity check; it does not establish
> compliance or protect against all log replacement or truncation scenarios.

## Context

HIPAA requires an accounting of disclosures: who accessed what PHI, when. An
audit log must be **append-only**, **attributable**, and **integrity-protected**
(tampering detectable).

## Decision

Append-only log where each entry includes a hash of the **previous** entry
(lightweight hash chain, Merkle-adjacent). Verification walks the chain and
recomputes hashes; any tampered/broken link is detected.

## Reasoning (first principles)

Tamper-evidence requires that altering any historical entry changes something
downstream that a verifier recomputes. Chaining each entry's hash to the next
gives that property without a blockchain, external service, or WORM hardware —
and is trivially verifiable in a unit test (mutate an entry, assert the chain
breaks).

## Better tool (honest)

Production compliance uses **WORM storage**, **digitally signed logs**, or a
**SIEM** (Splunk, Elastic Security) with hardware-backed integrity and
retention controls. Our chain demonstrates the integrity _property_; it is not
a compliance-grade audit system.

## Consequences

- Tampering is detectable via a single verification pass.
- Append-only enforced at the adapter (no update/delete API).
- Migration to a SIEM/WORM sink is a new audit adapter behind the same port.
