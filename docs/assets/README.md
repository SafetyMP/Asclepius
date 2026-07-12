# Repository assets

Visual assets for README and GitHub social preview. Synthetic demo data only — no real patient data.

| File | Purpose |
|------|---------|
| [`demo.gif`](demo.gif) | README hero — overview, patients, drug interactions, CDS (4 frames, 2s each). Regenerate with `cd web && npm run screenshots`. |
| [`overview.png`](overview.png) | Dashboard / workflow index |
| [`patients.png`](patients.png) | FHIR Patient search |
| [`interactions.png`](interactions.png) | MedicationRequest drug interaction check |
| [`cds.png`](cds.png) | Clinical decision support cards |
| [`validate.png`](validate.png) | Resource validation via `$validate` |

Regenerate when the clinical console layout changes materially:

```bash
npm run dev                   # API on http://127.0.0.1:8787 (optional for static UI capture)
cd web && npm ci && npm run build && npm run start
cd web && npm run screenshots # or npm run screenshots:rebuild-gif from existing PNGs
```
