import type { MiddlewareHandler } from 'hono';
import type { AuditInput, AuditLogger, AuditPrincipal } from '@/port/audit';
import type { AppVariables } from '../app';

/** Principal used when the request had no authCtx (public endpoints, /auth/*). */
const ANONYMOUS_PRINCIPAL: AuditPrincipal = {
  sub: 'system:anonymous',
  role: 'system',
  scopesJson: '[]',
};

/**
 * Audit middleware — records EVERY request after it completes.
 *
 * Registered FIRST (outermost) so it wraps the entire chain including `/auth/token`.
 * `await next()` runs the auth middleware + handler; `authCtx` is populated by
 * the time the middleware resumes. Wrapped in try/catch so a logging failure can
 * NEVER break the HTTP response.
 *
 * PHI minimization: only references (resourceType, resourceId) are logged — never
 * resource bodies, request bodies, or credentials.
 */
export function auditMiddleware(
  logger: AuditLogger,
): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    await next();
    try {
      const authCtx = c.get('authCtx');
      const principal: AuditPrincipal = authCtx
        ? {
            sub: authCtx.sub,
            role: authCtx.role,
            scopesJson: JSON.stringify(
              authCtx.scopes.map((s) => `${s.context}/${s.resource}.${s.action}`),
            ),
          }
        : ANONYMOUS_PRINCIPAL;

      const segments = c.req.path.split('/').filter((s) => s.length > 0);
      const first = segments[0];
      const resourceType = first !== undefined && first !== 'auth' ? first : undefined;
      const second = segments[1];
      const resourceId =
        resourceType !== undefined &&
        second !== undefined &&
        second !== '_search' &&
        second !== '_history'
          ? second
          : undefined;

      const input: AuditInput = {
        principal,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ...(resourceType !== undefined ? { resourceType } : {}),
        ...(resourceId !== undefined ? { resourceId } : {}),
      };
      logger.record(input);
    } catch {
      // never break the response
    }
  };
}
