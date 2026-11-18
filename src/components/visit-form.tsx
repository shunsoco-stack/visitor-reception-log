"use client";

import { useState } from "react";
import type { Database, Visit, VisitInput } from "@/lib/types";
import { purposes } from "@/lib/types";
import { addVisit, editVisit } from "@/lib/visits";
import { mutate } from "./app-provider";

export function VisitForm({
  data,
  date,
  visit,
  onSaved,
}: {
  data: Database;
  date: string;
  visit?: Visit;
  onSaved: (visit: Visit) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const input = Object.fromEntries(fields) as unknown as VisitInput;
    input.count = Number(fields.get("count"));
    setBusy(true);
    const id = visit?.id ?? crypto.randomUUID();
    const result = await mutate((current) =>
      visit ? editVisit(current, id, input) : addVisit(current, input, id),
    );
    setBusy(false);
    if (result) {
      setError("");
      onSaved(result.visits.find((item) => item.id === id)!);
    } else setError("保存できませんでした。画面上部のメッセージをご確認ください。");
  }
  return (
    <form onSubmit={submit} className="visit-form">
      <div className="form-grid">
        <label>
          来訪日 <span className="required">必須</span>
          <input required type="date" name="date" defaultValue={visit?.date ?? date} />
        </label>
        <label>
          予定時刻 <span className="required">必須</span>
          <input required type="time" name="time" defaultValue={visit?.time ?? "10:00"} />
        </label>
        <label>
          会社名 <span className="required">必須</span>
          <input
            required
            name="company"
            maxLength={120}
            placeholder="例：みなと通商"
            defaultValue={visit?.company}
          />
        </label>
        <label>
          来訪者氏名 <span className="required">必須</span>
          <input
            required
            name="name"
            maxLength={80}
            placeholder="例：山岸 拓海"
            defaultValue={visit?.name}
          />
        </label>
        <label>
          人数（代表者を含む）
          <input
            required
            name="count"
            type="number"
            min="1"
            max="99"
            defaultValue={visit?.count ?? 1}
          />
        </label>
        <label>
          同行者名（任意）
          <input
            name="companions"
            maxLength={500}
            placeholder="複数の場合は読点で区切ってください"
            defaultValue={visit?.companions}
          />
        </label>
        <label>
          担当者 <span className="required">必須</span>
          <select required name="employeeId" defaultValue={visit?.employeeId ?? "employee-0"}>
            {data.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}（{employee.department}）
              </option>
            ))}
          </select>
        </label>
        <label>
          目的
          <select name="purpose" defaultValue={visit?.purpose ?? "打合せ"}>
            {purposes.map((purpose) => (
              <option key={purpose}>{purpose}</option>
            ))}
          </select>
        </label>
        <label className="full-width">
          案内先
          <select name="destination" defaultValue={visit?.destination ?? data.destinations[0]}>
            {data.destinations.map((destination) => (
              <option key={destination}>{destination}</option>
            ))}
          </select>
        </label>
        <label className="full-width">
          メモ（社員側のみ表示）
          <textarea
            name="memo"
            rows={3}
            maxLength={2000}
            placeholder="当日の取次ぎ事項など"
            defaultValue={visit?.memo}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="form-footer">
        <small>受付番号は登録時に自動発行します。入館証は1組につき1枚です。</small>
        <button className="button primary" disabled={busy}>
          {busy ? "保存中…" : visit ? "変更を保存" : "来訪予約を登録"}
        </button>
      </div>
    </form>
  );
}
