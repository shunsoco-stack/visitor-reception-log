"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "./app-provider";
import { PageHeading, Empty } from "./ui";
import { Icon } from "./icons";
import { VisitTable } from "./visit-table";
import { todayStats, filterVisits, status } from "@/lib/stats";
import { inside } from "@/lib/reception";
import { overdue } from "@/lib/notices";
import { outstandingBadges } from "@/lib/badges";

export function Today() {
  const { data, now } = useApp();
  const [tab, setTab] = useState("すべて");
  if (!data) return null;
  const date = now.slice(0, 10);
  const stats = todayStats(data.visits, date);
  const today = filterVisits(data.visits, date, date).filter((visit) => !visit.cancelled);
  const visible = today.filter(
    (visit) =>
      tab === "すべて" || (tab === "到着済み" ? !!visit.enteredAt : status(visit, now) === tab),
  );
  const waiting = data.notices.filter((notice) => !notice.readAt);
  const remaining = data.visits.filter(inside);
  const overdueCount = waiting.filter((notice) => overdue(notice, now)).length;
  const notReturned = outstandingBadges(data.visits).filter((visit) => visit.exitedAt);
  return (
    <>
      <PageHeading
        eyebrow="TODAY'S RECEPTION"
        title="今日の来訪"
        description="来訪予定と受付状況を、ひと目で確認。"
        actions={
          <>
            <Link className="button secondary" href="/kiosk" target="_blank">
              <Icon name="tablet" size={18} />
              受付画面
            </Link>
            <Link className="button primary" href="/visits#new">
              ＋ 来訪予約を登録
            </Link>
          </>
        }
      />
      <div className="date-line">
        <span>
          {date.replaceAll("-", " / ")}{" "}
          <span className="muted">
            {
              ["日", "月", "火", "水", "木", "金", "土"][
                new Date(`${date}T12:00:00+09:00`).getUTCDay()
              ]
            }
            曜日
          </span>
        </span>
        <small>
          <span className="live-dot" /> {now.slice(11, 16)} 時点 · 自動更新
        </small>
      </div>
      <div className="stats-grid">
        {[
          ["本日の来訪", stats.total, "calendar", "組の来訪予定"],
          ["到着済み", stats.arrived, "check", `未受付 ${stats.scheduled}組`],
          ["現在館内", stats.inside, "people", "退館の記録を確認"],
          ["退館済み", stats.departed, "exit", "本日の受付完了"],
        ].map(([label, value, icon, caption], index) => (
          <div className={`stat-card ${index === 2 ? "highlight" : ""}`} key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <Icon name={String(icon)} size={20} />
            </div>
            <div className="stat-value">
              {value}
              <span>組</span>
            </div>
            <small>{caption}</small>
          </div>
        ))}
      </div>
      {waiting.length > 0 && (
        <Link href="/notices" className={`arrival-banner ${overdueCount ? "attention" : ""}`}>
          <span className="banner-icon">
            <Icon name="bell" />
          </span>
          <div>
            <strong>{waiting.length}件の来訪通知が未対応です</strong>
            <p>
              {overdueCount
                ? `${overdueCount}件が到着から5分以上経過しています。総務での取次ぎをお願いします。`
                : "来訪者がロビーでお待ちです。担当者は「対応します」を押してください。"}
            </p>
          </div>
          <Icon name="arrow" />
        </Link>
      )}
      <div className="dashboard-columns">
        <section className="panel schedule-panel">
          <div className="panel-heading">
            <h2>
              本日のスケジュール <span className="count-pill">{today.length}</span>
            </h2>
            <Link href="/visits" className="text-link">
              予約一覧を見る →
            </Link>
          </div>
          <div className="tabs" role="group" aria-label="来訪状況の絞り込み">
            {["すべて", "予定", "到着済み", "館内", "退館済み", "遅れ"].map((label) => (
              <button
                key={label}
                className={tab === label ? "selected" : ""}
                onClick={() => setTab(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <VisitTable visits={visible} data={data} now={now} />
        </section>
        <aside className="today-aside">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <span className="live-dot" />
                館内の来訪者
              </h2>
              <span className="count-pill">{remaining.length}</span>
            </div>
            <p className="section-hint">退館記録のない方を表示しています。</p>
            {remaining.length ? (
              remaining.map((visit) => (
                <a className="inside-card" href={`/visits/${visit.id}`} key={visit.id}>
                  <div className="initial">{visit.name[0]}</div>
                  <div>
                    <strong>{visit.name} 様</strong>
                    <small>{visit.company}</small>
                    <span>
                      {visit.badge} · {visit.enteredAt?.slice(11, 16)} 入館
                    </span>
                  </div>
                  <Icon name="arrow" size={16} />
                </a>
              ))
            ) : (
              <Empty>現在、館内の来訪者はいません。</Empty>
            )}
          </section>
          <section className="panel badge-panel">
            <Icon name="info" />
            <h2>入館証の返却確認</h2>
            <p>
              退館済み・未返却 <strong>{notReturned.length}件</strong>
            </p>
            <Link className="text-link" href="/log#badges">
              貸出・返却状況を確認 →
            </Link>
          </section>
          <div className="privacy-note">
            <Icon name="info" size={18} />
            <p>受付タブレットは別タブで開けます。同じブラウザ内の操作が即時に反映されます。</p>
          </div>
        </aside>
      </div>
    </>
  );
}
