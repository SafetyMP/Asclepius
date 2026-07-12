import type { ValidationRule } from '../types';
import { medicationRequestRule } from './medication-request';
import { observationCodeRule } from './observation-code';
import { patientIdentityRule } from './patient-identity';

export const validationRules: readonly ValidationRule[] = [
  patientIdentityRule,
  observationCodeRule,
  medicationRequestRule,
];
