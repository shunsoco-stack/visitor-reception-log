import { epoch } from "./dates";
import type { Database, Notice } from "./types";

export function createNotice(visitId: string, now: string): Notice {
  return { id: `notice-${visitId}`, visitId, createdAt: now, readAt: null, responderId: null };
}

export function overdue(notice: Notice, now: string): boolean {
  return !notice.readAt && epoch(now) - epoch(notice.createdAt) >= 5 * 60000;
}

export function acknowledge(
  data: Database,
  id: string,
  responderId: string,
  now: string,
): Database {
  const notice = data.notices.find((item) => item.id === id);
  if (!notice || notice.readAt || now < notice.createdAt)
    throw new Error("通知はすでに対応済みか、見つかりません。");
  if (!data.employees.some((employee) => employee.id === responderId))
    throw new Error("対応者を選んでください。");
  return {
    ...data,
    notices: data.notices.map((item) =>
      item.id === id ? { ...item, readAt: now, responderId } : item,
    ),
  };
}

export function receptionMessage(notice: Notice | undefined, now: string): string {
  if (notice?.readAt) return "担当者が向かっています。ロビーでお待ちください。";
  if (notice && overdue(notice, now))
    return "お待たせしております。総務にお繋ぎします。受付スタッフにお声がけください。";
  return "担当者に来訪をお知らせしました。ロビーでお待ちください。";
}
