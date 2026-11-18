import { isDate, isTime } from "./dates";
import { purposes } from "./types";
import type { Database, Visit, VisitInput } from "./types";

export function issueCode(visits: Visit[]): string {
  const used = new Set(visits.map((visit) => visit.code));
  for (let value = 1000; value <= 9999; value++) {
    if (!used.has(String(value))) return String(value);
  }
  throw new Error("受付番号を使い切りました。記録をバックアップして整理してください。");
}

export function validateInput(input: VisitInput, data: Database): void {
  if (!isDate(input.date) || !isTime(input.time))
    throw new Error("日付と予定時刻を確認してください。");
  if (!input.company.trim() || !input.name.trim())
    throw new Error("会社名と氏名を入力してください。");
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > 99)
    throw new Error("人数は1〜99人で入力してください。");
  if (!data.employees.some((employee) => employee.id === input.employeeId))
    throw new Error("担当者を選んでください。");
  if (!data.destinations.includes(input.destination) || !purposes.includes(input.purpose))
    throw new Error("目的と案内先を選んでください。");
  if (
    [input.company, input.name, input.companions, input.memo].some((value) => value.length > 2000)
  )
    throw new Error("入力内容は各2000文字以内にしてください。");
}

export function addVisit(data: Database, input: VisitInput, id: string, walkIn = false): Database {
  validateInput(input, data);
  if (data.visits.some((visit) => visit.id === id)) throw new Error("予約IDが重複しています。");
  const visit: Visit = {
    ...input,
    company: input.company.trim(),
    name: input.name.trim(),
    id,
    code: issueCode(data.visits),
    walkIn,
    cancelled: false,
    enteredAt: null,
    exitedAt: null,
    badge: null,
    returnedAt: null,
  };
  return { ...data, visits: [...data.visits, visit] };
}

export function editVisit(data: Database, id: string, input: VisitInput): Database {
  validateInput(input, data);
  const visit = data.visits.find((item) => item.id === id);
  if (!visit || visit.enteredAt || visit.cancelled)
    throw new Error("受付済み・取消済みの予約は編集できません。");
  return {
    ...data,
    visits: data.visits.map((item) => (item.id === id ? { ...item, ...input } : item)),
  };
}

export function cancelVisit(data: Database, id: string): Database {
  const visit = data.visits.find((item) => item.id === id);
  if (!visit || visit.enteredAt || visit.cancelled) throw new Error("この予約は取消できません。");
  return {
    ...data,
    visits: data.visits.map((item) => (item.id === id ? { ...item, cancelled: true } : item)),
  };
}

export function searchVisits(
  visits: Visit[],
  date: string,
  query: string,
  byCode = false,
): Visit[] {
  const normalized = query.normalize("NFKC").trim().toLocaleLowerCase();
  if (!normalized || (byCode && !/^\d{4}$/.test(normalized))) return [];
  return visits
    .filter(
      (visit) =>
        visit.date === date &&
        !visit.cancelled &&
        !visit.enteredAt &&
        (byCode
          ? visit.code === normalized
          : `${visit.name} ${visit.company}`
              .normalize("NFKC")
              .toLocaleLowerCase()
              .includes(normalized)),
    )
    .slice(0, 8);
}

export function maskedVisitor(visit: Visit): string {
  const company = [...visit.company];
  return `${company.slice(0, Math.max(1, Math.ceil(company.length / 2))).join("")}… 様 ／ ${[...visit.name][0]}◯ 様`;
}
