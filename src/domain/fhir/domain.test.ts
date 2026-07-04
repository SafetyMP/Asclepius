import { describe, expect, it } from 'vitest';
import {
  allergyIntolerance,
  code,
  codeableConcept,
  condition,
  diagnosticReport,
  encounter,
  type FhirResource,
  fhirDate,
  fhirDateTime,
  fhirInstant,
  fhirTime,
  humanName,
  id,
  identifier,
  isSupportedResourceType,
  medicationRequest,
  observation,
  parseResource,
  patient,
  practitioner,
  quantity,
  reference,
  resourceSchemaByType,
  resourceUnion,
  schemaForResourceType,
  searchsetBundle,
  uuid,
} from '@/domain/fhir';

describe('primitives', () => {
  it('accepts a valid FHIR id', () => {
    expect(id.parse('Patient-123.abc')).toBe('Patient-123.abc');
  });
  it('rejects an id with invalid characters or length', () => {
    expect(() => id.parse('has space')).toThrow();
    expect(() => id.parse('')).toThrow();
  });
  it('validates dateTime and instant distinctly', () => {
    expect(fhirDateTime.parse('2020-01-02')).toBe('2020-01-02');
    expect(fhirDateTime.parse('2020-01-02T08:30:00Z')).toBe('2020-01-02T08:30:00Z');
    // instant requires seconds + timezone — a bare date is NOT a valid instant
    expect(() => fhirInstant.parse('2020-01-02')).toThrow();
    expect(fhirInstant.parse('2020-01-02T08:30:00Z')).toBe('2020-01-02T08:30:00Z');
  });
  it('validates date forms', () => {
    expect(fhirDate.parse('1950')).toBe('1950');
    expect(fhirDate.parse('1950-06')).toBe('1950-06');
    expect(() => fhirDate.parse('1950-13')).toThrow();
  });
  it('validates time with HH/MM/SS range bounds', () => {
    expect(fhirTime.parse('23:59:59')).toBe('23:59:59');
    expect(fhirTime.parse('00:00:00')).toBe('00:00:00');
    expect(fhirTime.parse('12:30:45.123')).toBe('12:30:45.123');
    // out-of-range values must be rejected (previously over-accepted)
    expect(() => fhirTime.parse('24:00:00')).toThrow();
    expect(() => fhirTime.parse('23:60:00')).toThrow();
    expect(() => fhirTime.parse('23:59:60')).toThrow();
  });
  it('validates a uuid urn', () => {
    expect(uuid.parse('urn:uuid:6b1b6b6e-1b1b-4b1b-8b1b-1b1b1b1b1b1b')).toMatch(/^urn:uuid:/);
    expect(() => uuid.parse('not-a-uuid')).toThrow();
  });
  it('rejects whitespace in a code', () => {
    expect(code.parse('active')).toBe('active');
    expect(() => code.parse('not allowed')).toThrow();
  });
});

describe('complex datatypes', () => {
  it('round-trips a CodeableConcept with codings', () => {
    const cc = codeableConcept.parse({
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '38341003',
          display: 'Hypertension',
        },
      ],
      text: 'Hypertension',
    });
    expect(cc.coding?.[0]?.code).toBe('38341003');
  });
  it('round-trips a Quantity with comparator', () => {
    const q = quantity.parse({
      value: 5.5,
      unit: 'mmol/L',
      system: 'http://unitsofmeasure.org',
      code: 'mmol/L',
    });
    expect(q.value).toBe(5.5);
  });
  it('rejects an invalid quantity comparator', () => {
    expect(() => quantity.parse({ value: 1, comparator: '!=' })).toThrow();
  });
  it('round-trips a HumanName', () => {
    const n = humanName.parse({
      family: 'Smith',
      given: ['John'],
      use: 'official',
    });
    expect(n.family).toBe('Smith');
    expect(n.given?.[0]).toBe('John');
  });
  it('supports recursive Reference ↔ Identifier nesting', () => {
    // Reference.identifier.assigner.identifier... — exercises the cycle
    const r = reference.parse({
      reference: 'Organization/1',
      identifier: {
        system: 'urn:oid:1.2.3',
        value: 'ORG-1',
        assigner: { reference: 'Organization/2' },
      },
    });
    expect(r.identifier?.assigner?.reference).toBe('Organization/2');
  });
  it('round-trips an Identifier', () => {
    const i = identifier.parse({
      use: 'official',
      system: 'http://hl7.org/fhir/sid/us-ssn',
      value: '123-45-6789',
    });
    expect(i.value).toBe('123-45-6789');
  });
});

