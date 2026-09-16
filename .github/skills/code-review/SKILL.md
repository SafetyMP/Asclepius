---
name: code-review
description: "Review Asclepius PRs for ports-and-adapters, zod-as-FHIR-source-of-truth, and NOT_FOR_CLINICAL_USE. Use on pull requests that touch FHIR types, adapters, DDI, or web/. Never allow real PHI or EHR connections."
---

# Copilot code review — Asclepius

Use this skill when reviewing a pull request in this repository.

This is a **typed FHIR R4 teaching kit**, not a clinical product.

- Reject adapter imports into `service` or `domain`.
- Reject hand-written FHIR interfaces that can drift from zod schemas.
- Reject removal or softening of `NOT_FOR_CLINICAL_USE`.
- Verify with `./scripts/verify.sh` or `npm run gate`.


## Always flag

- Secrets, `.env` values, private keys, or real personal data in the diff
- Weakened or skipped verify / lint / typecheck / adversarial gates
- Invented success (prose claiming a gate passed with no command output)
- Fail-open authorization, skipped human approval, or agents recording `--actor user`

## Never request

- Drive-by major upgrades, formatter churn, or unrelated refactors
- Softening honesty disclaimers or certification claims
