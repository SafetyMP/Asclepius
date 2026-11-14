# AGENTS.md — Asclepius contributor and agent guide

These instructions apply throughout this repository. They are self-contained;
no personal machine configuration or external agent runtime is required.

## Product intent and reading map

Asclepius explains connected care through **synthetic workflows for healthcare
stakeholders**. The calm browser workspace offers a routine follow-up and a
referral between care teams, plus linked records and a validation lab. The local
TypeScript FHIR teaching core remains a separate developer reference.

Read only the context needed for the task:

| Work | Start here |
| --- | --- |
| Product scope and limitations | [README.md](README.md), [design rationale](docs/DESIGN-PIVOT.md) |
| Setup, contribution, and checks | [CONTRIBUTING.md](CONTRIBUTING.md), [web guide](web/README.md) |
| Journey content and navigation | `web/src/lib/journeys.ts`, `web/src/lib/examples.ts`, `web/src/lib/referral-examples.ts`, `web/src/components/workspace/` |
| Record explanations and connections | `web/src/lib/record-context.ts`, `web/src/components/workspace/resource-explorer.tsx` |
| Shared validation and local API | `src/domain/fhir/`, `src/service/validation/`, [architecture decisions](docs/adr/) |
| Documentation and discovery | [documentation map](docs/README.md) |
| Security reports | [SECURITY.md](SECURITY.md) |

Copilot also reads [repository instructions](.github/copilot-instructions.md)
and [path-specific instructions](.github/instructions/). Keep those summaries
consistent with this guide.

## Safety and product boundaries

- Never remove or soften `NOT_FOR_CLINICAL_USE`. Use fictional data only; no real
  patient information, credentials, EHR, pharmacy, or clinical-system integration.
- This is an educational reference, not a certified medical device, production
  FHIR server, clinical recommendation system, or full FHIR conformance validator.
- The DDI knowledge base is intentionally incomplete. Never imply completeness
  or treatment safety from its output.
- Keep the two journeys distinct. Resolve records by full `ResourceType/id`,
  within the selected journey, rather than assuming one record per type.
- In the referral snapshot, the request is active, the coordination task is
  completed, and the receiving encounter is planned. Completing coordination
  does not mean care occurred. Navigation does not send or change a referral.
- Preserve per-journey context, visible ownership, keyboard navigation, responsive
  layouts, and plain-language explanations before technical details.
- Do not claim improved engagement, clinical validity, search ranking, or agent
  adoption from automated tests or a design review.

## Architecture rules

- Preserve the existing TypeScript, Zod, Hono, and static Next.js stack.
- **Dependencies point inward.** Domain code does not import application layers;
  services depend on domain and ports; adapters implement ports using domain
  types. Never import an adapter from `service` or `domain`.
- **`src/app.ts` is the local API composition root.** Wire adapters there, not
  inside services. External infrastructure gets a `src/port/` interface first.
- **Zod is the source of truth for FHIR types.** Derive TypeScript with `z.infer`;
  do not maintain parallel interfaces or a separate browser validator.
- **`web/` exports a static site.** The public demo needs no account, token,
  server API, or backend connection. Preserve GitHub Pages `/Asclepius` routing.

## TypeScript and testing

- Preserve strict compiler options. Use `import type` / `export type` for types.
- Handle possibly undefined values explicitly; do not silence them with `!`.
  No `any` in `src/`; prefer `unknown` and narrowing.
- Unit tests are co-located as `*.test.ts`; integration tests are in
  `tests/integration/`; shared synthetic JSON fixtures are in `tests/fixtures/`.
- Browser behavior tests live in `web/tests/e2e/`. Add meaningful regression
  coverage for behavior changes, including journey isolation and handoff context.
- Do not skip or weaken checks to land a change. Report observed results and
  distinguish local verification, CI, deployment, and live verification.

## Verification

Use Node.js 22 and npm 10 for work spanning both packages. The root core is also
checked on Node 24 and 26; `.nvmrc` selects 22 for the shared workflow.
The web package requires Node 22. Use Python 3 for static preview and browser tests.

```bash
npm ci
npm run gate                     # format, lint, typecheck, tests, build
npm run docs:check               # local Markdown file links
npm ci --prefix web
npm run verify --prefix web      # typecheck, static build, browser smoke + axe
npm run test:e2e --prefix web     # full browser suite against that build
```

`./scripts/verify.sh` installs root dependencies and runs the root gate. It does
not replace the web checks. The [web guide](web/README.md) documents verification
at the actual Pages subpath. Regenerate changed lockfiles with npm 10.9.2; do not
regenerate them for documentation-only changes. Do not claim green without
observed command output.

## Change delivery

Preserve user edits and historical evidence. Keep changes scoped and reviewable;
use conventional commit titles such as `fix(web): clarify referral ownership`.
Record new or reversed architectural decisions in `docs/adr/`, retaining history.
Never commit secrets, databases, dependency directories, or build output.

For substantial changes, define acceptance checks and obtain independent review.
Follow [CONTRIBUTING.md](CONTRIBUTING.md) and the pull request template. Publishing
requires task authorization; repository instructions do not themselves authorize
external actions.