describe('resources — valid round-trips', () => {
  it('parses a minimal Patient', () => {
    const p = patient.parse({
      resourceType: 'Patient',
      id: 'pat-1',
      active: true,
      name: [{ family: 'Doe', given: ['Jane'] }],
      gender: 'female',
      birthDate: '1980-05-05',
    });
    expect(p.id).toBe('pat-1');
    expect(p.gender).toBe('female');
    expect(p.name?.[0]?.family).toBe('Doe');
  });

  it('parses a Condition with a required subject', () => {
    const c = condition.parse({
      resourceType: 'Condition',
      id: 'cond-1',
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
          },
        ],
      },
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '73211009' }],
        text: 'Diabetes',
      },
      subject: { reference: 'Patient/pat-1' },
      onsetDateTime: '2010-01-01',
    });
    expect(c.subject.reference).toBe('Patient/pat-1');
    expect(c.code?.text).toBe('Diabetes');
  });

  it('parses an Observation with a valueQuantity', () => {
    const o = observation.parse({
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: '2951-2' }],
        text: 'Sodium',
      },
      subject: { reference: 'Patient/pat-1' },
      valueQuantity: { value: 140, unit: 'mmol/L' },
    });
    expect(o.status).toBe('final');
    expect(o.valueQuantity?.value).toBe(140);
  });

  it('parses a MedicationRequest with a coded medication + intent', () => {
    const m = medicationRequest.parse({
      resourceType: 'MedicationRequest',
      id: 'med-1',
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [
          {
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '11289',
          },
        ],
        text: 'Warfarin',
      },
      subject: { reference: 'Patient/pat-1' },
      dosageInstruction: [{ text: '5mg daily' }],
    });
    expect(m.intent).toBe('order');
    expect(m.medicationCodeableConcept?.text).toBe('Warfarin');
  });

  it('parses an AllergyIntolerance with a reaction', () => {
    const a = allergyIntolerance.parse({
      resourceType: 'AllergyIntolerance',
      id: 'all-1',
      category: ['medication'],
      criticality: 'high',
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '37327000' }],
        text: 'Penicillin',
      },
      patient: { reference: 'Patient/pat-1' },
      reaction: [{ manifestation: [{ text: 'Rash' }], severity: 'severe' }],
    });
    expect(a.patient.reference).toBe('Patient/pat-1');
    expect(a.reaction?.[0]?.severity).toBe('severe');
  });

  it('parses an Encounter with class + status', () => {
    const e = encounter.parse({
      resourceType: 'Encounter',
      id: 'enc-1',
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
      },
      subject: { reference: 'Patient/pat-1' },
    });
    expect(e.class.code).toBe('AMB');
  });

  it('parses a Practitioner', () => {
    const pr = practitioner.parse({
      resourceType: 'Practitioner',
      id: 'prac-1',
      name: [{ family: 'Welby', given: ['Marcus'] }],
      qualification: [{ code: { text: 'MD' } }],
    });
    expect(pr.qualification?.[0]?.code.text).toBe('MD');
  });

  it('parses a DiagnosticReport referencing Observations', () => {
    const d = diagnosticReport.parse({
      resourceType: 'DiagnosticReport',
      id: 'dr-1',
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: '24323-8' }],
        text: 'Comprehensive metabolic panel',
      },
      subject: { reference: 'Patient/pat-1' },
      result: [{ reference: 'Observation/obs-1' }],
    });
    expect(d.result?.[0]?.reference).toBe('Observation/obs-1');
  });
});

