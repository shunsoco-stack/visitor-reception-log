"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { PageHeading } from "./ui";
import { VisitForm } from "./visit-form";
import { VisitTable } from "./visit-table";
import { addDays } from "@/lib/dates";
import { filterVisits } from "@/lib/stats";
import type { Visit } from "@/lib/types";

export function VisitsPage() {
  const { data, now } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [company, setCompany] = useState("");
  const [saved, setSaved] = useState<Visit | null>(null);
  if (!data) return null;
  const date = now.slice(0, 10);
  const start = from || date;
  const end = to || addDays(date, 30);
  const visits = filterVisits(data.visits, start, end, "", company);
  return (
    <>
      <PageHeading
        eyebrow="VISIT RESERVATIONS"
        title="来訪予約"
        description="来訪前の準備を、ひとつずつ。受付番号は登録時に発行されます。"
        actions={
          <a className="button primary" href="#new">
            ＋ 予約を登録
          </a>
        }
      />
      <section className="panel">
        <div className="panel-heading">
          <h2>
            予約一覧 <span className="count-pill">{visits.length}</span>
          </h2>
        </div>
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
            会社名
            <input
              value={company}
              placeholder="会社名で絞り込み"
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
        </div>
        {start > end ? (
          <p className="error-text padded">終了日は開始日以降にしてください。</p>
        ) : (
          <VisitTable visits={visits} data={data} now={now} log />
        )}
      </section>
      <section className="panel spaced" id="new">
        <div className="panel-heading">
          <h2>新しい来訪予約</h2>
          <span className="muted">社員用</span>
        </div>
        {saved && (
          <div className="success-box" role="status">
            予約を登録しました。受付番号 <strong>{saved.code}</strong>
            <a href={`/visits/${saved.id}`}>予約詳細を開く →</a>
          </div>
        )}
        <VisitForm key={saved?.id ?? "new"} data={data} date={date} onSaved={setSaved} />
      </section>
    </>
  );
}
