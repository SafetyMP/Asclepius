import type { ResourceExample } from './examples';

/**
 * A fixed fictional referral and coordination handoff, not a live workflow.
 * NOT_FOR_CLINICAL_USE: no actual referral, care decision, or delivery claim.
 */
export const referralExamples: ResourceExample[] = [
  {
    type: 'Patient',
    title: 'Maya Chen',
    description: 'The fictional person whose context follows the referral between teams.',
    lesson:
      'Both teams refer to the same patient record. A handoff changes who coordinates the next step, not the identity of the person.',
    resource: {
      resourceType: 'Patient',
      id: 'referral-maya',
      identifier: [{ system: 'https://example.org/asclepius/patients', value: 'SYNTHETIC-002' }],
      active: true,
      name: [{ use: 'usual', family: 'Chen', given: ['Maya'] }],
      gender: 'unknown',
      birthDate: '1991-08-19',
      generalPractitioner: [{ reference: 'Practitioner/referral-sam' }],
      managingOrganization: { reference: 'Organization/referral-willow' },
    },
  },
  {
    type: 'Practitioner',
    title: 'Sam Rivera · Referring team',
    description: 'The fictional team member who prepares the request at Willow.',
    lesson:
      'The requester identifies who initiated the referral. That role remains visible after the receiving team takes ownership of coordination.',
    resource: {
      resourceType: 'Practitioner',
      id: 'referral-sam',
      active: true,
      name: [{ family: 'Rivera', given: ['Sam'] }],
      identifier: [{ system: 'https://example.org/asclepius/team', value: 'SYNTHETIC-TEAM-02' }],
    },
  },
  {
    type: 'Practitioner',
    title: 'Taylor Brooks · Receiving team',
    description: 'The fictional team member attached to the planned receiving visit.',
    lesson:
      'A planned participant names the receiving team member in this example. It does not show that a visit or clinical review has already taken place.',
    resource: {
      resourceType: 'Practitioner',
      id: 'referral-taylor',
      active: true,
      name: [{ family: 'Brooks', given: ['Taylor'] }],
      identifier: [{ system: 'https://example.org/asclepius/team', value: 'SYNTHETIC-TEAM-03' }],
    },
  },
  {
    type: 'Organization',
    title: 'Willow Teaching Clinic · Referring team',
    description: 'The fictional clinic that sends the request and provides its original context.',
    lesson:
      'The referring organization remains connected through the original visit. Its role is distinct from the receiving team that owns the coordination task.',
    resource: {
      resourceType: 'Organization',
      id: 'referral-willow',
      active: true,
      name: 'Willow Teaching Clinic (fictional)',
      type: [{ text: 'Fictional referring organization' }],
    },
  },
  {
    type: 'Organization',
    title: 'Cedar Teaching Team · Receiving team',
    description: 'The fictional receiving team named on the request and handoff task.',
    lesson:
      'The ServiceRequest names Cedar as the intended performer. The Task names Cedar as the owner of coordination. These are related but separate roles.',
    resource: {
      resourceType: 'Organization',
      id: 'referral-cedar',
      active: true,
      name: 'Cedar Teaching Team (fictional)',
      type: [{ text: 'Fictional receiving organization' }],
    },
  },
  {
    type: 'Encounter',
    title: 'Referring visit at Willow',
    description: 'The completed fictional visit that provides context for the referral.',
    lesson:
      'The original visit records who, where, and when. The referral points back to this visit so the receiving team can trace its origin.',
    resource: {
      resourceType: 'Encounter',
      id: 'referral-origin-visit',
      status: 'finished',
      class: {
        system: 'https://example.org/asclepius/visit-classes',
        code: 'teaching-visit',
        display: 'Synthetic teaching visit',
      },
      subject: { reference: 'Patient/referral-maya' },
      participant: [{ individual: { reference: 'Practitioner/referral-sam' } }],
      period: { start: '2026-11-13T09:00:00-06:00', end: '2026-11-13T09:30:00-06:00' },
      reasonCode: [{ text: 'Fictional care coordination discussion — no clinical recommendation' }],
      serviceProvider: { reference: 'Organization/referral-willow' },
    },
  },
  {
    type: 'Encounter',
    title: 'Planned receiving visit at Cedar',
    description: 'The next fictional visit is planned; no completed care is recorded.',
    lesson:
      'The planned visit links to the referral through basedOn. A completed coordination task is not evidence that this visit happened or that care was delivered.',
    resource: {
      resourceType: 'Encounter',
      id: 'referral-receiving-visit',
      status: 'planned',
      class: {
        system: 'https://example.org/asclepius/visit-classes',
        code: 'teaching-visit',
        display: 'Synthetic teaching visit',
      },
      subject: { reference: 'Patient/referral-maya' },
      basedOn: [{ reference: 'ServiceRequest/referral-request' }],
      participant: [{ individual: { reference: 'Practitioner/referral-taylor' } }],
      period: { start: '2026-11-14T14:00:00-06:00', end: '2026-11-14T14:30:00-06:00' },
      reasonCode: [{ text: 'Planned fictional review following a referral' }],
      serviceProvider: { reference: 'Organization/referral-cedar' },
    },
  },
  {
    type: 'ServiceRequest',
    title: 'Referral to Cedar',
    description:
      'An active fictional request connecting Maya, the referring visit, and the receiving team.',
    lesson:
      'ServiceRequest records what was requested and by whom. An active request is not proof of delivery; the coordination task and planned visit describe different parts of the handoff.',
    resource: {
      resourceType: 'ServiceRequest',
      id: 'referral-request',
      status: 'active',
      intent: 'order',
      code: { text: 'Fictional review request — teaching coordination example' },
      subject: { reference: 'Patient/referral-maya' },
      encounter: { reference: 'Encounter/referral-origin-visit' },
      authoredOn: '2026-11-13T09:20:00-06:00',
      requester: { reference: 'Practitioner/referral-sam' },
      performer: [{ reference: 'Organization/referral-cedar' }],
      reasonCode: [{ text: 'Demonstrate information continuity between fictional teams' }],
      supportingInfo: [{ reference: 'Encounter/referral-origin-visit' }],
      note: [
        { text: 'NOT_FOR_CLINICAL_USE. Synthetic request only; no referral is sent by this demo.' },
      ],
    },
  },
  {
    type: 'Task',
    title: 'Coordination handoff to Cedar',
    description:
      'The fictional coordination task is completed; the receiving visit remains planned.',
    lesson:
      'Task separates workflow ownership from the service request. Completed means this coordination step was recorded as finished—not that the referral service or clinical care was completed.',
    resource: {
      resourceType: 'Task',
      id: 'referral-handoff',
      status: 'completed',
      intent: 'order',
      code: { text: 'Coordinate a fictional referral handoff' },
      businessStatus: { text: 'Receiving-team coordination recorded' },
      focus: { reference: 'ServiceRequest/referral-request' },
      for: { reference: 'Patient/referral-maya' },
      encounter: { reference: 'Encounter/referral-origin-visit' },
      authoredOn: '2026-11-13T09:25:00-06:00',
      lastModified: '2026-11-14T10:15:00-06:00',
      requester: { reference: 'Practitioner/referral-sam' },
      owner: { reference: 'Organization/referral-cedar' },
      executionPeriod: { start: '2026-11-14T10:00:00-06:00', end: '2026-11-14T10:15:00-06:00' },
      output: [
        {
          type: { text: 'Planned receiving visit' },
          valueReference: { reference: 'Encounter/referral-receiving-visit' },
        },
      ],
      note: [
        {
          text: 'NOT_FOR_CLINICAL_USE. Fixed fictional snapshot: Cedar coordination is recorded, the request remains active, and the receiving visit is planned. No actual transfer or care delivery occurred.',
        },
      ],
    },
  },
];
