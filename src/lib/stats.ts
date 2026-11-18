import { inside } from "./reception";
import type { Visit } from "./types";

export function status(visit: Visit, now: string): string {
  if (visit.cancelled) return "取消";
  if (visit.exitedAt) return "退館済み";
  if (inside(visit)) return "館内";
  return `${visit.date}T${visit.time}:00` < now ? "遅れ" : "予定";
}

export function filterVisits(
  visits: Visit[],
  from: string,
  to: string,
  employeeId = "",
  company = "",
): Visit[] {
  return visits
    .filter(
      (visit) =>
        visit.date >= from &&
        visit.date <= to &&
        (!employeeId || visit.employeeId === employeeId) &&
        visit.company.toLocaleLowerCase().includes(company.toLocaleLowerCase()),
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function todayStats(visits: Visit[], date: string) {
  const today = visits.filter((visit) => visit.date === date && !visit.cancelled);
  return {
    total: today.length,
    scheduled: today.filter((visit) => !visit.enteredAt).length,
    arrived: today.filter((visit) => visit.enteredAt).length,
    inside: visits.filter(inside).length,
    departed: today.filter((visit) => visit.exitedAt).length,
  };
}
