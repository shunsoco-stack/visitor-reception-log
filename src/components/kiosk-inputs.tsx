"use client";

import type { Database, VisitInput } from "@/lib/types";

export function Keypad({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="keypad-form"
    >
      <label>
        4桁の受付番号
        <input
          className="code-input"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          required
          value={value}
          placeholder="0000"
          onChange={(event) =>
            onChange(event.target.value.normalize("NFKC").replace(/\D/g, "").slice(0, 4))
          }
          autoComplete="off"
        />
      </label>
      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "クリア", "0", "⌫"].map((key) => (
          <button
            type="button"
            key={key}
            aria-label={key === "⌫" ? "1文字消す" : key}
            onClick={() =>
              onChange(
                key === "クリア"
                  ? ""
                  : key === "⌫"
                    ? value.slice(0, -1)
                    : (value + key).slice(0, 4),
              )
            }
          >
            {key}
          </button>
        ))}
      </div>
      <button className="button primary kiosk-submit" disabled={value.length !== 4}>
        予約を確認する →
      </button>
    </form>
  );
}

export function WalkInForm({
  data,
  now,
  onConfirm,
}: {
  data: Database;
  now: string;
  onConfirm: (input: VisitInput) => void;
}) {
  return (
    <form
      className="walkin-form"
      onSubmit={(event) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        onConfirm({
          date: now.slice(0, 10),
          time: now.slice(11, 16),
          company: String(fields.get("company")),
          name: String(fields.get("name")),
          count: Number(fields.get("count")),
          companions: "",
          employeeId: String(fields.get("employeeId")),
          purpose: "その他",
          destination: data.destinations[0],
          memo: "予約なしでの来訪。受付端末から登録。",
        });
      }}
    >
      <label>
        会社名
        <input
          name="company"
          required
          maxLength={120}
          autoComplete="off"
          placeholder="個人の方は「個人」と入力"
        />
      </label>
      <label>
        お名前
        <input name="name" required maxLength={80} autoComplete="off" />
      </label>
      <label>
        人数（ご本人を含む）
        <input name="count" type="number" required min="1" max="99" defaultValue="1" />
      </label>
      <label>
        お約束の担当者
        <select name="employeeId" defaultValue="employee-0">
          {data.employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.id === "employee-0"
                ? "総務（担当者がわからない方）"
                : `${employee.name}（${employee.department}）`}
            </option>
          ))}
        </select>
      </label>
      <button className="button primary kiosk-submit">内容を確認する →</button>
    </form>
  );
}
