# Asclepius web — Connected care, explained

A browser-based educational experience for healthcare stakeholders exploring a
routine visit or referral handoff and its connected FHIR records. Developers can inspect the
underlying examples, validation results, and architecture.

[Live demo](https://safetymp.github.io/Asclepius/) ·
[Written journey guide](../docs/JOURNEYS.md) · [Project scope](../docs/PROJECT.md)

**NOT_FOR_CLINICAL_USE. Synthetic data only.** Do not enter real patient data.
The intentionally incomplete DDI examples are not a basis for safety judgments.

## Stack and runtime

The interface retains Next.js 16, React 19, TypeScript, and Tailwind CSS v4.
Next.js exports static HTML and assets to `out/`. The demo does not require an
API server, authentication, or a BFF proxy. Validation reuses the core teaching
schemas and rules in the browser; it does not establish full FHIR conformance,
reference existence, terminology validity, or clinical correctness.

## Local setup

Use Node.js 22, npm 10.9.2, and Python 3. Install root dependencies first because
the web application imports core validation code.

```bash
# From the repository root
npm ci
cd web
npm ci
npm run build
npm run start       # Python static server at http://127.0.0.1:3200
```

For development, `npm run dev` starts Next.js on port 3200. Production preview
uses Python to serve the static export; `next start` is not the deployment path.
The backend’s `npm run dev` command remains available separately at the
repository root for local synthetic experiments on port 8787.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Referral correspondence desk with two requests, two deliveries and an end-of-shift handoff |
| `/workspace/` | Source-linked reference for the fixture, desk state, validation service and local API |
| `/journeys/` | Both care journeys, separate progress, and contextual records |
| `/referral-review/` | Alternate entry to the referral-matching exercise |
| `/patients/` | Alternate entry to the same synthetic care journey |
| `/resources/` | Selected journey’s nine records, including multiple records of the same type |
| `/validate/` | Browser validation lab, issue feedback, and missing-identity exercise |
| `/architecture/` | Stakeholder orientation, referral context, glossary, and optional developer details |
| `/interactions/` | Local DDI example explanation and source/test links |
| `/cds/` | Local rule-composition explanation and source/test links |
| `/auth/` | Local authentication explanation and setup references |

The three local-reference routes do not invoke APIs or issue credentials.
The selected journey and its navigation state remain in memory until refresh.
Lab links include `journey` and the exact `Type/id` record key, so refreshing a
referral draft reloads the correct synthetic sample. Practice edits are not saved.
ServiceRequest and Task use the same limited Zod schemas as the local API; Task
input/output supports only references and strings. The browser makes no API calls.

## Verification

```bash
# From repository root
npm run gate

cd web
npx playwright install chromium
npm run verify       # typecheck, static build, smoke browser suite
npm run test:e2e      # complete browser suite against the existing export
```

The browser tests use a Python static server. They exercise the learning
journeys and accessibility; passing tests do not establish clinical validity or
measured user engagement. Review current command output before claiming a pass.

## GitHub Pages

Target: [SafetyMP/Asclepius demo](https://safetymp.github.io/Asclepius/).
The Pages workflow publishes verified builds from `main`. Check its latest deployment status in GitHub Actions.

The [Pages workflow](../.github/workflows/pages.yml) sets
`NEXT_PUBLIC_BASE_PATH=/Asclepius`, validates the root kit, builds the static
site, and runs the browser suite at the actual project subpath. Pull requests
build and test; successful `main` runs upload `out/` and deploy through GitHub
Pages. The repository’s Pages source must be **GitHub Actions**.

To reproduce the project-subpath preview locally:

```bash
# From web/
NEXT_PUBLIC_BASE_PATH=/Asclepius npm run build
mkdir -p .pages-preview/Asclepius
cp -R out/. .pages-preview/Asclepius/
NEXT_PUBLIC_BASE_PATH=/Asclepius PLAYWRIGHT_STATIC_DIR=.pages-preview npm run test:e2e
```

A normal local build omits `NEXT_PUBLIC_BASE_PATH`; rebuild when changing the
base path. Do not commit `out/` or preview output. See
[the asset inventory](../docs/assets/README.md) for current and historical
screenshots.


## Discovery and documentation

The public demo and repository share the same stakeholder-first description.
See [discoverability guidance](../docs/DISCOVERABILITY.md) for canonical URLs,
search metadata, and machine-readable reading aids. Public metadata describes
an educational application; it must not imply clinical capability or certification.

Journey text and stage ordering live in `src/lib/journeys.ts`; synthetic records
live in `src/lib/examples.ts` and `src/lib/referral-examples.ts`. The
[documentation source map](../docs/README.md#source-map) links these to the shared
validator and tests. Keep the [written walkthrough](../docs/JOURNEYS.md) aligned
when changing either case.

Use `npm run screenshots` against a running static preview to capture the two
current README images. See [the asset guide](../docs/assets/README.md#refresh-current-screenshots)
for review output and Pages-subpath options. Historical console images remain
preserved separately.
