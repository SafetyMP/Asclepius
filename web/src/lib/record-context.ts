import { examples, type ResourceExample } from './examples';
import { recordKey } from './journeys';

export type RecordFact = { label: string; value: string };
export type RecordConnection = {
  example: ResourceExample;
  relationship: string;
  direction: 'outgoing' | 'incoming';
};

type ReferenceLink = { reference: string; field: string };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
const text = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;
const first = (value: unknown): unknown => (Array.isArray(value) ? value[0] : undefined);

function referenceName(value: unknown, records: ResourceExample[]): string | undefined {
  const reference = object(value);
  if (!reference) return undefined;
  const match = records.find((item) => recordKey(item) === reference.reference);
  return match?.title ?? text(reference.display) ?? text(reference.reference);
}

function dateLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
    timeZoneName: 'short',
  }).format(date);
}

/** Present facts from the sample, not a second FHIR model or a clinical interpretation. */
export function recordFacts(
  example: ResourceExample,
  records: ResourceExample[] = examples,
): RecordFact[] {
  const nameOf = (value: unknown) => referenceName(value, records);
  const record = example.resource;
  const facts: RecordFact[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value) facts.push({ label, value });
  };
  if (example.type === 'Patient') {
    add('Person', example.title);
    add('Date of birth', dateLabel(record.birthDate));
    add('Example identifier', text(object(first(record.identifier))?.value));
    add('Care team', nameOf(first(record.generalPractitioner)));
    add('Organization', nameOf(record.managingOrganization));
  } else if (example.type === 'Practitioner') {
    add('Care team member', example.title);
    add('Example identifier', text(object(first(record.identifier))?.value));
    add('Record status', record.active === true ? 'Active in the sample' : 'Not recorded');
  } else if (example.type === 'Organization') {
    add('Organization', text(record.name));
    add('Setting', text(object(first(record.type))?.text));
    add('Record status', record.active === true ? 'Active in the sample' : 'Not recorded');
  } else {
    const statuses: Record<string, string> = {
      finished: 'Completed visit',
      planned: 'Planned visit',
      final: 'Final record',
      draft:
        example.type === 'MedicationRequest'
          ? 'Draft — not an issued prescription'
          : 'Draft request',
      active: example.type === 'ServiceRequest' ? 'Active referral request' : 'Active',
      completed:
        example.type === 'Task' ? 'Coordination completed — not clinical care' : 'Completed',
    };
    const status = text(record.status);
    if (status)
      add(
        example.type === 'Task'
          ? 'Handoff status'
          : example.type === 'ServiceRequest'
            ? 'Referral status'
            : 'Record status',
        statuses[status] ?? status,
      );
    if (example.type === 'AllergyIntolerance')
      add('Verification status', 'Not recorded in this example');
    add('Person', nameOf(record.subject ?? record.patient ?? record.for));
    if (example.type === 'Encounter') {
      add(
        record.status === 'planned' ? 'Planned start' : 'Visit started',
        dateLabel(object(record.period)?.start),
      );
      add(
        record.status === 'planned' ? 'Planned end' : 'Visit ended',
        dateLabel(object(record.period)?.end),
      );
      add('Care team', nameOf(object(first(record.participant))?.individual));
      add('Organization', nameOf(record.serviceProvider));
    } else {
      if (example.type === 'Observation') {
        const quantity = object(record.valueQuantity);
        add(
          'Illustrative measurement',
          typeof quantity?.value === 'number'
            ? `${quantity.value} ${text(quantity.unit) ?? ''}`.trim()
            : undefined,
        );
        add('Measured at', dateLabel(record.effectiveDateTime));
      } else if (example.type === 'DiagnosticReport') {
        add('Report issued', dateLabel(record.issued));
        add('Source measurement', nameOf(first(record.result)));
        add('Report interpreter', nameOf(first(record.resultsInterpreter)));
      } else if (example.type === 'ServiceRequest') {
        add('Requested service', text(object(record.code)?.text));
        add('Created at', dateLabel(record.authoredOn));
        add('Referring team member', nameOf(record.requester));
        add('Receiving team', nameOf(first(record.performer)));
        add('Reason recorded', text(object(first(record.reasonCode))?.text));
      } else if (example.type === 'Task') {
        add('Coordination activity', text(object(record.code)?.text));
        add('Referral', nameOf(record.focus));
        add('Requested by', nameOf(record.requester));
        add('Receiving team responsible', nameOf(record.owner));
        add('Coordination started', dateLabel(object(record.executionPeriod)?.start));
        add('Coordination ended', dateLabel(object(record.executionPeriod)?.end));
        add('Last updated', dateLabel(record.lastModified));
        const output = object(first(record.output));
        add('Linked receiving visit', nameOf(output?.valueReference));
      } else if (example.type === 'MedicationRequest') {
        add('Intent', text(record.intent) === 'proposal' ? 'Proposal only' : text(record.intent));
        add('Created at', dateLabel(record.authoredOn));
        add('Requested by', nameOf(record.requester));
      } else {
        add('Recorded at', dateLabel(record.recordedDate));
        add('Recorded by', nameOf(record.recorder));
      }
      add('Visit', nameOf(record.encounter));
      if (example.type !== 'ServiceRequest') {
        add(
          example.type === 'DiagnosticReport' ? 'Report organization' : 'Performed by',
          nameOf(first(record.performer)),
        );
      }
    }
  }
  return facts;
}

