import type { Prefix } from './types';

/**
 * FHIR date search — partial-date intervals + prefix comparison.
 *
 * First principles: a FHIR date search value may be partial (`2020`,
 * `2020-06`, `2020-06-15`, or a full dateTime). Each precision implies a
 * **period**: `2020` means the whole of 2020; `2020-06` means all of June; a
 * dateTime with a time is a point. Comparison prefixes then compare the
 * resource's date against that period's bounds — not against a single instant.
 *
 * Reference: http://hl7.org/fhir/search.html#date
 *
 * Determinism: date-only and partial values are interpreted as UTC (FHIR is
 * otherwise ambiguous here; UTC makes matches reproducible across hosts). Full
 * dateTimes/instants carry their own timezone per FHIR and are parsed as-is.
 */

export interface Interval {
  readonly lower: number;
  readonly upper: number;
}

const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const YEAR_RE = /^(\d{4})$/;

/**
 * Convert a FHIR date / dateTime / instant string into a [lower, upper] epoch-ms
 * interval (UTC). Returns undefined for an unparseable value.
 *
 * - dateTime/instant with time → a point interval [t, t] (timezone honoured;
 *   a naive dateTime is treated as UTC for determinism).
 * - `YYYY-MM-DD` → the whole day.
 * - `YYYY-MM` → the whole month.
 * - `YYYY` → the whole year.
 */
export function dateInterval(value: string): Interval | undefined {
  const v = value.trim();

  const dt = DATETIME_RE.exec(v);
  if (dt) {
    const tz = dt[8];
    // Append Z when the timezone is missing so Date.parse is deterministic
    // (ES interprets a naive ISO datetime as local time, which would vary by host).
    const ms = Date.parse(tz ? v : `${v}Z`);
    if (Number.isNaN(ms)) return undefined;
    return { lower: ms, upper: ms };
  }

  const d = DATE_RE.exec(v);
  if (d) {
    const lower = Date.parse(`${v}T00:00:00.000Z`);
    const upper = Date.parse(`${v}T23:59:59.999Z`);
    if (Number.isNaN(lower) || Number.isNaN(upper)) return undefined;
    return { lower, upper };
  }

  const m = MONTH_RE.exec(v);
  if (m) {
    const [, year, month] = m;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const upperDay = String(lastDay).padStart(2, '0');
    const lower = Date.parse(`${year}-${month}-01T00:00:00.000Z`);
    const upper = Date.parse(`${year}-${month}-${upperDay}T23:59:59.999Z`);
    if (Number.isNaN(lower) || Number.isNaN(upper)) return undefined;
    return { lower, upper };
  }

  const y = YEAR_RE.exec(v);
  if (y) {
    const lower = Date.parse(`${v}-01-01T00:00:00.000Z`);
    const upper = Date.parse(`${v}-12-31T23:59:59.999Z`);
    if (Number.isNaN(lower) || Number.isNaN(upper)) return undefined;
    return { lower, upper };
  }

  return undefined;
}

/**
 * Does a resource date interval satisfy `prefix` against a search-value
 * interval? Both sides are intervals to honour partial-date semantics.
 *
 * - `eq` (default): the intervals overlap.
 * - `ne`: they do not overlap.
 * - `gt` / `sa`: the resource is strictly after the search period
 *   (resource.lower > search.upper).
 * - `lt` / `eb`: the resource is strictly before the search period
 *   (resource.upper < search.lower).
 * - `ge`: resource starts at or after the search period start.
 * - `le`: resource ends at or before the search period end.
 * - `ap` (approximate): treated as `eq` (pragmatic; FHIR leaves the tolerance
 *   to the implementation).
 */
export function compareDate(search: Interval, resource: Interval, prefix: Prefix): boolean {
  const overlap = search.lower <= resource.upper && resource.lower <= search.upper;
  switch (prefix) {
    case 'eq':
      return overlap;
    case 'ne':
      return !overlap;
    case 'gt':
    case 'sa':
      return resource.lower > search.upper;
    case 'ge':
      return resource.lower >= search.lower;
    case 'lt':
    case 'eb':
      return resource.upper < search.lower;
    case 'le':
      return resource.upper <= search.upper;
    case 'ap':
      return overlap;
    default:
      return false;
  }
}
