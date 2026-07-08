/**
 * Recursively freeze a plain JSON value. Shared by the storage adapters so
 * every returned `StoredResource` is an immutable snapshot at runtime (not just
 * via TS `readonly`) — callers cannot corrupt a version by mutating a read
 * result. Lives in `domain` (pure, no dependencies) so both adapters can import
 * it without coupling to each other.
 */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
