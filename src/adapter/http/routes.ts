import type { Hono } from 'hono';
import type { HttpDeps } from './app';
import {
  handleCreate,
  handleDelete,
  handleInstanceHistory,
  handleRead,
  handleTypeHistory,
  handleUpdate,
  handleVread,
} from './handlers';

/**
 * FHIR REST route registration.
 *
 * Hono's router prioritizes static segments over parametric ones, so reserved
 * paths like `/:type/_history` and `/:type/:id/_history` are never captured by
 * `/:type/:id` — and `_history`/`_search` are not valid FHIR ids anyway
 * (`[A-Za-z0-9-.]` excludes `_`).
 */
export function registerRoutes(app: Hono, deps: HttpDeps): void {
  app.post('/:type', (c) => handleCreate(c, deps));
  app.get('/:type/:id/_history/:vid', (c) => handleVread(c, deps));
  app.get('/:type/:id/_history', (c) => handleInstanceHistory(c, deps));
  app.get('/:type/_history', (c) => handleTypeHistory(c, deps));
  app.put('/:type/:id', (c) => handleUpdate(c, deps));
  app.delete('/:type/:id', (c) => handleDelete(c, deps));
  app.get('/:type/:id', (c) => handleRead(c, deps));
}
