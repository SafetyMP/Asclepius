import type { RefinementCtx } from 'zod';

/**
 * FHIR JSON encodes a choice element as one property whose name is the element
 * plus the type (http://hl7.org/fhir/formats.html#choice). A second property
 * in the same group is not a valid resource.
 */
export function atMostOne(
  value: object,
  ctx: RefinementCtx,
  element: string,
  keys: readonly string[],
): void {
  const record = value as Record<string, unknown>;
  const present = keys.filter((key) => record[key] !== undefined);
  if (present.length > 1) {
    ctx.addIssue({
      code: 'custom',
      message: `${element} allows at most one choice (${present.join(', ')})`,
      path: [element],
    });
  }
}
