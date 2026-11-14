import { examples, type ResourceExample } from './examples';

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

function referenceName(value: unknown): string | undefined {
  const reference = object(value);
  if (!reference) return undefined;
  const match = examples.find(
    (item) => `${item.type}/${String(item.resource.id)}` === reference.reference,
  );
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
export function recordFacts(example: ResourceExample): RecordFact[] {
  const record = example.resource;
  const facts: RecordFact[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value) facts.push({ label, value });
  };
  if (example.type === 'Patient') {
    add('Person', example.title);
    add('Date of birth', dateLabel(record.birthDate));
    add('Example identifier', text(object(first(record.identifier))?.value));
    add('Care team', referenceName(first(record.generalPractitioner)));
    add('Organization', referenceName(record.managingOrganization));
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
      final: 'Final record',
      draft: 'Draft — not an issued prescription',
    };
    const status = text(record.status);
    if (status) add('Record status', statuses[status] ?? status);
    if (example.type === 'AllergyIntolerance')
      add('Verification status', 'Not recorded in this example');
    add('Person', referenceName(record.subject ?? record.patient));
    if (example.type === 'Encounter') {
      add('Visit started', dateLabel(object(record.period)?.start));
      add('Visit ended', dateLabel(object(record.period)?.end));
      add('Care team', referenceName(object(first(record.participant))?.individual));
      add('Organization', referenceName(record.serviceProvider));
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
        add('Source measurement', referenceName(first(record.result)));
        add('Report interpreter', referenceName(first(record.resultsInterpreter)));
      } else if (example.type === 'MedicationRequest') {
        add('Intent', text(record.intent) === 'proposal' ? 'Proposal only' : text(record.intent));
        add('Created at', dateLabel(record.authoredOn));
        add('Requested by', referenceName(record.requester));
      } else {
        add('Recorded at', dateLabel(record.recordedDate));
        add('Recorded by', referenceName(record.recorder));
      }
      add('Visit', referenceName(record.encounter));
      add(
        example.type === 'DiagnosticReport' ? 'Report organization' : 'Performed by',
        referenceName(first(record.performer)),
      );
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
  };
  const noun = nouns[source.type] ?? source.type;
  if (field === 'subject' || field === 'patient') return `${noun} for this person`;
  if (field === 'encounter') return `${noun} from this visit`;
  if (field === 'performer' || field === 'participant')
    return `${noun} involving this team member or organization`;
  if (field === 'recorder') return `${noun} recorded by this team member`;
  if (field === 'requester') return `${noun} proposed by this team member`;
  return `${noun} linked to this record`;
}

/** One-hop links in either direction; never recursively traverse the resource graph. */
export function recordConnections(example: ResourceExample): RecordConnection[] {
  const currentId = `${example.type}/${String(example.resource.id)}`;
  const result = new Map<string, RecordConnection>();
  for (const link of references(example.resource)) {
    const match = examples.find(
      (item) => `${item.type}/${String(item.resource.id)}` === link.reference,
    );
    if (match && match !== example && !result.has(match.type))
      result.set(match.type, {
        example: match,
        relationship: outgoingLabels[link.field] ?? 'Linked from this record',
        direction: 'outgoing',
      });
  }
  for (const candidate of examples) {
    if (candidate === example || result.has(candidate.type)) continue;
    const link = references(candidate.resource).find((item) => item.reference === currentId);
    if (link)
      result.set(candidate.type, {
        example: candidate,
        relationship: incomingLabel(candidate, example, link.field),
        direction: 'incoming',
      });
  }
  return [...result.values()];
}
