/**
 * JST Timezone & Business Day Utilities
 *
 * The bar operates past midnight, so "today" uses a 6:00 AM JST boundary.
 * Example: 2:00 AM Feb 9 JST counts as Feb 8's business day.
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const BUSINESS_DAY_START_HOUR = 6; // 6:00 AM JST

/**
 * Convert a UTC Date to JST.
 */
function toJST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000 + JST_OFFSET_MS);
}

/**
 * Convert a JST Date back to UTC.
 */
function fromJST(jstDate: Date): Date {
  return new Date(jstDate.getTime() - jstDate.getTimezoneOffset() * 60000 - JST_OFFSET_MS);
}

/**
 * Get current time in JST.
 */
export function nowJST(): Date {
  return toJST(new Date());
}

/**
 * Get the "business date" for a given moment (defaults to now).
 * Before 6:00 AM JST → previous calendar day's business.
 */
export function getBusinessDate(date?: Date): Date {
  const jst = date ? toJST(date) : nowJST();
  if (jst.getHours() < BUSINESS_DAY_START_HOUR) {
    jst.setDate(jst.getDate() - 1);
  }
  jst.setHours(0, 0, 0, 0);
  return jst;
}

/**
 * Get business day start/end as UTC ISO strings for Supabase queries.
 * Business day: 6:00 AM JST on the date → 6:00 AM JST next day (exclusive).
 */
export function getBusinessDayRange(businessDate: Date): { start: string; end: string } {
  const startJST = new Date(businessDate);
  startJST.setHours(BUSINESS_DAY_START_HOUR, 0, 0, 0);

  const endJST = new Date(startJST);
  endJST.setDate(endJST.getDate() + 1);

  return {
    start: fromJST(startJST).toISOString(),
    end: fromJST(endJST).toISOString(),
  };
}

/**
 * Format a business date as yyyy-MM-dd.
 */
export function formatBusinessDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
