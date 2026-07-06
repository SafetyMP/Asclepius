import type { ResourceType } from '@/domain/fhir';
import { isSupportedResourceType } from '@/domain/fhir';

/**
 * Auth port — authenticated principal + access-token lifecycle.
 *
 * The HTTP auth middleware depends on `AccessTokenVerifier` (a port), and the
 * composition root injects jose-based adapters from `@/adapter/auth`. Keeping
 * the contract here means the adapter imports `@/port` + `@/domain` only.
 *
 * Reference: docs/adr/0008-jwt-and-smart-scopes.md
 */

export type ScopeContext = 'patient' | 'user' | 'system';
export type ScopeAction = 'read' | 'write' | '*';

/** A parsed SMART-style scope: `<context>/<resource>.<action>`. */
export interface ParsedScope {
  readonly context: ScopeContext;
  readonly resource: ResourceType | '*';
  readonly action: ScopeAction;
}

/**
 * The authenticated principal extracted from a verified access token.
 *
 * `patientId` is carried for future patient-compartment enforcement (SMART
 * patient-scoped access). It is NOT enforced by the MVP policy: `patient/*.read`
 * grants read of the resource type but does not filter results to the bound
 * patient. This is a documented limitation.
 */
export interface AuthContext {
  readonly sub: string;
  readonly role: string;
  readonly scopes: readonly ParsedScope[];
  readonly patientId?: string;
}

/** Verify an access token string → authenticated principal (throws UnauthorizedError). */
export interface AccessTokenVerifier {
  verify(token: string): Promise<AuthContext>;
}

/** Sign a principal into a JWT string. Dev-only — never wired in production. */
export interface AccessTokenIssuer {
  issue(principal: AuthContext): Promise<string>;
}

/**
 * Pure scope-string parsing (lives in the port so adapters need not reach into
 * `@/service`). Format: `<context>/<resource>.<action>` where context ∈
 * {patient,user,system}, resource ∈ {ResourceType|`*`}, action ∈ {read,write,`*`}.
 * Returns undefined for a malformed scope (it grants nothing).
 */
const SCOPE_RE = /^(patient|user|system)\/([A-Za-z][A-Za-z0-9]*|\*)\.(read|write|\*)$/;

export function parseScope(raw: string): ParsedScope | undefined {
  const m = SCOPE_RE.exec(raw);
  if (m === null || m[1] === undefined || m[2] === undefined || m[3] === undefined) {
    return undefined;
  }
  const resource = m[2];
  if (resource !== '*' && !isSupportedResourceType(resource)) return undefined;
  return {
    context: m[1] as ScopeContext,
    resource: resource as ResourceType | '*',
    action: m[3] as ScopeAction,
  };
}

/** Parse a space-separated `scope` claim; malformed entries are skipped. */
export function parseScopes(scopeClaim: string): readonly ParsedScope[] {
  return scopeClaim
    .split(/\s+/)
    .map(parseScope)
    .filter((s): s is ParsedScope => s !== undefined);
}
