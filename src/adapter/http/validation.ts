import type { Context } from 'hono';
import { ZodError } from 'zod';
import type { FhirResource, ResourceType } from '@/domain/fhir';
import { isSupportedResourceType, parseResource } from '@/domain/fhir';
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from '@/errors';

/**
 * Request validation at the HTTP boundary.
 *
 * Each helper either returns the validated value or throws a typed `FhirError`
 * (→ OperationOutcome with the right status), so handlers stay linear.
 */

/** FHIR id lexical rule (1–64 of [A-Za-z0-9-.]); used for path-id validation. */
const FHIR_ID = /^[A-Za-z0-9-.]{1,64}$/;

export function isValidId(id: string): boolean {
  return FHIR_ID.test(id);
}

/** Resolve the `:type` path param to a supported ResourceType, else 404. */
export function requireResourceType(typeParam: string | undefined): ResourceType {
  const t = typeParam ?? '';
  if (!isSupportedResourceType(t)) {
    throw new NotFoundError(`Unknown resource type: ${t || '(missing)'}`);
  }
  return t;
}

/** Validate the `:id` (or `:vid`) path param, else 400. */
export function requireValidId(idParam: string | undefined): string {
  const id = idParam ?? '';
  if (!isValidId(id)) {
    throw new BadRequestError(`Invalid resource id: ${id || '(missing)'}`);
  }
  return id;
}

/**
 * Require a FHIR/JSON request content type. Lenient about `charset` and the
 * `+json` suffix; rejects anything else with 415. (Accept is intentionally NOT
 * enforced — we only produce one format, and strict 406 breaks browsers/curl.)
 */
export function requireFhirContentType(contentType: string | undefined): void {
  const ct = (contentType ?? '').toLowerCase();
  const ok = ct.startsWith('application/fhir+json') || ct.startsWith('application/json');
  if (!ok) {
    throw new UnsupportedMediaTypeError(
      `Unsupported media type: ${contentType ?? '(missing)'}; use application/fhir+json`,
    );
  }
}

/** Read + JSON-parse the body; 400 on missing/unreadable/malformed. */
export async function readJsonObject(c: Context): Promise<unknown> {
  let text: string;
  try {
    text = await c.req.text();
  } catch {
    throw new BadRequestError('Missing or unreadable request body');
  }
  if (text === '') {
    throw new BadRequestError('Missing request body');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (e) {
    throw new BadRequestError(`Malformed JSON body${e instanceof Error ? `: ${e.message}` : ''}`);
  }
}

/**
 * Parse + validate a write body against the FHIR schema. Throws the zod
 * `ZodError` on schema violations (→ 422 in the error boundary) or an
 * `UnprocessableEntityError` for non-object / unknown-type bodies.
 */
export function parseForWrite(body: unknown): FhirResource {
  try {
    return parseResource(body);
  } catch (e) {
    if (e instanceof ZodError) throw e;
    throw new UnprocessableEntityError(e instanceof Error ? e.message : 'invalid resource');
  }
}
