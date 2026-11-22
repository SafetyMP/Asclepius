# A guide to the two synthetic care journeys

[Open the care journeys](https://safetymp.github.io/Asclepius/journeys/) and choose a journey at the
top of the workspace. Both cases are fictional teaching snapshots, with nine
connected records each. **NOT_FOR_CLINICAL_USE.** No navigation action sends a
referral, changes a care status, or performs treatment.

## Alex: a routine follow-up

Alex Morgan visits Willow Teaching Clinic with Jordan Lee on November 12, 2026.
The story explains why a visit and its information are represented as separate,
linked records.

| Stage | Explore | What to notice |
| --- | --- | --- |
| Check-in | Patient, Practitioner, Organization, Encounter | The visit connects the person, participating team member, setting, and time. |
| Assessment | Observation, Condition, AllergyIntolerance | A measurement, a recorded concern, and a reported allergy describe different things. Their references preserve the same person and visit context. |
| Follow-up | DiagnosticReport, MedicationRequest | The report links to its source measurement. The draft medication request illustrates a proposed action; it does not show dispensing or use. |

At **Follow-up**, choose **Explore the report**. Open its linked measurement and
follow the connection back to the visit. The example values illustrate record
structure and are not clinically interpreted.

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

At **Handoff**, choose **Explore the handoff**. The inspector’s **Follow this
handoff** links lead to **Open referral request**, **Open handoff record**, and
**Open planned receiving visit** when they are relevant to the open record.
Use the inspector’s back control to retrace an explored connection.

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

## Switch cases without losing your place

Choose **A routine follow-up** or **A referral and handoff** in the journey picker.
Each case retains its stage, explored records, and explorer search during the
session. The picker shows the remembered stage for each case. Refreshing starts a
new session.

The **Resource explorer** sidebar entry resumes the selected case’s exploration.
**View all** from a journey clears its prior explorer filter and selection so all
nine records are visible. Connections stay within the chosen case; switching
journeys does not mix Alex’s and Maya’s records.

## Try the validation lab

Open validation from a record to carry that exact record and case into the lab.
Run the check, try the missing-identity exercise, then repair the sample. Advanced
JSON editing is optional. The return link restores the originating record context;
practice edits do not change the journey and are discarded when leaving the lab.

Passing means passing the applicable checks in the repository’s teaching subset:
eleven hand-authored Zod schemas and three teaching rules. It does not establish full FHIR conformance, valid terminology,
reference existence, clinical correctness, or treatment safety. Task inputs and
outputs in this subset support references and strings only.

For implementation details, use the [source map](README.md#source-map),
[web guide](../web/README.md), and [project scope](PROJECT.md).
