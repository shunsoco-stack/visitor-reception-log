"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp, mutate } from "./app-provider";
import { PageHeading } from "./ui";
import type { Database } from "@/lib/types";
import { outstandingBadges } from "@/lib/badges";

function SettingsForm({ data }: { data: Database }) {
  const [employees, setEmployees] = useState(data.employees);
  const [destinations, setDestinations] = useState(data.destinations);
  const [start, setStart] = useState(data.badgeStart);
  const [end, setEnd] = useState(data.badgeEnd);
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        await mutate((current) => {
          if (
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start < 1 ||
            end > 999 ||
            start > end
          )
            throw new Error(
              "入館証は1〜999の範囲で、開始番号以下にならない終了番号を指定してください。",
            );
          if (
            outstandingBadges(current.visits).some(
              (visit) =>
                Number(visit.badge!.slice(2)) < start || Number(visit.badge!.slice(2)) > end,
            )
          )
            throw new Error(
              "貸出中の入館証を範囲から外すことはできません。先に返却を確認してください。",
            );
          if (
            new Set(destinations.map((destination) => destination.trim())).size !==
            destinations.length
          )
            throw new Error("案内先の名前が重複しています。");
          if (
            JSON.stringify(current.employees) !== JSON.stringify(data.employees) ||
            JSON.stringify(current.destinations) !== JSON.stringify(data.destinations)
          )
            throw new Error("別タブで設定が更新されました。再読み込みしてから変更してください。");
          return {
            ...current,
            employees: employees.map((employee) => ({
              ...employee,
              name: employee.name.trim(),
              department: employee.department.trim(),
            })),
            destinations: destinations.map((item) => item.trim()),
            badgeStart: start,
            badgeEnd: end,
            visits: current.visits.map((visit) => ({
              ...visit,
              destination:
                destinations[data.destinations.indexOf(visit.destination)]?.trim() ??
                visit.destination,
            })),
          };
        });
        setBusy(false);
      }}
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>社員（来訪担当者）</h2>
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setEmployees([...employees, { id: crypto.randomUUID(), name: "", department: "" }])
            }
          >
            ＋ 担当者を追加
          </button>
        </div>
        <p className="section-hint">
          来訪の取次ぎ先です。社員の勤怠・入退室は管理しません。総務窓口は常に残ります。
        </p>
        <div className="settings-rows">
          {employees.map((employee, index) => (
            <div className="settings-row" key={employee.id}>
              <span className="avatar">{index + 1}</span>
              <label>
                氏名
                <input
                  required
                  maxLength={80}
                  value={employee.name}
                  onChange={(event) =>
                    setEmployees(
                      employees.map((item) =>
                        item.id === employee.id ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
              <label>
                部署
                <input
                  required
                  maxLength={80}
                  value={employee.department}
                  onChange={(event) =>
                    setEmployees(
                      employees.map((item) =>
                        item.id === employee.id
                          ? { ...item, department: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </section>
      <section className="panel spaced">
        <div className="panel-heading">
          <h2>案内先</h2>
          <button
            type="button"
            className="button secondary"
            onClick={() => setDestinations([...destinations, ""])}
          >
            ＋ 案内先を追加
          </button>
        </div>
        <div className="form-grid padded">
          {destinations.map((destination, index) => (
            <label key={index}>
              案内先 {index + 1}
              <input
                required
                maxLength={120}
                value={destination}
                onChange={(event) =>
                  setDestinations(
                    destinations.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
              />
            </label>
          ))}
        </div>
      </section>
      <section className="panel spaced">
        <div className="panel-heading">
          <h2>入館証の番号範囲</h2>
        </div>
        <div className="form-grid padded">
          <label>
            開始番号（V-）
            <input
              required
              type="number"
              min="1"
              max="999"
              value={start}
              onChange={(event) => setStart(Number(event.target.value))}
            />
          </label>
          <label>
            終了番号（V-）
            <input
              required
              type="number"
              min="1"
              max="999"
              value={end}
              onChange={(event) => setEnd(Number(event.target.value))}
            />
          </label>
        </div>
        <p className="section-hint">返却が確認された入館証から、小さい番号順に自動割当します。</p>
      </section>
      <div className="form-footer">
        <p>変更はこのブラウザ内に保存されます。</p>
        <button className="button primary" disabled={busy}>
          {busy ? "保存中…" : "設定を保存"}
        </button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const { data } = useApp();
  if (!data) return null;
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE SETTINGS"
        title="設定"
        description="来訪時の取次ぎ先と、入館証の運用を設定します。"
      />
      <div className="utility-links">
        <Link href="/backup">バックアップ →</Link>
        <Link href="/about">このデモについて →</Link>
        <Link href="/kiosk" target="_blank">
          受付画面 →
        </Link>
      </div>
      <SettingsForm
        key={JSON.stringify([data.employees, data.destinations, data.badgeStart, data.badgeEnd])}
        data={data}
      />
    </>
  );
}
