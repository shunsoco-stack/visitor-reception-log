import { allocateBadge } from "./badges";
import { dateOf } from "./dates";
import { createNotice } from "./notices";
import type { Database, Visit } from "./types";

export function inside(visit: Visit): boolean {
  return !!visit.enteredAt && !visit.exitedAt;
}

export function checkIn(data: Database, id: string, now: string): Database {
  const visit = data.visits.find((item) => item.id === id);
  if (!visit || visit.cancelled || visit.enteredAt || visit.date !== dateOf(now))
    throw new Error("本日の未受付の予約だけ受付できます。番号をご確認ください。");
  const badge = allocateBadge(data);
  return {
    ...data,
    visits: data.visits.map((item) => (item.id === id ? { ...item, enteredAt: now, badge } : item)),
    notices: [...data.notices, createNotice(id, now)],
  };
}

export function findDeparture(visits: Visit[], code: string): Visit | undefined {
  const normalized = code.normalize("NFKC").trim().toUpperCase();
  return visits.find(
    (visit) => inside(visit) && (visit.code === normalized || visit.badge === normalized),
  );
}

export function checkOut(data: Database, id: string, now: string, returned: boolean): Database {
  const visit = data.visits.find((item) => item.id === id);
  if (!visit || !inside(visit) || now < visit.enteredAt!)
    throw new Error("退館済みか、入館記録がありません。");
  return {
    ...data,
    visits: data.visits.map((item) =>
      item.id === id ? { ...item, exitedAt: now, returnedAt: returned ? now : null } : item,
    ),
  };
}
