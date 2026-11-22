# Project vision and scope

Asclepius — **Connected care, explained** — is an educational workspace for
healthcare stakeholders exploring synthetic workflows. It makes the relationship
between a person, a care team, a visit, and its records visible before introducing
technical detail. Developers can then inspect the same examples and shared
validation code.

**NOT_FOR_CLINICAL_USE.** All cases, people, and organizations are fictional.
Do not enter real patient data or use these examples to make clinical decisions.

## The experience we are building

The [public study](https://safetymp.github.io/Asclepius/) asks whether Willow can record a returned report for Maya’s referral. The coordinator decides, the analyst cites the exact request, and the education lead compares training approaches using paired accuracy measures, staff time and a delayed retest.

The technical route carries the chosen document, queue decision, citation and pilot assumptions. It links the original request, coordination and receiving visit to the underlying fixture and checks a local copy with the shared teaching validator. Earlier public technical bookmarks resolve to that same compact evidence.

The separate local TypeScript core provides the Zod schemas, Hono API, persistence, auth, search, audit and educational rule examples. Browser interactions stay in memory and do not call clinical systems.

## Boundaries

- Passing validation means passing the authored teaching subset. It does not prove
  full FHIR conformance, terminology validity, reference existence, or clinical correctness.
- A completed coordination Task does not mean that a referral’s requested service
  or receiving visit was completed. Maya’s request remains active and her receiving
  visit remains planned.
- The DDI knowledge base is intentionally incomplete. A missing interaction match
  is not a safety judgment.
- The project is not a clinical workstation, production FHIR server, certified
  medical device, or system for real patient data. It has no live EHR or pharmacy connection.
- Existing architecture and safety markers remain part of the product contract.
  Adding a feature does not authorize expansion into real clinical use.

## How we evaluate changes

A change should make a stakeholder’s question easier to answer, keep record
identity and ownership unambiguous, and preserve keyboard and mobile use. The
root gate checks the teaching core. Browser tests check the journeys, validation,
accessibility, and static deployment paths. Independent review checks whether
copy and behavior match the intended scope.

These checks provide implementation evidence. The design hypotheses—easier
orientation, clearer record relationships, and less setup friction—still need
observation with intended users before being described as measured improvements.

## Priorities for future contributions

These are areas for discussion, not promised releases:

1. Observe intended stakeholders using the referral study and document where their
   interpretation differs from the intended learning outcome.
2. Improve explanations, navigation, and accessibility where evidence shows friction.
3. Keep documentation, metadata, and agent instructions aligned with the actual demo.
4. Extend synthetic journeys or the teaching subset only when the learning question,
   limitations, and verification approach are clear.

Start a scoped proposal using the [contribution guide](../CONTRIBUTING.md). Include
who benefits, the question they need to answer, and how a reviewer can verify the
result. The [design history](DESIGN-PIVOT.md) and [architecture records](adr/README.md)
explain the decisions this scope preserves.
