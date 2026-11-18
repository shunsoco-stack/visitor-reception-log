"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApp, mutate, announce } from "./app-provider";
import { PageHeading, StatusBadge, Empty } from "./ui";
import { VisitForm } from "./visit-form";
import { cancelVisit } from "@/lib/visits";
import { checkOut, inside } from "@/lib/reception";
import { returnBadge } from "@/lib/badges";

export function VisitDetail() {
  const pathname = usePathname();
  const { data, now } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [returned, setReturned] = useState(true);
  if (!data) return null;
  const id = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "");
  const visit = data.visits.find((item) => item.id === id);
  if (!visit)
    return (
      <Empty>
        予約が見つかりません。
        <Link className="text-link" href="/visits">
          予約一覧へ戻る
        </Link>
      </Empty>
    );
  return (
    <>
      <Link className="back-link" href="/visits">
        ← 予約一覧に戻る
      </Link>
      <PageHeading
        eyebrow="VISIT DETAILS"
        title={`${visit.name} 様の来訪`}
        description={`${visit.company} · ${visit.date} ${visit.time} · ${visit.count}名`}
        actions={<StatusBadge visit={visit} now={now} />}
      />
      <section className="panel detail-summary">
        <div>
          <small>受付番号</small>
          <strong className="reception-code">{visit.code}</strong>
        </div>
        <div>
          <small>入館日時</small>
          <strong>{visit.enteredAt?.replace("T", " ") ?? "未受付"}</strong>
        </div>
        <div>
          <small>退館日時</small>
          <strong>{visit.exitedAt?.replace("T", " ") ?? "未退館"}</strong>
        </div>
        <div>
          <small>入館証</small>
          <strong>{visit.badge ?? "受付時に発行"}</strong>
          <small>{visit.badge && (visit.returnedAt ? "返却済み" : "未返却")}</small>
        </div>
      </section>
      {!visit.enteredAt && !visit.cancelled ? (
        <section className="panel spaced">
          <div className="panel-heading">
            <h2>予約内容の編集</h2>
          </div>
          <VisitForm
            data={data}
            date={visit.date}
            visit={visit}
            onSaved={() => announce("予約内容を更新しました。")}
          />
          <div className="danger-zone">
            {confirm ? (
              <>
                <p>この来訪予約を取り消しますか？</p>
                <button
                  className="button danger"
                  onClick={async () => {
                    await mutate((current) => cancelVisit(current, visit.id));
                    setConfirm(false);
                  }}
                >
                  取消を確定
                </button>
                <button className="button secondary" onClick={() => setConfirm(false)}>
                  戻る
                </button>
              </>
            ) : (
              <button className="button danger" onClick={() => setConfirm(true)}>
                この予約を取り消す
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="panel padded spaced">
          <h2>来訪内容</h2>
          <dl className="detail-list">
            <dt>担当者</dt>
            <dd>{data.employees.find((employee) => employee.id === visit.employeeId)?.name}</dd>
            <dt>目的・案内先</dt>
            <dd>
              {visit.purpose} · {visit.destination}
            </dd>
            <dt>同行者</dt>
            <dd>{visit.companions || "なし"}</dd>
            <dt>メモ</dt>
            <dd className="preserve-lines">{visit.memo || "なし"}</dd>
          </dl>
          {inside(visit) && (
            <div className="action-box">
              <h3>社員側で退館を記録</h3>
              <p>来訪者の退館を確認してから操作してください。現在時刻を記録します。</p>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={returned}
                  onChange={(event) => setReturned(event.target.checked)}
                />
                入館証の返却を確認しました
              </label>
              <button
                className="button primary"
                onClick={() =>
                  mutate((current, time) => checkOut(current, visit.id, time, returned))
                }
              >
                退館を記録
              </button>
            </div>
          )}
          {visit.exitedAt && !visit.returnedAt && (
            <button
              className="button secondary"
              onClick={() => mutate((current, time) => returnBadge(current, visit.id, time))}
            >
              入館証の返却を確認して記録
            </button>
          )}
        </section>
      )}
    </>
  );
}
