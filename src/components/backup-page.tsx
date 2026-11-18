"use client";

import { useState } from "react";
import { useApp, mutate } from "./app-provider";
import { PageHeading } from "./ui";
import { importBackup, exportBackup } from "@/lib/backup";
import { downloadFile } from "@/lib/csv";
import type { Database } from "@/lib/types";
import { Icon } from "./icons";

export function BackupPage() {
  const { data, now } = useApp();
  const [pending, setPending] = useState<Database | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  return (
    <>
      <PageHeading
        eyebrow="DATA BACKUP"
        title="バックアップ"
        description="このブラウザの記録を、JSONファイルで保存・復元します。"
      />
      <div className="backup-grid">
        <section className="panel padded">
          <span className="feature-icon">
            <Icon name="backup" size={30} />
          </span>
          <h2>記録を手元に保存</h2>
          <p>来訪予約、入退館記録、通知、設定をまとめて書き出します。</p>
          <p className="muted">現在の来訪データ：{data.visits.length}件</p>
          <button
            className="button primary"
            onClick={() =>
              downloadFile(
                exportBackup(data),
                `来客受付バックアップ_${now.slice(0, 10)}.json`,
                "application/json",
              )
            }
          >
            JSONをダウンロード
          </button>
        </section>
        <section className="panel padded">
          <span className="feature-icon">
            <Icon name="log" size={30} />
          </span>
          <h2>バックアップから復元</h2>
          <p>ファイルの形式と記録の整合性を検証してから読み込みます。</p>
          <p className="muted">復元すると現在のデータ全体を置き換えます。</p>
          <div className="file-control">
            <input
              id="backup-file"
              className="visually-hidden"
              type="file"
              accept=".json,application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                setError("");
                setPending(null);
                if (!file) return;
                try {
                  if (file.size > 10_000_000) throw new Error("10MB以下のJSONを選んでください。");
                  const result = importBackup(await file.text());
                  setPending(result);
                  setFilename(file.name);
                } catch (caught) {
                  setError(
                    caught instanceof Error ? caught.message : "ファイルを読み取れませんでした。",
                  );
                }
              }}
            />
            <label htmlFor="backup-file" className="button secondary">
              バックアップを読み込む（JSON）
            </label>
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
      {pending && (
        <section className="panel padded spaced" role="region" aria-label="復元内容の確認">
          <h2>読み込み内容を確認</h2>
          <p>{filename}</p>
          <p>
            来訪 {pending.visits.length}件 ／ 通知 {pending.notices.length}件 ／ 担当者{" "}
            {pending.employees.length}名
          </p>
          <p>現在の記録を置き換えます。必要な記録は先にダウンロードしてください。</p>
          <div className="button-row">
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const result = await mutate(() => pending);
                setBusy(false);
                if (result) setPending(null);
              }}
            >
              この内容で復元する
            </button>
            <button className="button secondary" onClick={() => setPending(null)}>
              キャンセル
            </button>
          </div>
        </section>
      )}
      <div className="info-note">
        <Icon name="info" />
        <p>
          データは同じブラウザ内だけで共有されます。異なる端末で日常的に共有するには、サーバーが必要です。
        </p>
      </div>
    </>
  );
}
