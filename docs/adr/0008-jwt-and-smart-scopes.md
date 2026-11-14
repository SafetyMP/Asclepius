# ADR 0008 — AuthN/AuthZ: JWT + RBAC + SMART-style scopes

- **Status:** Accepted
- **Date:** 2026-07-03

> **Current scope (November 2026):** This dated decision describes the local
> synthetic teaching core. Its original platform framing and production
> comparisons are historical rationale, not current deployment guidance or
> claims of clinical capability. The stakeholder-facing browser demo is defined
> in [ADR 0013](0013-browser-teaching-demo.md); [project scope](../PROJECT.md)
> governs current work. **NOT_FOR_CLINICAL_USE.**
>
> The public demo has no login, token issuance, or API calls. These auth
> examples apply only to the separate local teaching harness.

## Context

FHIR access is **resource- and action-scoped**: a clinician may read all
`Observation`s, a patient only their own, an analytics service may read but not
write. We need to model both _who_ (role) and _what_ (scoped resource/action).

## Decision

Issue **JWTs** carrying (a) a role and (b) a set of **SMART-style scopes**
(`patient/Observation.read`, `user/*.read`, `system/*.write`). Middleware
verifies the token and enforces that the request's resource+action is covered
by a scope and permitted by the role.

## Reasoning (first principles)

Access decisions decompose to: _is the caller authenticated?_ → _does a scope
cover this (resource, action)?_ → _does the role permit it?_ A scope claim of
`(resource, action)` is exactly the granularity FHIR access requires; pairing
it with coarse roles handles policies like "only pharmacists may delete
MedicationRequest." JWTs are stateless and fit REST; `jose` is a maintained,
side-channel-safe signing library.

## Better tool (honest)

A real deployment uses **full SMART-on-FHIR OAuth2** with an external IdP
(Keycloak, Auth0, Azure AD) handling flows, refresh, PKCE, and patient-bound
context. **Never use this JWT layer alone for real PHI** — federate identity.

## Consequences

- Authorization is centralized in middleware; services stay scope-agnostic.
- A clear, documented upgrade path to full SMART-on-FHIR.
- Token signing uses the config's `jwtSecret` (prod-missing = hard fail).
