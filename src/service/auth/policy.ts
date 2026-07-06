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
export function can(ctx: AuthContext, resourceType: ResourceType, action: FhirAction): boolean {
  return ctx.scopes.some((s) => scopeMatches(s, resourceType, action));
}