describe('resources — invalid inputs rejected', () => {
  it('rejects a Patient with the wrong resourceType literal', () => {
    expect(() => patient.parse({ resourceType: 'Practitioner', id: 'x' })).toThrow();
  });
  it('rejects a Patient with an invalid gender', () => {
    expect(() => patient.parse({ resourceType: 'Patient', gender: 'martian' })).toThrow();
  });
  it('rejects a Condition missing the required subject', () => {
    expect(() => condition.parse({ resourceType: 'Condition', code: { text: 'x' } })).toThrow();
  });
  it('rejects a MedicationRequest missing the required intent', () => {
    expect(() =>
      medicationRequest.parse({
        resourceType: 'MedicationRequest',
        subject: { reference: 'Patient/1' },
      }),
    ).toThrow();
  });
  it('rejects an Observation with an invalid status', () => {
    expect(() =>
      observation.parse({
        resourceType: 'Observation',
        status: 'bogus',
        code: { text: 'x' },
      }),
    ).toThrow();
  });
});

describe('resource union & registry', () => {
  it('isSupportedResourceType narrows correctly', () => {
    expect(isSupportedResourceType('Patient')).toBe(true);
    expect(isSupportedResourceType('NotAThing')).toBe(false);
  });
  it('resourceSchemaByType covers all supported types', () => {
    expect(Object.keys(resourceSchemaByType).sort()).toEqual([
      'AllergyIntolerance',
      'Condition',
      'DiagnosticReport',
      'Encounter',
      'MedicationRequest',
      'Observation',
      'Organization',
      'Patient',
      'Practitioner',
    ]);
  });
  it('schemaForResourceType returns the schema or undefined', () => {
    expect(schemaForResourceType('Patient')).toBeDefined();
    expect(schemaForResourceType('Bundle')).toBeUndefined();
  });
  it('resourceUnion validates a mix of resources', () => {
    const arr: FhirResource[] = [
      { resourceType: 'Patient', id: '1' },
      { resourceType: 'Condition', subject: { reference: 'Patient/1' } },
    ];
    for (const r of arr) expect(resourceUnion.parse(r).resourceType).toBeTruthy();
  });
  it('parseResource routes by resourceType and parses correctly', () => {
    const parsed = parseResource({
      resourceType: 'Patient',
      id: '42',
      birthDate: '2000-01-01',
    });
    expect(parsed.resourceType).toBe('Patient');
    expect((parsed as { birthDate?: string }).birthDate).toBe('2000-01-01');
  });
  it('parseResource rejects an unknown resourceType', () => {
    expect(() => parseResource({ resourceType: 'Bundle' })).toThrow(/unsupported resourceType/);
  });
  it('parseResource rejects a non-object', () => {
    expect(() => parseResource('nope')).toThrow(/must be an object/);
  });
  it('parseResource rejects a malformed resource with a zod error', () => {
    expect(() => parseResource({ resourceType: 'Patient', gender: 'alien' })).toThrow();
  });
});

describe('searchsetBundle', () => {
  it('wraps resources into a Bundle of type searchset with fullUrls', () => {
    const resources: FhirResource[] = [
      { resourceType: 'Patient', id: '1' },
      { resourceType: 'Patient', id: '2' },
    ];
    const b = searchsetBundle(resources);
    expect(b.resourceType).toBe('Bundle');
    expect(b.type).toBe('searchset');
    expect(b.total).toBe(2);
    expect(b.entry?.[0]?.fullUrl).toBe('Patient/1');
    expect(b.entry?.[0]?.search?.mode).toBe('match');
  });
  it('total defaults to the resource count', () => {
    expect(searchsetBundle([{ resourceType: 'Patient', id: 'x' }]).total).toBe(1);
  });
});
