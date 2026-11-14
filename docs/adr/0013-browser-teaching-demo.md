# ADR 0013: A browser teaching workspace and GitHub Pages demo

Date: 2026-11-14

Status: Accepted

## Context

The existing Next.js console required a separately running API and developer
token before visitors could try its central learning tasks. Its clinical
workstation framing also conflicted with the teaching-kit purpose recorded in
[the design pivot](../DESIGN-PIVOT.md). A public GitHub Pages demo must work from
static files, without an API server, secrets, or a real clinical connection.

## Decision

Keep the existing TypeScript, React, and Next.js stack. Redesign the web surface
for healthcare stakeholders exploring synthetic workflows, using a calm workspace
with a primary scenario walkthrough and connected synthetic records. Resource
inspection and actionable validation feedback support that walkthrough as
secondary tools. Run the existing domain schemas and validation service in the browser;
do not maintain an imitation validator or a parallel set of FHIR interfaces.
Keep storage adapters, authentication, and the local API outside this browser
bundle. The API and its tests remain available as separate teaching material.

Use Next.js `output: "export"` and trailing-slash routes. Local builds use `/`;
the GitHub Pages workflow sets `NEXT_PUBLIC_BASE_PATH=/Asclepius` at build time.
Remove API rewrites because static hosting cannot execute them. Deploy only the
generated `web/out` directory. The workflow verifies the core, exports the UI,
and runs browser tests against a static server under the actual `/Asclepius`
prefix before uploading the artifact. Only main-branch runs can deploy.

The hosted demo retains the **NOT_FOR_CLINICAL_USE** boundary and uses synthetic
examples only. Browser execution does not establish clinical suitability, full
FHIR conformance, or a complete DDI knowledge base. No clinical system connection
or real patient data is introduced by this decision.

## Consequences

- Visitors can try the teaching experience without installation, credentials,
  a running backend, or sending example resources to an API.
- The browser and server teaching paths share validation behavior through the
  existing source, so both root and web dependencies are installed for UI builds.
- Generated output must be served statically; `next start` does not serve an
  exported application. Playwright uses Python's local HTTP server for QA.
- Changing the hosted path requires a rebuild. Navigation must use Next links
  or explicitly include the configured base path.
- GitHub Pages must be configured to use GitHub Actions in repository settings.
  A successful local export is not evidence of a deployed or usable public URL.
- This is an implementation hypothesis about reduced learning friction, not
  evidence of improved customer engagement. User observation is still required.

## Better tool for production

Use an appropriately operated production FHIR platform and conformance tooling
for real clinical systems. This repository remains an educational subset; the
public demo is not a clinical workstation or a substitute for those systems.

## References

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
