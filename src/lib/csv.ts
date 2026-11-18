import { duration } from "./dates";
import type { Database, Visit } from "./types";

export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvFilename(from: string, to: string): string {
  return `入退館記録_${from}_${to}.csv`;
}

export function generateCsv(visits: Visit[], data: Database, now: string): string {
  const rows: unknown[][] = [
    [
      "来訪日",
      "受付番号",
      "会社",
      "氏名",
      "人数",
      "担当者",
      "入館日時",
      "退館日時",
      "滞在時間（分）",
      "入館証",
      "返却日時",
      "予約区分",
    ],
  ];
  for (const visit of visits.filter((item) => item.enteredAt)) {
    rows.push([
      visit.date,
      visit.code,
      visit.company,
      visit.name,
      visit.count,
      data.employees.find((employee) => employee.id === visit.employeeId)?.name,
      visit.enteredAt?.replace("T", " "),
      visit.exitedAt?.replace("T", " "),
      duration(visit.enteredAt, visit.exitedAt, now),
      visit.badge,
      visit.returnedAt?.replace("T", " "),
      visit.walkIn ? "予約なし" : "予約あり",
    ]);
  }
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadFile(content: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
