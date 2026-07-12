import { ZodError } from 'zod';
import type { FhirResource } from '@/domain/fhir';
import { parseResource } from '@/domain/fhir';
import type { OperationOutcome } from '@/domain/fhir/operation-outcome';
import type { ValidationService } from '@/port/validation';
import type { ValidationIssue, ValidationRule } from './types';
import { errorToIssue, zodErrorToIssues } from './zod-mapping';

/**
 * Create a `ValidationService` that chains structural (zod) + profile rules.
 * `validate` runs both phases; `validateResource` runs profile rules only.
 * Never throws — returns an OperationOutcome with all issues.
 */
export function createValidationService(rules: readonly ValidationRule[]): ValidationService {
  return {
    validate(input: unknown): OperationOutcome {
      const issues: ValidationIssue[] = [];

      // Phase 1: structural (zod)
      let parsed: FhirResource | undefined;
      try {
        parsed = parseResource(input);
      } catch (e) {
        if (e instanceof ZodError) {
          issues.push(...zodErrorToIssues(e));
        } else {
          issues.push(errorToIssue(e));
        }
        return { resourceType: 'OperationOutcome', issue: issues };
      }

      // Phase 2: profile rules (only if structurally valid)
      if (parsed !== undefined) {
        issues.push(...evaluateRules(parsed, rules));
      }
      return { resourceType: 'OperationOutcome', issue: issues };
    },

    validateResource(resource: FhirResource): OperationOutcome {
      return {
        resourceType: 'OperationOutcome',
        issue: evaluateRules(resource, rules),
      };
    },
  };
}

function evaluateRules(
  resource: FhirResource,
  rules: readonly ValidationRule[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const rule of rules) {
    if (!rule.appliesTo.includes(resource.resourceType)) continue;
    issues.push(...rule.validate(resource));
  }
  return issues;
}