function references(value: unknown, field = '', seen = new WeakSet<object>()): ReferenceLink[] {
  if (!value || typeof value !== 'object' || seen.has(value)) return [];
  seen.add(value);
  const found: ReferenceLink[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (key === 'reference' && typeof child === 'string') found.push({ reference: child, field });
    else found.push(...references(child, field || key, seen));
  }
  return found;
}

const outgoingLabels: Record<string, string> = {
  subject: 'About this person',
  patient: 'About this person',
  for: 'About this person',
  focus: 'Referral coordinated by this task',
  owner: 'Team responsible for this coordination',
  basedOn: 'Request this record follows',
  output: 'Visit linked by this handoff',
  supportingInfo: 'Supporting context for the request',
  encounter: 'Recorded during this visit',
  generalPractitioner: 'Care team member',
  managingOrganization: 'Organization for this person',
  participant: 'Visit participant',
  serviceProvider: 'Organization hosting the visit',
  diagnosis: 'Concern linked to this visit',
  recorder: 'Recorded by',
  performer: 'Performed by',
  requester: 'Requested by',
  resultsInterpreter: 'Report interpreter',
  result: 'Measurement used by this report',
};

function incomingLabel(source: ResourceExample, target: ResourceExample, field: string): string {
  if (field === 'focus' && source.type === 'Task') return 'Handoff coordinating this referral';
  if (field === 'owner') return 'Coordination owned by this team';
  if (field === 'output') return 'Handoff linking to this visit';
  if (field === 'basedOn') return 'Record following this request';
  if (field === 'result') return 'Report using this measurement';
  if (source.type === 'Encounter' && target.type === 'Patient') return 'Visit for this person';
  const nouns: Record<string, string> = {
    Patient: 'Person',
    Encounter: 'Visit',
    Condition: 'Concern',
    Observation: 'Measurement',
    MedicationRequest: 'Draft request',
    AllergyIntolerance: 'Reported allergy',
    DiagnosticReport: 'Report',
    ServiceRequest: 'Referral',
    Task: 'Handoff',
  };
  const noun = nouns[source.type] ?? source.type;
  if (field === 'subject' || field === 'patient' || field === 'for')
    return `${noun} for this person`;
  if (field === 'encounter') return `${noun} from this visit`;
  if (field === 'performer' || field === 'participant')
    return `${noun} involving this team member or organization`;
  if (field === 'recorder') return `${noun} recorded by this team member`;
  if (field === 'requester') return `${noun} proposed by this team member`;
  return `${noun} linked to this record`;
}

/** One-hop links in either direction; never recursively traverse the resource graph. */
export function recordConnections(
  example: ResourceExample,
  records: ResourceExample[] = examples,
): RecordConnection[] {
  const currentId = recordKey(example);
  const result = new Map<string, RecordConnection>();
  for (const link of references(example.resource)) {
    const match = records.find((item) => recordKey(item) === link.reference);
    if (match && recordKey(match) !== currentId && !result.has(recordKey(match)))
      result.set(recordKey(match), {
        example: match,
        relationship:
          example.type === 'ServiceRequest' && link.field === 'performer'
            ? 'Receiving team for this referral'
            : (outgoingLabels[link.field] ?? 'Linked from this record'),
        direction: 'outgoing',
      });
  }
  for (const candidate of records) {
    if (recordKey(candidate) === currentId || result.has(recordKey(candidate))) continue;
    const link = references(candidate.resource).find((item) => item.reference === currentId);
    if (link)
      result.set(recordKey(candidate), {
        example: candidate,
        relationship: incomingLabel(candidate, example, link.field),
        direction: 'incoming',
      });
  }
  return [...result.values()];
}

/** Priority links from the actual one-hop graph, never a second handoff model. */
export function recordHandoffLinks(
  example: ResourceExample,
  records: ResourceExample[] = examples,
): { example: ResourceExample; label: string }[] {
  if (
    example.type !== 'ServiceRequest' &&
    example.type !== 'Task' &&
    !(example.type === 'Encounter' && example.resource.status === 'planned')
  )
    return [];
  const priorities = [
    { type: 'ServiceRequest', label: 'Open referral request' },
    { type: 'Task', label: 'Open handoff record' },
    { type: 'Encounter', label: 'Open planned receiving visit' },
  ];
  const connections = recordConnections(example, records);
  return priorities.flatMap(({ type, label }) =>
    connections
      .filter(
        ({ example: linked }) =>
          linked.type === type && (type !== 'Encounter' || linked.resource.status === 'planned'),
      )
      .map(({ example: linked }) => ({ example: linked, label })),
  );
}
