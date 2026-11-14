# Security policy

## Project scope

Asclepius is a browser-based **synthetic care journey demo** and a separate local
**FHIR R4 teaching implementation**. **NOT_FOR_CLINICAL_USE.** It is not a
certified medical device or a HIPAA/HITRUST-compliant clinical system. Do not
store, process, or make decisions about real patient data. See the
[README](README.md) and [design rationale](docs/DESIGN-PIVOT.md).

The public GitHub Pages demo is a static site with browser-local sample
validation; it does not connect to the local API or a live EHR. The local API
includes teaching authentication, storage, and audit examples. This policy
covers software security in both parts without changing their clinical limits.

## Supported versions

The project is pre-1.0. Security fixes are applied to the latest `main` only;
there are no maintained release or backport branches.

## Report a vulnerability privately

**Do not open a public issue or pull request with an undisclosed vulnerability.**
Use [Report a vulnerability](https://github.com/SafetyMP/Asclepius/security/advisories/new)
on the repository's Security tab for private coordination with maintainers.
Include:

- The affected commit, route or component, and impact.
- Reproduction steps and a minimal proof of concept using synthetic data only.
- Relevant browser/runtime versions and redacted logs.

Do not include real patient information, active credentials, or other people's
data. If the private reporting form is unavailable, open only a minimal public
issue asking for a private security contact, **without vulnerability details**.
Wait for a coordinated disclosure path before opening a public fix.

## Response

Maintainers aim to acknowledge reports within **3 business days** and provide
an initial assessment within **14 days**. Disclosure timelines are agreed
case by case. Reporters are credited after a fix unless they prefer anonymity.
These are response goals, not a production support guarantee.

## Scope of reports

Report issues such as browser script injection, unsafe parsing, unexpected code
execution, dependency vulnerabilities, data corruption, or authorization bypass
in the local teaching API. Deployment or supply-chain weaknesses affecting this
repository are also relevant.

Documented limitations, such as incomplete DDI coverage or lack of full FHIR
conformance, are not evidence of clinical fitness. Report misleading wording or
incorrect sample behavior through a [regular issue](https://github.com/SafetyMP/Asclepius/issues/new/choose),
unless disclosing it would expose an exploitable security vulnerability.

## Responsible research

Use a local checkout and synthetic fixtures for testing. Do not degrade the
public demo, access others' data, or modify systems you do not control. This
policy does not authorize testing clinical systems or external services.
