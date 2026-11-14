# Discoverability and repository upkeep

Asclepius is **Connected care, explained**: an educational workspace for healthcare
stakeholders exploring two synthetic care journeys, supported by a local FHIR R4
teaching core. Use this description consistently; do not describe the demo as a
clinical platform, a live referral service, or a conformant production FHIR server.

## Surfaces people and tools can read

| Surface | Purpose | Source of truth |
| --- | --- | --- |
| GitHub About | Short description, live demo URL, focused topics | Repository settings; align with [README](../README.md) |
| README and documentation map | Audience, supported workflows, limitations, setup | [README](../README.md), [documentation map](README.md) |
| Journey walkthrough | Both cases readable without operating the interface | [JOURNEYS.md](JOURNEYS.md) |
| Contributor instructions | Portable source map and meaningful checks | [AGENTS.md](../AGENTS.md), [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Browser page metadata | Distinct titles, descriptions, canonical and share URLs | [site-metadata.ts](../web/src/lib/site-metadata.ts) and route layouts |
| Structured data | Educational source identity and repository/license links | `SoftwareSourceCode` JSON-LD on the home page |
| Sitemap | Four primary public routes under `/Asclepius/` | [sitemap.ts](../web/src/app/sitemap.ts) |
| Agent reading maps | Short entry points with source links and scope | [llms.txt](../llms.txt), [public llms.txt](../web/public/llms.txt) |
| Share card | Calm, clearly synthetic social preview | [SVG source](../web/public/social-preview.svg), [PNG](../web/public/social-preview.png) |

The canonical public address is **https://safetymp.github.io/Asclepius/**.
The four primary routes are `/`, `/resources/`, `/validate/`, and `/architecture/`.
Compatibility routes (`/patients/`, `/auth/`, `/cds/`, `/interactions/`) stay usable
for old links but have `noindex, follow` metadata and are omitted from the sitemap.
Query parameters used to restore a sample in the lab canonicalize to the lab page.

Metadata is present in the exported HTML. The main page content is pre-rendered;
interactive journey state still requires JavaScript. The walkthrough provides
both fictional cases and handoff semantics in ordinary linked Markdown.
The share card belongs to the demo's Open Graph and Twitter metadata; GitHub's
repository link preview is separately controlled by GitHub repository settings.

## Indexing limits

A sitemap, canonical hints, structured data, and accurate descriptions make the
project easier to interpret. They do not guarantee indexing, ranking, rich results,
or inclusion in an agent's answer. `llms.txt` is only a supplementary reading map;
Google Search does not use it as a special discovery requirement.

Robots rules apply at an origin's root. This project deploys under `/Asclepius/`
and cannot control `https://safetymp.github.io/robots.txt` from this repository.
There is deliberately no misleading project-subdirectory robots file. If an
owner later configures origin-level robots rules or Search Console, ensure they
allow the project and use
[the deployed sitemap](https://safetymp.github.io/Asclepius/sitemap.xml).
Search Console verification and search-engine indexing are separate external
steps, not outcomes established by a successful deployment.

## Maintenance checks

- Keep the GitHub About description, homepage, and purpose-oriented topics aligned
  with the current scope. Avoid unrelated keywords or clinical capability claims.
- Keep root and web dependency updates covered by [Dependabot](../.github/dependabot.yml).
  Actions use pinned commit references and scoped permissions. Review automated PRs;
  dependency updates are not automatically merged.
- Keep `main` protected by the root gates on Node 22/24/26, the Pages build,
  and CodeQL. Required checks must pass on an up-to-date branch; if workflow job
  names change, update the matching branch-protection check names.
- Keep the private reporting route in [SECURITY.md](../SECURITY.md) enabled. Do not
  put vulnerability details or patient information in public feedback.
- Run `npm run docs:check` for repository-local Markdown destinations. It does not
  check external URLs or heading fragments. Verify external links when changing them.
- Run `npm run gate` and the web verification described in [web/README.md](../web/README.md).
  The discovery browser checks inspect raw HTML, canonical URLs, legacy exclusions,
  structured data, sitemap entries, reading maps, and share assets.
- For publication, check the PR's CI and the deployed `main` commit. The Pages
  workflow tests the real `/Asclepius` path before publishing. Local success alone
  is not proof that a live page changed.
- Retain architecture history and archived assets with their historical labels.
  Records in [.harness](../.harness/README.md) are preserved evidence, not current
  runtime instructions. Optional `npm run oss:scorecard` reports local security
  checks; it does not measure usability, clinical safety, or monetary value.

## Primary guidance

- [GitHub repository best practices](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories): clear community documentation and repository security.
- [GitHub repository topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics): relevant purpose and subject classification.
- [Google's AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): useful content and foundational SEO; no special AI text file required.
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): consistent canonical hints.
- [Google robots.txt scope](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt): origin-root crawler controls.
- [Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) and [static export](https://nextjs.org/docs/app/guides/static-exports): framework implementation.

Guidance reviewed on 14 November 2026. Recheck official documentation when
changing hosting, supported routes, or crawler controls.
