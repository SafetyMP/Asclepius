import { z } from 'zod';

/**
 * FHIR R4 primitive datatypes, as zod schemas.
 *
 * First principles: FHIR primitives are string- (or number-) valued with
 * specific lexical rules. We validate the most safety-relevant ones (id, code,
 * date/dateTime/instant, uri/uuid) and keep the rest as refined strings.
 * Regexes are pragmatic simplifications of the canonical FHIR regexes — see
 * http://hl7.org/fhir/datatypes.html. They catch grossly malformed input
 * without rejecting exotic-but-valid values the canonical regex would accept.
 *
 * These are the atoms every resource schema is built from.
 */

/** FHIR id: 1–64 chars of [A-Za-z0-9\-.]. Used for resource ids and version ids. */
export const id = z
  .string()
  .regex(/^[A-Za-z0-9\-.]{1,64}$/, 'invalid FHIR id (1–64 of A–Z a–z 0–9 . -)');

/** FHIR code: a non-whitespace token drawn from a code system. */
export const code = z.string().regex(/^[^\s]+$/, 'invalid FHIR code (no whitespace)');

/** FHIR string: length 1..1MB. */
export const fhirString = z.string().max(1_048_576);

export const fhirBoolean = z.boolean();
export const fhirInteger = z.number().int().min(-2147483648).max(2147483647);
export const positiveInt = z.number().int().positive().max(2147483647);
export const unsignedInt = z.number().int().min(0).max(2147483647);

/** FHIR decimal: a rational number. JSON number with arbitrary precision. */
export const fhirDecimal = z.number();

/** FHIR date: YYYY, YYYY-MM, or YYYY-MM-DD. */
export const fhirDate = z
  .string()
  .regex(
    /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/,
    'invalid FHIR date (YYYY[-MM[-DD]], valid month/day)',
  );

/** FHIR dateTime: date optionally followed by time + timezone. */
export const fhirDateTime = z
  .string()
  .regex(
    /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]\d{2}:\d{2}))?)?)?$/,
    'invalid FHIR dateTime',
  );

/** FHIR instant: a full dateTime with seconds and a mandatory timezone. */
export const fhirInstant = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    'invalid FHIR instant (requires seconds and timezone)',
  );

/** FHIR time: HH:MM:SS with optional fractional seconds, ranges enforced. */
export const fhirTime = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?$/,
    'invalid FHIR time (HH:MM:SS with valid ranges)',
  );

/** FHIR uri. */
export const uri = z.string().regex(/^\S*$/, 'invalid FHIR uri');

/** FHIR url. */
export const url = z.string().regex(/^\S*$/, 'invalid FHIR url');

/** FHIR canonical: a reference by canonical URL. */
export const canonical = z.string().regex(/^\S*$/, 'invalid FHIR canonical');

/** FHIR uuid: urn:uuid: followed by the canonical UUID form. */
export const uuid = z
  .string()
  .regex(
    /^urn:uuid:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'invalid FHIR uuid (urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
  );

/** FHIR oid: urn:oid: followed by dotted decimals. */
export const oid = z.string().regex(/^urn:oid:[0-2](\.(0|[1-9]\d*))+$/, 'invalid FHIR oid');

/** FHIR markdown. */
export const markdown = z.string();
