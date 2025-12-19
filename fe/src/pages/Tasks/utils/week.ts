import { addDays, fmtKey } from "./date";

// Build a rolling 7-day window starting from the anchor date (today) forward.
export const buildWeek = (anchor: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const date = addDays(anchor, i);
    return { date, key: fmtKey(date) };
  });
