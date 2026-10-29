/**
 * Shared client-side formatting helpers.
 */

/**
 * Formats an ISO date string (or anything `Date` understands) as a short
 * locale date like "Jan 2, 2024". Invalid input is returned unchanged so
 * callers never render "Invalid Date".
 */
export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Collapses all whitespace runs into single spaces and truncates the result
 * to `max` characters, appending an ellipsis when the text was cut.
 */
export function excerpt(text: string, max = 180): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) {
    return flat;
  }
  return `${flat.slice(0, max).trimEnd()}…`;
}
