import type { ResourceType } from '@/domain/fhir';
import type { AuthContext, ParsedScope } from '@/port/auth';

/**
 * Authorization policy — pure functions over the `AuthContext` port type and
 * `ResourceType` (domain). The HTTP middleware calls `can()` (injected via
 * `AuthDeps`), so the adapter never imports this service module directly.
 *
 * MVP: ALL scope contexts (patient/user/system) are treated equivalently for
 * the decision; `patient/X.read` grants read of X without compartment filtering
 * (documented limitation). `role` is carried for future RBAC overrides but does
 * not affect the MVP decision — scopes drive everything.
 */

export type FhirAction = 'read' | 'write';

/** A single scope grants the (resourceType, action) pair via wildcard matching. */
export function scopeMatches(
  scope: ParsedScope,
  resourceType: ResourceType,
  action: FhirAction,
): boolean {
  const resourceOk = scope.resource === '*' || scope.resource === resourceType;
  const actionOk = scope.action === '*' || scope.action === action;
  return resourceOk && actionOk;
}

/** Does ANY of the principal's scopes grant the requested (resourceType, action)? */
export function can(
  ctx: AuthContext,
  resourceType: ResourceType,
  action: FhirAction,
  resourceId?: string,
): boolean {
  const scopeOk = ctx.scopes.some((s) => scopeMatches(s, resourceType, action));
  if (!scopeOk) return false;
  return passesPatientCompartment(ctx, resourceType, resourceId);
}

/** Enforce SMART patient compartment when token carries patientId. */
function passesPatientCompartment(
  ctx: AuthContext,
  resourceType: ResourceType,
  resourceId?: string,
): boolean {
  if (ctx.patientId === undefined) return true;
  const patientBound = ctx.scopes.some((s) => s.context === 'patient');
  if (!patientBound) return true;
  if (resourceType === 'Patient' && resourceId !== undefined) {
    return resourceId === ctx.patientId;
  }
  return true;
}

/** Returns true when a patient-bound token may access the given patient id. */
export function canAccessPatient(ctx: AuthContext, patientId: string): boolean {
  if (ctx.patientId === undefined) return true;
  const patientBound = ctx.scopes.some((s) => s.context === 'patient');
  if (!patientBound) return true;
  return ctx.patientId === patientId;
}
