import type { Database, Visit } from "./types";

export function badgeNumber(value: number): string {
  return `V-${String(value).padStart(2, "0")}`;
}

export function outstandingBadges(visits: Visit[]): Visit[] {
  return visits.filter((visit) => visit.badge && !visit.returnedAt);
}

export function allocateBadge(data: Database): string {
  const used = new Set(outstandingBadges(data.visits).map((visit) => visit.badge));
  for (let number = data.badgeStart; number <= data.badgeEnd; number++) {
    const badge = badgeNumber(number);
    if (!used.has(badge)) return badge;
  }
  throw new Error("入館証がすべて貸出中です。受付スタッフにお声がけください。");
}

export function returnBadge(data: Database, id: string, now: string): Database {
  const visit = data.visits.find((item) => item.id === id);
  if (!visit?.exitedAt || visit.returnedAt || now < visit.exitedAt)
    throw new Error("退館済み・未返却の入館証を選んでください。");
  return {
    ...data,
    visits: data.visits.map((item) => (item.id === id ? { ...item, returnedAt: now } : item)),
  };
}
