/**
 * One fictional visit, represented as nine connected teaching resources.
 * NOT_FOR_CLINICAL_USE: no real people, clinical advice, or terminology claims.
 */
export type ResourceExample = {
  type: string;
  title: string;
  description: string;
  lesson: string;
  resource: Record<string, unknown>;
};

export const examples: ResourceExample[] = [
  {
    type: 'Patient',
    title: 'Alex Morgan',
    description: 'The fictional person at the center of this visit.',
    lesson:
      'Other records point to Patient/demo-alex so information stays connected to the same person.',
    resource: {
      resourceType: 'Patient',
      id: 'demo-alex',
      identifier: [{ system: 'https://example.org/asclepius/patients', value: 'SYNTHETIC-001' }],
      active: true,
      name: [{ use: 'usual', family: 'Morgan', given: ['Alex'] }],
      gender: 'unknown',
      birthDate: '1988-04-12',
      generalPractitioner: [
        { reference: 'Practitioner/demo-practitioner', display: 'Jordan Lee (fictional)' },
      ],
      managingOrganization: {
        reference: 'Organization/demo-clinic',
        display: 'Willow Teaching Clinic (fictional)',
      },
    },
  },
  {
    type: 'Practitioner',
    title: 'Jordan Lee',
    description: 'A fictional member of the care team.',
    lesson:
      'Practitioner identifies who participated. A reference connects the person to the visit without repeating their details.',
    resource: {
      resourceType: 'Practitioner',
      id: 'demo-practitioner',
      active: true,
      name: [{ family: 'Lee', given: ['Jordan'] }],
      identifier: [{ system: 'https://example.org/asclepius/team', value: 'SYNTHETIC-TEAM-01' }],
    },
  },
  {
    type: 'Organization',
    title: 'Willow Teaching Clinic',
    description: 'The fictional organization hosting the visit.',
    lesson:
      'Organization represents the care setting. Both the patient and encounter can reference the same organization.',
    resource: {
      resourceType: 'Organization',
      id: 'demo-clinic',
      active: true,
      name: 'Willow Teaching Clinic (fictional)',
      type: [{ text: 'Synthetic teaching organization' }],
    },
  },
  {
    type: 'Encounter',
    title: 'A routine follow-up',
    description: 'A completed fictional visit on November 12, 2026.',
    lesson:
      'Encounter brings the patient, care team, organization, and time together. Related records use this visit as their context.',
    resource: {
      resourceType: 'Encounter',
      id: 'demo-visit',
      status: 'finished',
      class: {
        system: 'https://example.org/asclepius/visit-classes',
        code: 'teaching-visit',
        display: 'Synthetic teaching visit',
      },
      subject: { reference: 'Patient/demo-alex', display: 'Alex Morgan (fictional)' },
      participant: [
        {
          individual: {
            reference: 'Practitioner/demo-practitioner',
            display: 'Jordan Lee (fictional)',
          },
        },
      ],
      period: { start: '2026-11-12T09:00:00-06:00', end: '2026-11-12T09:30:00-06:00' },
      reasonCode: [{ text: 'Routine follow-up — fictional scenario' }],
      diagnosis: [{ condition: { reference: 'Condition/demo-condition' } }],
      serviceProvider: { reference: 'Organization/demo-clinic' },
    },
  },
  {
    type: 'Condition',
    title: 'Recorded concern',
    description: 'An example concern recorded during the visit.',
    lesson:
      'Condition records a concern separately from a measurement. Its subject and encounter references preserve the context.',
    resource: {
      resourceType: 'Condition',
      id: 'demo-condition',
      code: { text: 'Example concern for follow-up — fictional, not a diagnosis' },
      subject: { reference: 'Patient/demo-alex' },
      encounter: { reference: 'Encounter/demo-visit' },
      recordedDate: '2026-11-12T09:10:00-06:00',
      recorder: { reference: 'Practitioner/demo-practitioner' },
      note: [
        {
          text: 'Synthetic teaching record. No diagnosis or treatment recommendation is provided.',
        },
      ],
    },
  },
  {
    type: 'Observation',
    title: 'Temperature measurement',
    description: 'An illustrative measurement of 36.8 °C, without clinical interpretation.',
    lesson:
      'Observation separates what was measured, its value, units, and time. This example uses a demonstration code system, not verified terminology.',
    resource: {
      resourceType: 'Observation',
      id: 'demo-observation',
      status: 'final',
      code: {
        coding: [
          {
            system: 'https://example.org/asclepius/observations',
            code: 'temperature-demo',
            display: 'Temperature (synthetic example)',
          },
        ],
      },
      subject: { reference: 'Patient/demo-alex' },
      encounter: { reference: 'Encounter/demo-visit' },
      effectiveDateTime: '2026-11-12T09:05:00-06:00',
      performer: [{ reference: 'Practitioner/demo-practitioner' }],
      valueQuantity: { value: 36.8, unit: '°C' },
      note: [{ text: 'Illustrative value only. This demo does not interpret measurements.' }],
    },
  },
  {
    type: 'MedicationRequest',
    title: 'Draft request example',
    description: 'A placeholder request that demonstrates record structure.',
    lesson:
      'A draft MedicationRequest shows an intended action, not proof that a medicine was dispensed or taken. This fictional placeholder has no dose or clinical recommendation.',
    resource: {
      resourceType: 'MedicationRequest',
      id: 'demo-medication',
      status: 'draft',
      intent: 'proposal',
      medicationCodeableConcept: {
        text: 'Fictional teaching placeholder — not a clinical product',
      },
      subject: { reference: 'Patient/demo-alex' },
      encounter: { reference: 'Encounter/demo-visit' },
      authoredOn: '2026-11-12T09:15:00-06:00',
      requester: { reference: 'Practitioner/demo-practitioner' },
      note: [
        {
          text: 'NOT_FOR_CLINICAL_USE. Demonstrates a draft resource only; no prescribing or interaction assessment.',
        },
      ],
    },
  },
  {
    type: 'AllergyIntolerance',
    title: 'Reported allergy example',
    description: 'A fictional reported substance sensitivity.',
    lesson:
      'AllergyIntolerance is a separate record with its own context. Its presence here does not mean this demo has checked medicines for safety.',
    resource: {
      resourceType: 'AllergyIntolerance',
      id: 'demo-allergy',
      code: { text: 'Fictional demonstration substance' },
      patient: { reference: 'Patient/demo-alex' },
      encounter: { reference: 'Encounter/demo-visit' },
      recordedDate: '2026-11-12T09:08:00-06:00',
      recorder: { reference: 'Practitioner/demo-practitioner' },
      note: [
        {
          text: 'Synthetic record only. The teaching drug-interaction knowledge base is intentionally incomplete.',
        },
      ],
    },
  },
  {
    type: 'DiagnosticReport',
    title: 'Visit measurement summary',
    description: 'An example report linking back to the underlying measurement.',
    lesson:
      'A report references the Observation instead of copying its value. Follow result to see the original measurement and its context.',
    resource: {
      resourceType: 'DiagnosticReport',
      id: 'demo-report',
      status: 'final',
      code: { text: 'Synthetic visit measurement summary' },
      subject: { reference: 'Patient/demo-alex' },
      encounter: { reference: 'Encounter/demo-visit' },
      effectiveDateTime: '2026-11-12T09:05:00-06:00',
      issued: '2026-11-12T09:20:00-06:00',
      performer: [{ reference: 'Organization/demo-clinic' }],
      resultsInterpreter: [{ reference: 'Practitioner/demo-practitioner' }],
      result: [{ reference: 'Observation/demo-observation' }],
      conclusion: 'Teaching example only. No clinical interpretation is provided.',
    },
  },
];
