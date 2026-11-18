export function japanNow(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

export function dateOf(stamp: string): string {
  return stamp.slice(0, 10);
}

export function timeOf(stamp: string | null): string {
  return stamp?.slice(11, 16) ?? "—";
}

export function epoch(stamp: string): number {
  return Date.parse(`${stamp}+09:00`);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T12:00:00+09:00`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00+09:00`).getUTCDay();
}

export function isDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isStamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-5]\d$/.test(value) &&
    isDate(value.slice(0, 10)) &&
    isTime(value.slice(11, 16))
  );
}

// 日本の祝日を計算し、振替休日と国民の休日も除外する。
export function holidays(year: number): Set<string> {
  const result = new Set<string>();
  const put = (month: number, day: number) =>
    result.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  [
    [1, 1],
    [2, 11],
    [2, 23],
    [4, 29],
    [5, 3],
    [5, 4],
    [5, 5],
    [8, 11],
    [11, 3],
    [11, 23],
  ].forEach(([m, d]) => put(m, d));
  [
    [1, 2],
    [7, 3],
    [9, 3],
    [10, 2],
  ].forEach(([month, nth]) => {
    const first = `${year}-${String(month).padStart(2, "0")}-01`;
    put(month, 1 + ((8 - weekday(first)) % 7) + (nth - 1) * 7);
  });
  put(3, Math.floor(20.8431 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4));
  put(9, Math.floor(23.2488 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4));
  for (const date of [...result].sort()) {
    if (weekday(date) === 0) {
      let substitute = addDays(date, 1);
      while (result.has(substitute)) substitute = addDays(substitute, 1);
      result.add(substitute);
    }
    if (result.has(addDays(date, 2))) result.add(addDays(date, 1));
  }
  return result;
}

export function businessDay(date: string): boolean {
  return (
    weekday(date) !== 0 && weekday(date) !== 6 && !holidays(Number(date.slice(0, 4))).has(date)
  );
}

export function duration(enteredAt: string | null, exitedAt: string | null, now: string): number {
  return enteredAt
    ? Math.max(0, Math.floor((epoch(exitedAt ?? now) - epoch(enteredAt)) / 60000))
    : 0;
}

export function durationLabel(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)}時間${minutes % 60}分` : `${minutes}分`;
}
