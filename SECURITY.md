# Security Policy

## Not for clinical use

Asclepius is a **reference / educational implementation**, **not** a certified
medical device and **not** compliant with HIPAA, HITRUST, or any clinical
regulatory framework. **Do not use it to store, process, or make decisions about
real patient data.** This policy covers the security of the **source code**; it
does not change the project's clinical-safety posture. See the README's
regulatory disclaimer.

## Supported versions

Asclepius is pre-1.0 (`0.1.x`). Security fixes are applied to the latest `main`
only; there are no backport branches.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Instead, please report it privately:

1. Open a GitHub **Security Advisory**: the
   [**Report a vulnerability**](https://github.com/SafetyMP/FHIR/security/advisories/new)
   button on the **Security** tab (preferred — supports private coordination and
   CVE assignment). Use the template and include:
   - a description of the issue and its impact,
   - the commit hash or version affected,
   - steps to reproduce, and a proof of concept if you have one.
2. Alternatively, email the maintainers at **harts@wustl.edu** with the same
   details.

Please **do not** open a pull request fixing a vulnerability until we have
acknowledged the report and agreed on a coordinated disclosure path.

## Response

We acknowledge reports within **3 business days** and aim to provide an initial
assessment within **14 days**. Coordinated disclosure timelines are agreed
case-by-case with the reporter. Once a fix is released we will credit the
reporter (unless they prefer to remain anonymous).

## Scope

In scope: vulnerabilities in this repository's code that could lead to
unexpected code execution, data corruption, or authz bypasses _within the
reference implementation_. Examples: prototype-pollution via zod input, unsafe
deserialization, broken access control in a future auth adapter.

Out of scope (but welcome as regular issues): the incompleteness of the DDI
knowledge base, the absence of clinical certification, and any behavior that
follows documented limitations.

## Safe harbor

Good-faith security research on this reference implementation is appreciated.
Please avoid degrading service, modifying data that is not your own, or
accessing others' data.
