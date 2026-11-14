# Asclepius — synthetic care journey

A browser-based educational experience for healthcare stakeholders exploring a
fictional case and its connected FHIR records. Developers can inspect the
underlying examples, validation results, and architecture.

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
| `/` | Synthetic care journey and contextual record exploration |
| `/patients/` | Alternate entry to the same synthetic care journey |
| `/resources/` | Nine-resource library with explanations and synthetic JSON |
| `/validate/` | Browser validation lab, issue feedback, and missing-identity exercise |
| `/architecture/` | Schemas, services, ports, and adapters with source links |
| `/interactions/` | Local DDI example explanation and source/test links |
| `/cds/` | Local rule-composition explanation and source/test links |
| `/auth/` | Local authentication explanation and setup references |

The three local-reference routes do not invoke APIs or issue credentials.

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
