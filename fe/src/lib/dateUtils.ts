/**
 * Shared date utility — dùng chung toàn app thay vì định nghĩa inline trong từng component.
 *
 * parseDateKey("2025-06-07T...") => "2025-06-07"
 * parseDateKey(undefined)        => ""
 */
export const parseDateKey = (date?: string): string =>
  date ? new Date(date).toISOString().slice(0, 10) : "";
