# Asclepius web — Connected care, explained

A browser-based referral review and training decision for a coordinator, interface analyst and education lead. A separate implementation trace carries the selected case and sponsor assumptions.

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
| `/` | Maya’s referral handoff, two letters, queue decision and optional educator worksheet |
| `/workspace/` | Selected-case trace, four filing replays and the shared validator with intact and missing-status trials |
| `/referral-review/` | Alternate bookmark for the public case |

Former technical bookmarks open the same compact implementation trace. Only the case and technical trace appear in the sitemap. Navigation between the two retains the current selections in memory. Refresh starts a new practice session unless using the technical evidence permalink, which restores the selected case and trials from its URL fragment. All actions use synthetic data and stay in the browser.

## Verification

```bash
# From repository root
npm run gate

cd web
npx playwright install chromium
npm run verify       # typecheck, static build, smoke browser suite
npm run test:e2e      # complete browser suite against the existing export
```

The browser tests use a Python static server. They exercise the referral decision, technical trials, legacy bookmarks and accessibility; passing tests do not establish clinical validity or
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

Use `npm run screenshots` against a running static preview to capture the referral study and its technical trace. See [the asset guide](../docs/assets/README.md#refresh-current-screenshots)
for review output and Pages-subpath options. Historical console images remain
preserved separately.
