# Interface assets

All captures use synthetic examples. **NOT_FOR_CLINICAL_USE.**

## Current interface

| File | Purpose |
| --- | --- |
| [`referral-desk.png`](referral-desk.png) | Current README image: Willow’s correspondence desk and two synthetic referral registers |
| [`care-journey.jpg`](care-journey.jpg) | Alex’s routine follow-up and contextual record exploration |
| [`referral-handoff.jpg`](referral-handoff.jpg) | Current README image: Maya’s referral, coordination task, and planned receiving visit |

Current images should be captured from the built static interface after its
layout has been reviewed. It demonstrates the rendered interface only; it is
not evidence of user engagement, clinical validity, or a live Pages deployment.

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
captures the current routine journey and the referral handoff inspector as JPEGs.
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
