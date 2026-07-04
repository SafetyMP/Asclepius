/** FHIR JSON media type (R4 http://hl7.org/fhir/http.html). */
const FHIR_JSON = 'application/fhir+json; charset=utf-8';

/**
 * Serialize a FHIR resource / Bundle / OperationOutcome as a JSON Response with
 * the correct `application/fhir+json` content type and optional extra headers.
 * Kept as one place so every response is shaped consistently.
 */
export function fhirResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  const headers: Record<string, string> = { 'content-type': FHIR_JSON };
  if (init.headers) {
    for (const [k, v] of Object.entries(init.headers)) headers[k] = v;
  }
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}
