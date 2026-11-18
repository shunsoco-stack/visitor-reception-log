"use client";

import { useState } from "react";
import { mutate } from "./app-provider";
import { PageHeading } from "./ui";
import { createSeed } from "@/lib/seed";

export function AboutPage() {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="ABOUT THIS DEMO"
        title="このデモについて"
        description="来客の到着からお帰りまでを、スムーズにつなぐ受付アプリ。"
      />
      <section className="panel padded prose">
        <h2>デモ用の架空データです</h2>
        <p>
          あおぞらシステムズ
          本社を舞台にした、社員50〜150人のオフィス向けデモです。会社名・氏名・来訪内容はすべて架空で、実在する企業・個人とは無関係です。
        </p>
        <h2>このアプリでできること</h2>
        <p>
          社員が来訪予約を登録し、来訪者が受付タブレットで受付します。入館・退館の時刻、入館証の貸出・返却、担当者の対応状況を一連の記録として確認できます。入館証は代表者へ1組につき1枚貸し出します。
        </p>
        <h2>保存と通知の範囲</h2>
        <p>
          データはlocalStorage（キー：vrl:v1）に保存されます。同じブラウザ・同じオリジンの別タブは即時に同期します。メールやSMS、チャット、プッシュ通知、外部APIへの送信は行いません。総務への取次ぎも画面内表示です。認証はなく、社員画面と受付画面の切替は権限制御ではありません。
        </p>
        <p>
          実運用では受付端末と社員端末を共有するためのサーバーと、認証・アクセス制御が必要です。実際の個人情報は入力せず、架空データでお試しください。
        </p>
        <h2>日時の扱い</h2>
        <p>
          日時は日本時間です。初回起動時の日時から、過去約2か月の記録を生成します。平日の日中は今日の到着・退館・遅れを生成し、早朝・夜間は今日の入館記録を作りません。土日祝は本日の予約を作りません。保存済みデータは日付が変わっても保持します。
        </p>
        <h2>既存作品との違い</h2>
        <p>
          公開予約の空き枠、会議室の予約、顧客管理、社員の勤怠・入退室管理は扱いません。来訪者の受付と入退館記録に焦点を絞っています。
        </p>
      </section>
      <section className="panel padded spaced">
        <h2>既定データに戻す</h2>
        <p>
          現在の日時を基準に架空データを再生成します。追加・編集した記録もすべて置き換わります。
        </p>
        {confirm ? (
          <div className="action-box">
            <p>必要な記録のバックアップは保存しましたか？ この操作は取り消せません。</p>
            <div className="button-row">
              <button
                className="button danger"
                onClick={async () => {
                  const result = await mutate((_, now) => createSeed(now));
                  if (result) setConfirm(false);
                }}
              >
                すべて置き換えて初期化する
              </button>
              <button className="button secondary" onClick={() => setConfirm(false)}>
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button className="button danger" onClick={() => setConfirm(true)}>
            既定データに戻す
          </button>
        )}
      </section>
    </>
  );
}
