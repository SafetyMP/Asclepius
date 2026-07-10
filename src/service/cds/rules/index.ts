import type { CdsRule } from '../types';
import { drugAllergyRule } from './drug-allergy';
import { warfarinNsaidRule } from './warfarin-nsaid';

/** The rule registry — evaluated in array order by `createCdsService`. */
export const cdsRules: readonly CdsRule[] = [drugAllergyRule, warfarinNsaidRule];
