import type { CdsRule } from '../types';
import { ddiCheckRule } from './ddi-check';
import { drugAllergyRule } from './drug-allergy';
import { warfarinNsaidRule } from './warfarin-nsaid';

export const cdsRules: readonly CdsRule[] = [drugAllergyRule, warfarinNsaidRule, ddiCheckRule];
