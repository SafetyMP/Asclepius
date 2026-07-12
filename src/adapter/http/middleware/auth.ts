import type { MiddlewareHandler } from 'hono';
import type { ResourceType } from '@/domain/fhir';
import { isSupportedResourceType } from '@/domain/fhir';
import { ForbiddenError } from '@/errors';
import type { AppVariables, AuthDeps } from '../app';

/**
 * Bearer-token auth middleware.
 *
 * 1. Skip public paths (`/auth/*` — the dev token endpoint).
 * 2. Extract the `Authorization: Bearer <token>` header; the verifier decides
 *    (real verifier rejects empty/invalid → UnauthorizedError → 401).
 * 3. Stash the AuthContext for handlers (future: audit).
 * 4. If the first path segment is a supported ResourceType, enforce the scope
 *    policy against (resourceType, method→action); else authenticate-only and
 *    let the notFound/handler return 404 for unknown types.
 *
 * `methodToAction` is inlined here (not in `@/service`) so the adapter imports
 * no service module; the policy decision `can()` is injected via `AuthDeps`.
 */
const PUBLIC_PREFIXES = ['/auth/'];

const methodToAction = (method: string): 'read' | 'write' =>
  method === 'GET' || method === 'HEAD' ? 'read' : 'write';

export function authMiddleware(auth: AuthDeps): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    if (PUBLIC_PREFIXES.some((p) => c.req.path.startsWith(p))) return next();

    const header = c.req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    const ctx = await auth.verifier.verify(token);
    c.set('authCtx', ctx);

    const segments = c.req.path.split('/').filter((s) => s.length > 0);
    const typeSegment = segments[0];
    if (typeSegment !== undefined && isSupportedResourceType(typeSegment)) {
      // POST /{Type}/_search is a FHIR search (a read), not a write — map it to
      // 'read' so a read-scoped principal can use POST-search.
      const isSearch = segments[1] === '_search' && c.req.method === 'POST';
      const action = isSearch ? 'read' : methodToAction(c.req.method);
      const resourceId = segments[1] && segments[1] !== '_search' ? segments[1] : undefined;
      if (!auth.can(ctx, typeSegment as ResourceType, action, resourceId)) {
        throw new ForbiddenError(`Insufficient scope for ${c.req.method} ${typeSegment}`);
      }
    }
    return next();
  };
}
