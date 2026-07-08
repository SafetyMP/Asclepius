import { defineRepositoryContract } from '@/../tests/integration/repository-contract';
import { InMemoryResourceRepository } from './in-memory-repository';

// The shared ResourceRepository port-conformance suite proves the in-memory
// adapter honors the same contract as the SQLite adapter (ADR 0004).
defineRepositoryContract('InMemoryResourceRepository', () => new InMemoryResourceRepository());
