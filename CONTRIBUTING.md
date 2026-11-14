# Contributing to Asclepius

Asclepius helps healthcare stakeholders understand connected care through two
synthetic journeys: a routine follow-up and a referral between care teams. It
also includes a local TypeScript teaching core with eleven FHIR R4 resource
schemas. Contributions to workflow clarity, language, accessibility,
documentation, and the teaching implementation are welcome.

**NOT_FOR_CLINICAL_USE.** Use synthetic data only. Never include real patient
data or credentials, weaken the safety markers, imply the incomplete DDI
knowledge base is comprehensive, or add real clinical-system connections.
Read the [product rationale](docs/DESIGN-PIVOT.md) for scope and limitations.

## Contribute without writing code

Try the [live demo](https://safetymp.github.io/Asclepius/) and use an
[issue form](https://github.com/SafetyMP/Asclepius/issues/new/choose) to describe a
confusing step, missing explanation, accessibility problem, or proposed workflow.
Include the journey, stage, expected outcome, and browser or device when relevant.
Screenshots must contain only synthetic examples. No local setup is needed to
report feedback. See [SUPPORT.md](SUPPORT.md) for questions and reporting routes.

For larger features, explain the stakeholder need and a concrete success check
in an issue before investing in implementation. Small fixes can go straight to
a pull request. Security vulnerabilities follow [SECURITY.md](SECURITY.md), not
public issues or pull requests.

## Local setup

Use **Node.js 22**, **npm 10.9.2**, and **Python 3** when working across both
packages. The root core also supports Node 24 and 26 and CI tests all three;
`.nvmrc` selects 22 for the shared workflow. The web package specifies Node 22.
A C++ toolchain may be required to build `better-sqlite3` during root installation.

```bash
npm ci
npm ci --prefix web
npm run dev --prefix web          # browser workspace at http://localhost:3200
```

The browser demo works without the API. To work on the separate local teaching
API, run `npm run dev` from the repository root (port 8787). See
[web/README.md](web/README.md) for static preview, routes, and Pages deployment.

## Architecture and product checks

Follow [AGENTS.md](AGENTS.md), which applies to human and agent contributions:

- Keep the browser workspace stakeholder-first: clear context and ownership,
  calm visual hierarchy, keyboard access, responsive layout, and optional
  technical detail. Preserve independent journey progress and record identities.
- Keep referral statuses honest: completed coordination does not mean completed
  care, and selecting a stage does not execute a workflow.
- Preserve the static browser/local API separation and shared validation logic.
- Dependencies point inward. Services use ports and domain types; adapters
  implement ports. Do not import adapters into domain code or services.
- Wire local API adapters in `src/app.ts`. Define new infrastructure ports in
  `src/port/` before implementing adapters.
- Define FHIR types with Zod and infer TypeScript types. Do not duplicate schemas.
- Preserve strict TypeScript options, type-only imports, and explicit handling
  of undefined values. Use `unknown` plus narrowing rather than `any` in `src/`.

## Verification

```bash
npm run gate                     # root format, lint, typecheck, tests, build
npm run docs:check               # local Markdown file links
npm run verify --prefix web      # web typecheck, build, browser smoke and axe
npm run test:e2e --prefix web     # full browser suite against the built export
```

`./scripts/verify.sh` is the root install-and-gate helper. For web changes, run
both the root and web gates; the Pages workflow additionally checks the actual
`/Asclepius` subpath. See the [web guide](web/README.md) for local parity commands.
For prose-only changes, check relative links and factual claims and include the
root gate result required by this repository. State checks not run and why.

Unit tests are co-located (`*.test.ts`); integration tests live in
`tests/integration/`; shared synthetic JSON fixtures are in `tests/fixtures/`.
Browser tests live in `web/tests/e2e/`. Cover changed behavior with meaningful
regressions. Do not treat tests as clinical validation, user research, or proof
of improved engagement.

## Pull requests and decisions

- Fork the repository or use an authorized branch, then target `main`.
- Describe the user-visible problem, resulting behavior, and observed checks.
  Include before/after images for visual changes and use synthetic data only.
- Use a conventional title, such as `fix(web): clarify referral ownership`.
  Keep diffs reviewable and avoid unrelated formatting or dependency changes.
- Add or update an [ADR](docs/adr/) when introducing or reversing an architectural
  decision. Preserve the historical decision and explain the change.
- Never commit secrets, `*.db`, dependency directories, or generated builds.
- Required CI must pass before merge. A successful local build is not proof of
  deployment; publishing changes is a separate maintainer action.

## Supply-chain checks

[CI](.github/workflows/ci.yml), [CodeQL](.github/workflows/codeql.yml),
[OpenSSF Scorecard](.github/workflows/scorecard.yml), and
[Dependabot](.github/dependabot.yml) are configured in the repository. Review
current Actions results rather than assuming configuration means checks passed.
The optional `./scripts/oss-scorecard.sh` produces a local Scorecard report when
the Scorecard tool is installed.

Follow the [Code of Conduct](CODE_OF_CONDUCT.md). Contributions are licensed
under the [Apache License, Version 2.0](LICENSE).
