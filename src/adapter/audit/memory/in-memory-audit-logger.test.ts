import { defineAuditContract } from '@/../tests/integration/audit-contract';
import { InMemoryAuditLogger } from './in-memory-audit-logger';

defineAuditContract('InMemoryAuditLogger', () => {
  const logger = new InMemoryAuditLogger();
  return {
    logger,
    mutateEntry: (seq) => logger.__mutateEntry(seq, (e) => ({ ...e, method: 'TAMPERED' })),
  };
});
