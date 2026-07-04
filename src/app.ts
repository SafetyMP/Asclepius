import { loadConfig } from '@/config';
import { SAFETY_BANNER } from '@/domain/safety';
import { getLogger } from '@/logger';

/**
 * Composition root.
 *
 * First principles: in a ports-and-adapters architecture, exactly ONE place
 * decides which adapter implementations satisfy which ports. Centralizing that
 * wiring here means (1) the dependency graph is visible at a glance, (2) tests
 * can swap adapters without touching domain logic, (3) there is no hidden
 * service-locator magic.
 *
 * Today this boots config + logger and confirms readiness. As subsystems are
 * added (repository, http, auth, audit, cds, ddi), their wiring lands here.
 */
async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(SAFETY_BANNER);

  const config = loadConfig();
  const log = getLogger().child({ component: 'boot' });

  log.info({ config: { ...config, jwtSecret: '[set]' } }, 'configuration loaded');
  log.info('asclepius skeleton ready — subsystems pending');
}

main().catch((err: unknown) => {
  // boot failure: print to stderr, exit non-zero so process managers notice
  console.error('Boot failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
