---
name: code-review
description: "Review Asclepius changes for stakeholder workflow clarity, synthetic-data boundaries, static Pages behavior, ports-and-adapters architecture, and shared Zod validation."
---

# Asclepius code review

Read [AGENTS.md](../../../AGENTS.md) and review the changed behavior in context.
The primary experience explains synthetic care journeys for healthcare
stakeholders; the local FHIR teaching core is a separate developer reference.

## Review checks

- Preserve plain-language context, calm visual hierarchy, keyboard access, and
  responsive navigation. Report concrete friction rather than aesthetic taste.
- Check journey switching, full record identities, and graph isolation. A
  completed handoff coordination task must not imply completed receiving care.
- Keep static Pages routes valid under `/Asclepius`, with no account, token, or
  local API dependency. Do not introduce a separate browser validation model.
- Reject adapter imports into services or domain code and hand-written FHIR
  interfaces that can drift from Zod schemas.
- Preserve `NOT_FOR_CLINICAL_USE` and DDI incompleteness. Flag real patient data,
  credentials, unsupported clinical or conformance claims, and live EHR links.
- Verify observed results for `npm run gate` and relevant web checks. Flag
  skipped checks, weakened validation, and unsubstantiated success claims.
- Check that changed behavior is explained in maintained documentation and has
  proportionate regression coverage. Distinguish history from current guidance.

Do not request unrelated major upgrades, formatter churn, or refactors. Separate
blocking defects from optional suggestions; cite the affected path and behavior.
