export const addDays = (d: Date, n: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

export const startOfMonthMatrix = (selected: Date) => {
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const start = new Date(first);
  const weekday = (start.getDay() + 6) % 7; // Monday start
  start.setDate(start.getDate() - weekday);
  return Array.from({ length: 42 }, (_, idx) => addDays(start, idx));
};

export const fmtKey = (d: Date) => {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};
