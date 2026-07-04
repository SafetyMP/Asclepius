import type { ResourceType } from '@/domain/fhir';
import type { ParamDefinition } from './types';

/**
 * FHIR search-parameter registry: param name → definition (type + declarative
 * extraction paths) per resource type. The planner resolves raw params against
 * this; the executor (layer 4) walks the paths to extract candidate values.
 *
 * This is a pragmatic subset of the FHIR search params (ADR 0006) — the common,
 * clinically-useful params for each supported resource. Composite params
 * (e.g. `code-value-quantity`) and subsumption (`:above`/`:below` on token) are
 * noted as stretch.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Common params present on every resource (and a few on all DomainResources)
// ─────────────────────────────────────────────────────────────────────────────
const COMMON: Record<string, ParamDefinition> = {
  _id: { name: '_id', type: 'token', paths: [['id']] },
  _lastUpdated: {
    name: '_lastUpdated',
    type: 'date',
    paths: [['meta', 'lastUpdated']],
  },
  _tag: {
    name: '_tag',
    type: 'token',
    paths: [
      ['meta', 'tag', 'code'],
      ['meta', 'tag', 'system'],
    ],
  },
  _profile: { name: '_profile', type: 'uri', paths: [['meta', 'profile']] },
  _security: {
    name: '_security',
    type: 'token',
    paths: [['meta', 'security', 'code']],
  },
  _type: { name: '_type', type: 'token', paths: [['resourceType']] },
  identifier: {
    name: 'identifier',
    type: 'token',
    paths: [
      ['identifier', 'value'],
      ['identifier', 'system'],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-resource params
// ─────────────────────────────────────────────────────────────────────────────
const PATIENT: Record<string, ParamDefinition> = {
  name: {
    name: 'name',
    type: 'string',
    paths: [
      ['name', 'family'],
      ['name', 'given'],
      ['name', 'text'],
      ['name', 'prefix'],
      ['name', 'suffix'],
    ],
  },
  family: { name: 'family', type: 'string', paths: [['name', 'family']] },
  given: { name: 'given', type: 'string', paths: [['name', 'given']] },
  birthdate: { name: 'birthdate', type: 'date', paths: [['birthDate']] },
  gender: { name: 'gender', type: 'token', paths: [['gender']] },
  active: { name: 'active', type: 'token', paths: [['active']] },
  address: {
    name: 'address',
    type: 'string',
    paths: [
      ['address', 'line'],
      ['address', 'city'],
      ['address', 'state'],
      ['address', 'postalCode'],
      ['address', 'country'],
      ['address', 'text'],
    ],
  },
  telecom: { name: 'telecom', type: 'string', paths: [['telecom', 'value']] },
  email: { name: 'email', type: 'token', paths: [['telecom', 'value']] },
  phone: { name: 'phone', type: 'token', paths: [['telecom', 'value']] },
  organization: {
    name: 'organization',
    type: 'reference',
    paths: [['managingOrganization', 'reference']],
  },
  'general-practitioner': {
    name: 'general-practitioner',
    type: 'reference',
    paths: [['generalPractitioner', 'reference']],
  },
};

const PRACTITIONER: Record<string, ParamDefinition> = {
  name: {
    name: 'name',
    type: 'string',
    paths: [
      ['name', 'family'],
      ['name', 'given'],
      ['name', 'text'],
    ],
  },
  family: { name: 'family', type: 'string', paths: [['name', 'family']] },
  given: { name: 'given', type: 'string', paths: [['name', 'given']] },
  active: { name: 'active', type: 'token', paths: [['active']] },
  address: {
    name: 'address',
    type: 'string',
    paths: [
      ['address', 'line'],
      ['address', 'city'],
      ['address', 'state'],
    ],
  },
  telecom: { name: 'telecom', type: 'string', paths: [['telecom', 'value']] },
};

const ORGANIZATION: Record<string, ParamDefinition> = {
  name: { name: 'name', type: 'string', paths: [['name']] },
  active: { name: 'active', type: 'token', paths: [['active']] },
  type: { name: 'type', type: 'token', paths: [['type', 'coding', 'code']] },
  address: {
    name: 'address',
    type: 'string',
    paths: [
      ['address', 'line'],
      ['address', 'city'],
      ['address', 'state'],
    ],
  },
  partof: {
    name: 'partof',
    type: 'reference',
    paths: [['partOf', 'reference']],
  },
};

const CONDITION: Record<string, ParamDefinition> = {
  patient: {
    name: 'patient',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  subject: {
    name: 'subject',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  encounter: {
    name: 'encounter',
    type: 'reference',
    paths: [['encounter', 'reference']],
  },
  code: {
    name: 'code',
    type: 'token',
    paths: [
      ['code', 'coding', 'code'],
      ['code', 'text'],
    ],
  },
  'clinical-status': {
    name: 'clinical-status',
    type: 'token',
    paths: [['clinicalStatus', 'coding', 'code']],
  },
  'verification-status': {
    name: 'verification-status',
    type: 'token',
    paths: [['verificationStatus', 'coding', 'code']],
  },
  category: {
    name: 'category',
    type: 'token',
    paths: [['category', 'coding', 'code']],
  },
  severity: {
    name: 'severity',
    type: 'token',
    paths: [['severity', 'coding', 'code']],
  },
  'onset-date': {
    name: 'onset-date',
    type: 'date',
    paths: [['onsetDateTime']],
  },
  'recorded-date': {
    name: 'recorded-date',
    type: 'date',
    paths: [['recordedDate']],
  },
  asserter: {
    name: 'asserter',
    type: 'reference',
    paths: [['asserter', 'reference']],
  },
  recorder: {
    name: 'recorder',
    type: 'reference',
    paths: [['recorder', 'reference']],
  },
};

const OBSERVATION: Record<string, ParamDefinition> = {
  patient: {
    name: 'patient',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  subject: {
    name: 'subject',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  encounter: {
    name: 'encounter',
    type: 'reference',
    paths: [['encounter', 'reference']],
  },
  code: {
    name: 'code',
    type: 'token',
    paths: [
      ['code', 'coding', 'code'],
      ['code', 'text'],
    ],
  },
  date: {
    name: 'date',
    type: 'date',
    paths: [['effectiveDateTime'], ['effectivePeriod', 'start'], ['effectivePeriod', 'end']],
  },
  status: { name: 'status', type: 'token', paths: [['status']] },
  category: {
    name: 'category',
    type: 'token',
    paths: [['category', 'coding', 'code']],
  },
  performer: {
    name: 'performer',
    type: 'reference',
    paths: [['performer', 'reference']],
  },
  specimen: {
    name: 'specimen',
    type: 'reference',
    paths: [['specimen', 'reference']],
  },
};

const MEDICATION_REQUEST: Record<string, ParamDefinition> = {
  patient: {
    name: 'patient',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  subject: {
    name: 'subject',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  encounter: {
    name: 'encounter',
    type: 'reference',
    paths: [['encounter', 'reference']],
  },
  code: {
    name: 'code',
    type: 'token',
    paths: [
      ['medicationCodeableConcept', 'coding', 'code'],
      ['medicationCodeableConcept', 'text'],
    ],
  },
  medication: {
    name: 'medication',
    type: 'reference',
    paths: [['medicationReference', 'reference']],
  },
  status: { name: 'status', type: 'token', paths: [['status']] },
  intent: { name: 'intent', type: 'token', paths: [['intent']] },
  category: {
    name: 'category',
    type: 'token',
    paths: [['category', 'coding', 'code']],
  },
  priority: { name: 'priority', type: 'token', paths: [['priority']] },
  authoredon: { name: 'authoredon', type: 'date', paths: [['authoredOn']] },
  requester: {
    name: 'requester',
    type: 'reference',
    paths: [['requester', 'reference']],
  },
};

const ALLERGY_INTOLERANCE: Record<string, ParamDefinition> = {
  patient: {
    name: 'patient',
    type: 'reference',
    paths: [['patient', 'reference']],
  },
  encounter: {
    name: 'encounter',
    type: 'reference',
    paths: [['encounter', 'reference']],
  },
  code: {
    name: 'code',
    type: 'token',
    paths: [
      ['code', 'coding', 'code'],
      ['reaction', 'substance', 'coding', 'code'],
      ['code', 'text'],
    ],
  },
  substance: {
    name: 'substance',
    type: 'token',
    paths: [
      ['code', 'coding', 'code'],
      ['reaction', 'substance', 'coding', 'code'],
    ],
  },
  'clinical-status': {
    name: 'clinical-status',
    type: 'token',
    paths: [['clinicalStatus', 'coding', 'code']],
  },
  'verification-status': {
    name: 'verification-status',
    type: 'token',
    paths: [['verificationStatus', 'coding', 'code']],
  },
  category: { name: 'category', type: 'token', paths: [['category']] },
  criticality: { name: 'criticality', type: 'token', paths: [['criticality']] },
  type: { name: 'type', type: 'token', paths: [['type']] },
  date: {
    name: 'date',
    type: 'date',
    paths: [['onsetDateTime'], ['reaction', 'onset']],
  },
  severity: {
    name: 'severity',
    type: 'token',
    paths: [['reaction', 'severity']],
  },
};

const DIAGNOSTIC_REPORT: Record<string, ParamDefinition> = {
  patient: {
    name: 'patient',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  subject: {
    name: 'subject',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  encounter: {
    name: 'encounter',
    type: 'reference',
    paths: [['encounter', 'reference']],
  },
  code: {
    name: 'code',
    type: 'token',
    paths: [
      ['code', 'coding', 'code'],
      ['code', 'text'],
    ],
  },
  status: { name: 'status', type: 'token', paths: [['status']] },
  category: {
    name: 'category',
    type: 'token',
    paths: [['category', 'coding', 'code']],
  },
  date: {
    name: 'date',
    type: 'date',
    paths: [['effectiveDateTime'], ['effectivePeriod', 'start']],
  },
  result: {
    name: 'result',
    type: 'reference',
    paths: [['result', 'reference']],
  },
  performer: {
    name: 'performer',
    type: 'reference',
    paths: [['performer', 'reference']],
  },
};

const ENCOUNTER: Record<string, ParamDefinition> = {
  patient: {
    name: 'patient',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  subject: {
    name: 'subject',
    type: 'reference',
    paths: [['subject', 'reference']],
  },
  class: { name: 'class', type: 'token', paths: [['class', 'code']] },
  status: { name: 'status', type: 'token', paths: [['status']] },
  type: { name: 'type', type: 'token', paths: [['type', 'coding', 'code']] },
  date: {
    name: 'date',
    type: 'date',
    paths: [
      ['period', 'start'],
      ['period', 'end'],
    ],
  },
  location: {
    name: 'location',
    type: 'reference',
    paths: [['location', 'location', 'reference']],
  },
  practitioner: {
    name: 'practitioner',
    type: 'reference',
    paths: [['participant', 'individual', 'reference']],
  },
};

const REGISTRY: Record<ResourceType, Record<string, ParamDefinition>> = {
  Patient: { ...COMMON, ...PATIENT },
  Practitioner: { ...COMMON, ...PRACTITIONER },
  Organization: { ...COMMON, ...ORGANIZATION },
  Encounter: { ...COMMON, ...ENCOUNTER },
  Condition: { ...COMMON, ...CONDITION },
  Observation: { ...COMMON, ...OBSERVATION },
  MedicationRequest: { ...COMMON, ...MEDICATION_REQUEST },
  AllergyIntolerance: { ...COMMON, ...ALLERGY_INTOLERANCE },
  DiagnosticReport: { ...COMMON, ...DIAGNOSTIC_REPORT },
};

/** Resolve a search parameter name for a resource type, or undefined if unknown. */
export function getParamDefinition(
  resourceType: ResourceType,
  name: string,
): ParamDefinition | undefined {
  return REGISTRY[resourceType]?.[name];
}

/** All defined parameter names for a resource type (for introspection/debugging). */
export function paramNames(resourceType: ResourceType): string[] {
  return Object.keys(REGISTRY[resourceType] ?? {});
}
