/**
 * Regulatory safety marker.
 *
 * Asclepius is a REFERENCE IMPLEMENTATION of a FHIR-native clinical data
 * platform. It is NOT certified, NOT validated for clinical safety, and must
 * NOT be used to store, process, or decide treatment for real patient data.
 *
 * This constant is surfaced in: the CLI banner, the HTTP API root response,
 * and the README. Keeping it in one place ensures the disclaimer cannot drift.
 */
export const NOT_FOR_CLINICAL_USE =
  'NOT FOR CLINICAL USE — reference implementation only. Not HIPAA-certified, ' +
  'not a medical device. Do not use with real patient data.';

export const SAFETY_BANNER = `
┌─────────────────────────────────────────────────────────────┐
│  ASCLEPIUS — FHIR-native Clinical Data Platform             │
│                                                             │
│  ${NOT_FOR_CLINICAL_USE.slice(0, 57).padEnd(57)}│
└─────────────────────────────────────────────────────────────┘`.trim();
