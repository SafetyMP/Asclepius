# A guide to the two synthetic care journeys

The [public study](https://safetymp.github.io/Asclepius/) uses Maya’s authored referral snapshot and hypothetical incoming letters. The teaching core also includes Alex’s routine follow-up. Each fixture set contains nine fictional records. **NOT_FOR_CLINICAL_USE.**

## Alex: a routine follow-up

Alex Morgan visits Willow Teaching Clinic with Jordan Lee on November 12, 2026.
The story explains why a visit and its information are represented as separate,
linked records.

| Stage | Explore | What to notice |
| --- | --- | --- |
| Check-in | Patient, Practitioner, Organization, Encounter | The visit connects the person, participating team member, setting, and time. |
| Assessment | Observation, Condition, AllergyIntolerance | A measurement, a recorded concern, and a reported allergy describe different things. Their references preserve the same person and visit context. |
| Follow-up | DiagnosticReport, MedicationRequest | The report links to its source measurement. The draft medication request illustrates a proposed action; it does not show dispensing or use. |

The source records are in [`web/src/lib/examples.ts`](../web/src/lib/examples.ts).

## Maya: a referral and handoff

Maya Chen’s fictional referral moves from Willow’s referring team, represented by
Sam Rivera, to Cedar’s receiving team, represented by Taylor Brooks. The snapshot
spans November 13–14, 2026 and separates the original visit, the request, the
coordination task, and the planned receiving visit.

| Stage | Owner shown | What to notice |
| --- | --- | --- |
| Referral | Referring team · Willow | The ServiceRequest points to Maya, Sam, and the original visit. Cedar is the intended receiving team. |
| Team review | Receiving team · Cedar | Taylor is associated with the planned receiving visit. Naming a team and a participant does not establish that care occurred. |
| Handoff | Coordination owner · Cedar | The Task records completed coordination and links to the request and planned receiving visit. |

The three statuses have different meanings:

| Record | Snapshot status | Meaning in this example |
| --- | --- | --- |
| ServiceRequest | `active` | The request remains active; the requested service is not recorded as completed. |
| Task | `completed` | Cedar’s coordination task is complete. |
| Receiving Encounter | `planned` | The receiving visit is planned; completed care is not recorded. |

A completed Task is not completed care. The story does not verify real receipt,
clinical appropriateness, or a completed visit. Its organizations, practitioners,
and encounters have distinct identities even when their resource types match.

The source records are in [`web/src/lib/referral-examples.ts`](../web/src/lib/referral-examples.ts).

## Trace the evidence

In the case, open **Inspect the three source records** and choose **Inspect Task** to carry Cedar’s coordination record into the guide. **Trace this report and decision** follows the selected letter, receipt rule and queue entry. Replay the same consultant letter filed to the current or prior request, then check the structure of a copy of the fixture. A structural pass cannot establish clinical correctness, real-world receipt or full FHIR conformance. [Technical evidence](https://safetymp.github.io/Asclepius/workspace/)
