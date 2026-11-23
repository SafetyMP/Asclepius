# Interface assets

All captures use synthetic examples. **NOT_FOR_CLINICAL_USE.**

## Current interface

| File | Purpose |
| --- | --- |
| [referral-study.jpg](referral-study.jpg) | Maya’s opening story and the Willow–Cedar handoff |
| [referral-trace.jpg](referral-trace.jpg) | Selected letter and the queue entry carried into the technical guide |

The prior desk and journey images are historical captures. These synthetic images document interface state only.

## Historical console assets

These files preserve the former clinical-console presentation. They are not
screenshots of the current interface and are no longer displayed as its demo.

| File | Historical content |
| --- | --- |
| [`demo.gif`](demo.gif) | Former overview, patients, interactions, and CDS sequence |
| [`overview.png`](overview.png) | Former dashboard and workflow index |
| [`patients.png`](patients.png) | Former Patient search controls |
| [`interactions.png`](interactions.png) | Former drug-interaction API controls |
| [`cds.png`](cds.png) | Former CDS API controls |
| [`validate.png`](validate.png) | Former validation page |

## Refresh current screenshots

The [`capture-screenshots.mjs`](../../web/scripts/capture-screenshots.mjs) script
captures the selected referral review and its technical filing replay as JPEGs.
It does not regenerate the historical PNGs or GIF.

```bash
# From web/, after installing dependencies
npm run build
npm run start
# In a second terminal, also from web/
npx playwright install chromium
npm run screenshots
```

For a Pages-subpath preview, set `SCREENSHOT_BASE_URL` to the served URL including
`/Asclepius/`. Set `SCREENSHOT_OUTPUT_DIR` to a temporary review directory to
inspect captures before replacing tracked assets. Review the rendered images;
a successful capture alone does not establish visual quality.
