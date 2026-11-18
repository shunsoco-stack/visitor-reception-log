import { isDate, isStamp, isTime } from "./dates";
import { purposes } from "./types";
import type { Database } from "./types";

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, max = 2000): value is string {
  return typeof value === "string" && value.length <= max;
}

function unique(values: unknown[]): boolean {
  return new Set(values).size === values.length;
}

export function validateDatabase(value: unknown): value is Database {
  if (!object(value) || value.version !== 1 || !text(value.company) || !value.company.trim())
    return false;
  const { employees, destinations, visits, notices, badgeStart, badgeEnd } = value;
  if (
    !Array.isArray(employees) ||
    !employees.length ||
    employees.length > 200 ||
    !employees.every(
      (employee) =>
        object(employee) &&
        text(employee.id) &&
        employee.id &&
        text(employee.name) &&
        employee.name.trim() &&
        text(employee.department),
    )
  )
    return false;
  if (
    !unique(employees.map((employee) => employee.id)) ||
    !employees.some((employee) => employee.id === "employee-0")
  )
    return false;
  if (
    !Array.isArray(destinations) ||
    !destinations.length ||
    destinations.length > 100 ||
    !destinations.every((item) => text(item) && item.trim()) ||
    !unique(destinations)
  )
    return false;
  if (
    !Number.isInteger(badgeStart) ||
    !Number.isInteger(badgeEnd) ||
    Number(badgeStart) < 1 ||
    Number(badgeEnd) > 999 ||
    Number(badgeStart) > Number(badgeEnd)
  )
    return false;
  if (
    !Array.isArray(visits) ||
    visits.length > 9000 ||
    !Array.isArray(notices) ||
    notices.length > 9000
  )
    return false;
  for (const visit of visits) {
    if (
      !object(visit) ||
      ![
        "id",
        "code",
        "date",
        "time",
        "company",
        "name",
        "companions",
        "employeeId",
        "purpose",
        "destination",
        "memo",
      ].every((key) => text(visit[key]))
    )
      return false;
    if (
      !visit.id ||
      !/^\d{4}$/.test(String(visit.code)) ||
      !isDate(String(visit.date)) ||
      !isTime(String(visit.time)) ||
      !String(visit.company).trim() ||
      !String(visit.name).trim()
    )
      return false;
    if (
      !Number.isInteger(visit.count) ||
      Number(visit.count) < 1 ||
      Number(visit.count) > 99 ||
      typeof visit.walkIn !== "boolean" ||
      typeof visit.cancelled !== "boolean"
    )
      return false;
    if (
      !employees.some((employee) => employee.id === visit.employeeId) ||
      !destinations.includes(visit.destination) ||
      !(purposes as readonly unknown[]).includes(visit.purpose)
    )
      return false;
    if (
      ![visit.enteredAt, visit.exitedAt, visit.returnedAt].every(
        (stamp) => stamp === null || isStamp(stamp),
      )
    )
      return false;
    if (
      visit.badge !== null &&
      (typeof visit.badge !== "string" ||
        !/^V-\d{2,3}$/.test(visit.badge) ||
        Number(visit.badge.slice(2)) < 1 ||
        Number(visit.badge.slice(2)) > 999)
    )
      return false;
    if (!!visit.enteredAt !== !!visit.badge || (visit.cancelled && visit.enteredAt)) return false;
    if (visit.enteredAt && String(visit.enteredAt).slice(0, 10) !== visit.date) return false;
    if (visit.exitedAt && (!visit.enteredAt || String(visit.exitedAt) < String(visit.enteredAt)))
      return false;
    if (visit.returnedAt && (!visit.exitedAt || String(visit.returnedAt) < String(visit.exitedAt)))
      return false;
  }
  if (
    !unique(visits.map((visit) => visit.id)) ||
    !unique(visits.map((visit) => visit.code)) ||
    !unique(visits.filter((visit) => visit.badge && !visit.returnedAt).map((visit) => visit.badge))
  )
    return false;
  for (const notice of notices) {
    if (!object(notice) || !text(notice.id) || !notice.id || !isStamp(notice.createdAt))
      return false;
    const visit = visits.find((item) => item.id === notice.visitId);
    if (!visit?.enteredAt || notice.createdAt !== visit.enteredAt) return false;
    if (notice.readAt !== null && (!isStamp(notice.readAt) || notice.readAt < notice.createdAt))
      return false;
    if (
      notice.readAt
        ? !employees.some((employee) => employee.id === notice.responderId)
        : notice.responderId !== null
    )
      return false;
  }
  return (
    unique(notices.map((notice) => notice.id)) &&
    unique(notices.map((notice) => notice.visitId)) &&
    visits
      .filter((visit) => visit.enteredAt)
      .every((visit) => notices.some((notice) => notice.visitId === visit.id))
  );
}

export function importBackup(raw: string): Database {
  if (raw.length > 10_000_000) throw new Error("バックアップは10MB以下にしてください。");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSON形式を読み取れませんでした。");
  }
  if (!validateDatabase(parsed))
    throw new Error(
      "バックアップの形式または記録の整合性が正しくありません。現在のデータは変更していません。",
    );
  return parsed;
}

export function exportBackup(data: Database): string {
  if (!validateDatabase(data)) throw new Error("データの整合性を確認できません。");
  return JSON.stringify(data, null, 2);
}
