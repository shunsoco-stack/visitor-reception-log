"use client";

import { useState } from "react";
import { useApp, mutate } from "./app-provider";
import { PageHeading, Empty } from "./ui";
import { VisitTable } from "./visit-table";
import { filterVisits } from "@/lib/stats";
import { addDays } from "@/lib/dates";
import { outstandingBadges, returnBadge } from "@/lib/badges";
import { csvFilename, generateCsv, downloadFile } from "@/lib/csv";

export function LogPage() {
  const { data, now } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [employee, setEmployee] = useState("");
  const [company, setCompany] = useState("");
  if (!data) return null;
  const start = from || addDays(now.slice(0, 10), -30);
  const end = to || now.slice(0, 10);
  const visits = filterVisits(data.visits, start, end, employee, company).filter(
    (visit) => visit.enteredAt,
  );
  const badges = outstandingBadges(data.visits);
  return (
    <>
      <PageHeading
        eyebrow="ENTRY & EXIT LOG"
        title="入退館記録"
        description="来訪履歴と入館証の返却状況を確認できます。"
        actions={
          <button
            className="button secondary"
            disabled={start > end || !visits.length}
            onClick={() =>
              downloadFile(
                generateCsv(visits, data, now),
                csvFilename(start, end),
                "text/csv;charset=utf-8",
              )
            }
          >
            ↓ CSVダウンロード
          </button>
        }
      />
      <section className="panel">
        <div className="filters">
          <label>
            開始日
            <input type="date" value={start} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            終了日
            <input type="date" value={end} onChange={(event) => setTo(event.target.value)} />
          </label>
          <label>
            担当者
            <select value={employee} onChange={(event) => setEmployee(event.target.value)}>
              <option value="">すべて</option>
              {data.employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            会社名
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="会社名で検索"
            />
          </label>
        </div>
        <div className="panel-heading">
          <h2>
            来訪履歴 <span className="count-pill">{visits.length}</span>
          </h2>
          <small>日本時間 / 館内の滞在時間は現在まで</small>
        </div>
        {start > end ? (
          <p className="error-text padded">終了日は開始日以降にしてください。</p>
        ) : (
          <VisitTable visits={visits} data={data} now={now} log />
        )}
      </section>
      <section className="panel spaced" id="badges">
        <div className="panel-heading">
          <h2>
            入館証の未返却一覧 <span className="count-pill">{badges.length}</span>
          </h2>
        </div>
        <p className="section-hint">期間の絞り込みにかかわらず、すべての未返却を表示します。</p>
        {badges.length ? (
          <div className="badge-list">
            {badges.map((visit) => (
              <div className="badge-row" key={visit.id}>
                <span className="badge-number">{visit.badge}</span>
                <div>
                  <strong>{visit.name} 様</strong>
                  <small>
                    {visit.company} · {visit.date} ·{" "}
                    {visit.exitedAt ? "退館済み・未返却" : "館内で使用中"}
                  </small>
                </div>
                {visit.exitedAt ? (
                  <button
                    className="button secondary"
                    onClick={() => mutate((current, time) => returnBadge(current, visit.id, time))}
                  >
                    返却を確認
                  </button>
                ) : (
                  <a className="text-link" href={`/visits/${visit.id}`}>
                    来訪詳細 →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty>未返却の入館証はありません。</Empty>
        )}
      </section>
    </>
  );
}
