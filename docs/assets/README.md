# Interface assets

All captures use synthetic examples. **NOT_FOR_CLINICAL_USE.**

## Current interface

| File | Purpose |
| --- | --- |
| [`care-journey.jpg`](care-journey.jpg) | Current README image: synthetic care journey and contextual record exploration |

The current image should be captured from the built static interface after its
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

The retained `web/scripts/capture-screenshots.mjs` script targets the old
console route sequence. Do not use it to overwrite historical captures or
regenerate the current README image until its capture plan is updated.
