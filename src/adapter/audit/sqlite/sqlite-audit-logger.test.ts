import Database from 'better-sqlite3';
import { defineAuditContract } from '@/../tests/integration/audit-contract';
import { SqliteAuditLogger } from './sqlite-audit-logger';

defineAuditContract('SqliteAuditLogger', () => {
  const logger = new SqliteAuditLogger(new Database(':memory:'));
  return { logger, mutateEntry: (seq) => logger.__mutateForTamperTest(seq) };
});
