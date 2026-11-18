"use client";

import { duration, durationLabel, timeOf } from "@/lib/dates";
import type { Database, Visit } from "@/lib/types";
import { StatusBadge, Empty } from "./ui";

export function VisitTable({
  visits,
  data,
  now,
  log = false,
}: {
  visits: Visit[];
  data: Database;
  now: string;
  log?: boolean;
}) {
  if (!visits.length) return <Empty>該当する来訪はありません。</Empty>;
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label="来訪者一覧（横にスクロールできます）"
    >
      <table>
        <thead>
          <tr>
            <th>{log ? "来訪日 / 受付番号" : "予定 / 受付番号"}</th>
            <th>来訪者</th>
            <th>担当者 / 案内先</th>
            <th>状況</th>
            <th>入館 / 退館</th>
            <th>入館証</th>
            {log && (
              <>
                <th>滞在時間</th>
                <th>予約区分</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr key={visit.id}>
              <td>
                <strong className="tabular">{log ? visit.date : visit.time}</strong>
                <small>#{visit.code}</small>
              </td>
              <td>
                <a href={`/visits/${visit.id}`} className="visitor-link">
                  {visit.name}
                  <span> 様</span>
                </a>
                <small>
                  {visit.company} · {visit.count}名
                </small>
              </td>
              <td>
                {data.employees.find((employee) => employee.id === visit.employeeId)?.name}
                <small>{visit.destination}</small>
              </td>
              <td>
                <StatusBadge visit={visit} now={now} />
              </td>
              <td className="tabular">
                {timeOf(visit.enteredAt)}
                <span className="muted"> / </span>
                {timeOf(visit.exitedAt)}
                {visit.exitedAt && visit.exitedAt.slice(0, 10) !== visit.date && (
                  <small>退館 {visit.exitedAt.slice(0, 10)}</small>
                )}
              </td>
              <td>
                {visit.badge ? (
                  <>
                    <span className="badge-number">{visit.badge}</span>
                    <small>{visit.returnedAt ? "返却済み" : "貸出中"}</small>
                  </>
                ) : (
                  "—"
                )}
              </td>
              {log && (
                <>
                  <td>{durationLabel(duration(visit.enteredAt, visit.exitedAt, now))}</td>
                  <td>{visit.walkIn ? "予約なし" : "予約あり"}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
