"use client";

import { useCallback, useEffect, useState } from "react";
import { mutate, useApp } from "./app-provider";
import { Icon } from "./icons";
import { Keypad, WalkInForm } from "./kiosk-inputs";
import { addVisit, maskedVisitor, searchVisits } from "@/lib/visits";
import { checkIn, checkOut, findDeparture } from "@/lib/reception";
import { receptionMessage } from "@/lib/notices";
import type { VisitInput } from "@/lib/types";

type Step =
  | "home"
  | "code"
  | "search"
  | "walkin"
  | "confirm"
  | "done"
  | "departure"
  | "departure-confirm"
  | "departed";

export function Kiosk() {
  const { data, now, message } = useApp();
  const [step, setStep] = useState<Step>("home");
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [walkIn, setWalkIn] = useState<VisitInput | null>(null);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [returned, setReturned] = useState(false);
  const reset = useCallback(() => {
    setStep("home");
    setCode("");
    setQuery("");
    setSelected("");
    setWalkIn(null);
    setError("");
    setFailed(false);
    setReturned(false);
  }, []);
  useEffect(() => {
    let timer = window.setTimeout(reset, 60000);
    const touch = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(reset, 60000);
    };
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    window.addEventListener("input", touch);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      window.removeEventListener("input", touch);
    };
  }, [reset]);
  if (!data)
    return (
      <main className="kiosk">
        <div className="kiosk-card">{message || "受付を準備しています…"}</div>
      </main>
    );
  const selectedVisit = data.visits.find((visit) => visit.id === selected);
  const candidates = searchVisits(data.visits, now.slice(0, 10), query);
  const notice = data.notices.find((item) => item.visitId === selected);
  function go(next: Step) {
    setStep(next);
    setError("");
    setFailed(false);
  }
  async function receive() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const id = walkIn ? crypto.randomUUID() : selected;
    const result = await mutate((current, time) => {
      const next = walkIn
        ? addVisit(
            current,
            { ...walkIn, date: time.slice(0, 10), time: time.slice(11, 16) },
            id,
            true,
          )
        : current;
      return checkIn(next, id, time);
    });
    setBusy(false);
    if (result) {
      setSelected(id);
      setWalkIn(null);
      go("done");
    } else setFailed(true);
  }
  async function depart() {
    if (busy || !returned) return;
    setBusy(true);
    setFailed(false);
    const result = await mutate((current, time) => checkOut(current, selected, time, true));
    setBusy(false);
    if (result) go("departed");
    else setFailed(true);
  }
  const headings: Record<Step, string> = {
    home: "ようこそ、お越しくださいました。",
    code: "受付番号を入力してください",
    search: "お名前・会社名でお探しします",
    walkin: "ご来訪についてお聞かせください",
    confirm: "こちらの内容で受付します",
    done: "受付が完了しました",
    departure: "お帰り・お呼び出し状況の確認",
    "departure-confirm": "入館証の返却をお願いします",
    departed: "ご来訪ありがとうございました",
  };
  return (
    <main className="kiosk">
      <header className="kiosk-header">
        <div className="kiosk-brand">
          <span className="brand-mark">
            <Icon name="people" size={26} />
          </span>
          <div>
            AOZORA<span>あおぞらシステムズ 本社（架空）</span>
          </div>
        </div>
        <time>
          {now.slice(0, 10).replaceAll("-", " / ")}
          <strong>{now.slice(11, 16)}</strong>
        </time>
      </header>
      <section className={`kiosk-content ${step === "home" ? "kiosk-home" : ""}`}>
        <span className="eyebrow">
          {step === "home" ? "WELCOME TO AOZORA" : "VISITOR RECEPTION"}
        </span>
        <h1>{headings[step]}</h1>
        {step === "home" && <p className="kiosk-intro">ご希望のお手続きをお選びください。</p>}
        {(error || failed) && (
          <div role="alert" className="kiosk-error">
            {error || message}
          </div>
        )}
        {step === "home" && (
          <>
            <div className="kiosk-choices">
              <button className="kiosk-choice featured" onClick={() => go("code")}>
                <span className="choice-icon">
                  <Icon name="tablet" size={34} />
                </span>
                <span>
                  <strong>受付番号で受付</strong>
                  <small>4桁の受付番号をお持ちの方</small>
                </span>
                <Icon name="arrow" />
              </button>
              <button className="kiosk-choice" onClick={() => go("search")}>
                <span className="choice-icon">
                  <Icon name="search" size={34} />
                </span>
                <span>
                  <strong>お名前・会社名で探す</strong>
                  <small>お約束のある方</small>
                </span>
                <Icon name="arrow" />
              </button>
              <button className="kiosk-choice" onClick={() => go("walkin")}>
                <span className="choice-icon">
                  <Icon name="people" size={34} />
                </span>
                <span>
                  <strong>予約のない方</strong>
                  <small>担当者がおわかりにならない方もこちら</small>
                </span>
                <Icon name="arrow" />
              </button>
            </div>
            <button className="kiosk-departure" onClick={() => go("departure")}>
              <Icon name="exit" />
              お帰りの方・お呼び出し状況を確認する
              <Icon name="arrow" size={18} />
            </button>
            <p className="kiosk-help">お困りの際は、お近くの受付スタッフへお声がけください。</p>
          </>
        )}
        {step === "code" && (
          <div className="kiosk-card">
            <Keypad
              value={code}
              onChange={setCode}
              onSubmit={() => {
                const found = searchVisits(data.visits, now.slice(0, 10), code, true)[0];
                if (found) {
                  setSelected(found.id);
                  go("confirm");
                } else
                  setError(
                    "本日の未受付の予約が見つかりません。番号をご確認いただくか、受付スタッフにお声がけください。",
                  );
              }}
            />
          </div>
        )}
        {step === "search" && (
          <div className="kiosk-card">
            <label>
              お名前 または 会社名
              <input
                autoComplete="off"
                value={query}
                maxLength={120}
                placeholder="例：山岸 / みなと"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <p className="kiosk-hint">個人情報保護のため、お名前と会社名の一部を伏せています。</p>
            <div className="candidate-list">
              {candidates.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => {
                    setSelected(visit.id);
                    go("confirm");
                  }}
                >
                  <span>
                    <strong>{maskedVisitor(visit)}</strong>
                    <small>{visit.time} ご来訪予定</small>
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
            {query && !candidates.length && (
              <p>本日の未受付の予約が見つかりません。別の表記でお試しください。</p>
            )}
          </div>
        )}
        {step === "walkin" && (
          <div className="kiosk-card">
            <WalkInForm
              data={data}
              now={now}
              onConfirm={(input) => {
                setWalkIn(input);
                go("confirm");
              }}
            />
          </div>
        )}
        {step === "confirm" && (selectedVisit || walkIn) && (
          <div className="kiosk-card confirmation">
            <span className="confirmation-icon">
              <Icon name="people" size={32} />
            </span>
            <h2>
              {walkIn ? `${walkIn.company} ／ ${walkIn.name} 様` : maskedVisitor(selectedVisit!)}
            </h2>
            <p>
              {walkIn?.count ?? selectedVisit?.count}名様 · 担当：
              {
                data.employees.find(
                  (employee) => employee.id === (walkIn?.employeeId ?? selectedVisit?.employeeId),
                )?.name
              }
            </p>
            <p>受付すると担当者に来訪をお知らせします。</p>
            <button className="button primary kiosk-submit" disabled={busy} onClick={receive}>
              {busy ? "受付中…" : "受付する"}
            </button>
          </div>
        )}
        {step === "done" && selectedVisit && (
          <div className="kiosk-card completion">
            <span className="completion-check">
              <Icon name="check" size={38} />
            </span>
            <h2>{receptionMessage(notice, now)}</h2>
            <div className="assigned-badge">
              <span>こちらの番号の入館証をお取りください</span>
              <strong>{selectedVisit.badge}</strong>
              <small>1組につき1枚 · お帰りの際にご返却ください</small>
            </div>
            <p>
              受付番号：<strong>{selectedVisit.code}</strong> ／ 入館{" "}
              {selectedVisit.enteredAt?.slice(11, 16)}
            </p>
            <p className="kiosk-hint">
              お呼び出し状況は最初の画面から、入館証番号で再確認できます。
              <br />
              5分以上お待ちの場合は総務でお取り次ぎします。
            </p>
            <button className="button secondary" onClick={reset}>
              最初の画面に戻る
            </button>
          </div>
        )}
        {step === "departure" && (
          <form
            className="kiosk-card"
            onSubmit={(event) => {
              event.preventDefault();
              const found = findDeparture(data.visits, code);
              if (found) {
                setSelected(found.id);
                go("departure-confirm");
              } else
                setError("館内の記録が見つかりません。入館証番号または受付番号をご確認ください。");
            }}
          >
            <label>
              入館証番号 または 受付番号
              <input
                autoComplete="off"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={10}
                placeholder="例：V-07 または 2401"
                required
              />
            </label>
            <button className="button primary kiosk-submit">記録を確認する →</button>
          </form>
        )}
        {step === "departure-confirm" && selectedVisit && (
          <div className="kiosk-card confirmation">
            <div className="assigned-badge">
              <span>入館証番号</span>
              <strong>{selectedVisit.badge}</strong>
            </div>
            <p role="status">{receptionMessage(notice, now)}</p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={returned}
                onChange={(event) => setReturned(event.target.checked)}
              />
              入館証を返却ボックスに戻しました
            </label>
            <button
              className="button primary kiosk-submit"
              disabled={!returned || busy}
              onClick={depart}
            >
              {busy ? "記録中…" : "退館を記録する"}
            </button>
            <small>まだお待ちの方は「最初の画面に戻る」を押してください。</small>
          </div>
        )}
        {step === "departed" && (
          <div className="kiosk-card completion">
            <span className="completion-check">
              <Icon name="check" size={38} />
            </span>
            <h2>退館と入館証の返却を記録しました。</h2>
            <p>お気をつけてお帰りください。</p>
            <button className="button primary kiosk-submit" onClick={reset}>
              最初の画面に戻る
            </button>
          </div>
        )}
        {step !== "home" && step !== "departed" && step !== "done" && (
          <button className="kiosk-back" onClick={reset}>
            ← 最初の画面に戻る
          </button>
        )}
      </section>
      <footer className="kiosk-footer">
        <span>デモ用の架空データです</span>
        <span>60秒間操作がないと最初の画面に戻ります</span>
      </footer>
    </main>
  );
}
