const { test } = require("node:test");
const assert = require("node:assert/strict");
const { emptyData, input, now } = require("./helpers");
const { createSeed } = require("../src/lib/seed.ts");
const { addVisit } = require("../src/lib/visits.ts");
const { checkIn } = require("../src/lib/reception.ts");
const { importBackup, exportBackup, validateDatabase } = require("../src/lib/backup.ts");
const {
  japanNow,
  addDays,
  duration,
  durationLabel,
  isDate,
  businessDay,
} = require("../src/lib/dates.ts");
const { filterVisits, status } = require("../src/lib/stats.ts");
const { generateCsv, csvFilename, csvCell } = require("../src/lib/csv.ts");
const { loadData, saveData, STORAGE_KEY } = require("../src/lib/storage.ts");

test("空文字の保存データも破損として復旧", () => {
  assert.equal(loadData("", now).recovered, true);
});

test("バックアップの書出しと復元が一致", () => {
  const data = createSeed(now);
  assert.deepEqual(importBackup(exportBackup(data)), data);
});
test("壊れたJSONを拒否", () => assert.throws(() => importBackup('{"version":')));
test("未知のバージョンを拒否", () =>
  assert.equal(validateDatabase({ ...emptyData(), version: 2 }), false));
test("配列やnullをバックアップとして拒否", () => {
  assert.equal(validateDatabase(null), false);
  assert.equal(validateDatabase([]), false);
});
for (const [label, corrupt] of [
  [
    "番号重複",
    (data) => {
      data.visits[1].code = data.visits[0].code;
    },
  ],
  [
    "ID重複",
    (data) => {
      data.visits[1].id = data.visits[0].id;
    },
  ],
  [
    "人数文字列",
    (data) => {
      data.visits[0].count = "1";
    },
  ],
  [
    "担当者参照不正",
    (data) => {
      data.visits[0].employeeId = "none";
    },
  ],
  [
    "日付不正",
    (data) => {
      data.visits[0].date = "2026-02-30";
    },
  ],
  [
    "時刻不正",
    (data) => {
      data.visits[0].enteredAt = "yesterday";
    },
  ],
  [
    "退館が入館より前",
    (data) => {
      data.visits[0].exitedAt = "2000-01-01T00:00:00";
    },
  ],
  [
    "返却が退館より前",
    (data) => {
      data.visits[1].returnedAt = "2000-01-01T00:00:00";
    },
  ],
  [
    "通知参照不正",
    (data) => {
      data.notices[0].visitId = "none";
    },
  ],
  [
    "通知欠落",
    (data) => {
      data.notices.pop();
    },
  ],
  [
    "対応者参照不正",
    (data) => {
      data.notices[0].responderId = "none";
    },
  ],
  [
    "入館証範囲逆転",
    (data) => {
      data.badgeStart = 50;
    },
  ],
  [
    "入館証なしの入館",
    (data) => {
      data.visits[0].badge = null;
    },
  ],
  [
    "総務窓口欠落",
    (data) => {
      data.employees = data.employees.filter((employee) => employee.id !== "employee-0");
    },
  ],
]) {
  test(`不正なバックアップを拒否：${label}`, () => {
    const data = createSeed(now);
    corrupt(data);
    assert.throws(() => importBackup(JSON.stringify(data)));
  });
}
test("貸出中の入館証重複を拒否", () => {
  const data = createSeed(now);
  data.visits[1].badge = data.visits[0].badge;
  data.visits[0].returnedAt = null;
  data.visits[1].returnedAt = null;
  assert.equal(validateDatabase(data), false);
});
test("初回読み込みでは既定データを生成", () => {
  const result = loadData(null, now);
  assert.ok(validateDatabase(result.data));
  assert.equal(result.recovered, false);
});
test("壊れた保存データを復旧して通知フラグ", () => {
  const result = loadData("bad-json", now);
  assert.ok(validateDatabase(result.data));
  assert.equal(result.recovered, true);
});
test("保存済みデータは翌日も保持", () => {
  const data = createSeed(now);
  assert.deepEqual(loadData(exportBackup(data), "2026-11-19T12:00:00").data, data);
});
test("保存キーがvrl:v1", () => {
  let saved;
  saveData(
    {
      setItem: (key, value) => {
        saved = [key, value];
      },
    },
    emptyData(),
  );
  assert.equal(saved[0], STORAGE_KEY);
  assert.equal(saved[0], "vrl:v1");
  assert.ok(validateDatabase(JSON.parse(saved[1])));
});
test("容量超過を呼出元に返す", () =>
  assert.throws(() =>
    saveData(
      {
        setItem: () => {
          throw new Error("quota");
        },
      },
      emptyData(),
    ),
  ));
test("UTCから日本時間に変換", () =>
  assert.equal(japanNow(new Date("2026-11-17T15:10:00Z")), "2026-11-18T00:10:00"));
test("日付加算で月を跨ぐ", () => assert.equal(addDays("2026-11-30", 1), "2026-12-01"));
test("存在しない日付を拒否", () => assert.equal(isDate("2026-02-29"), false));
test("うるう年の日付を許容", () => assert.equal(isDate("2028-02-29"), true));
test("振替休日を除く", () => assert.equal(businessDay("2026-05-06"), false));
test("国民の休日を除く", () => assert.equal(businessDay("2026-09-22"), false));
test("滞在時間を分で計算", () => assert.equal(duration(now, "2026-11-18T13:35:00", now), 95));
test("未退館は現在までの滞在時間", () =>
  assert.equal(duration(now, null, "2026-11-18T12:15:00"), 15));
test("滞在時間は日付跨ぎに対応", () =>
  assert.equal(duration("2026-11-17T23:50:00", null, "2026-11-18T00:20:00"), 30));
test("滞在時間の和文表示", () => assert.equal(durationLabel(95), "1時間35分"));
test("期間・担当・会社で絞込", () => {
  const data = createSeed(now);
  const results = filterVisits(data.visits, "2026-11-01", "2026-11-18", "employee-1", "みなと");
  assert.ok(results.length);
  assert.ok(
    results.every(
      (visit) =>
        visit.date >= "2026-11-01" &&
        visit.date <= "2026-11-18" &&
        visit.employeeId === "employee-1" &&
        visit.company.includes("みなと"),
    ),
  );
});
test("日付の両端を含む", () => {
  const data = addVisit(emptyData(), input(), "one");
  assert.equal(filterVisits(data.visits, "2026-11-18", "2026-11-18").length, 1);
});
test("遅れは予定時刻の経過で判定", () => {
  const visit = addVisit(emptyData(), input(), "one").visits[0];
  assert.equal(status(visit, "2026-11-18T14:00:00"), "遅れ");
  assert.equal(status(visit, now), "予定");
});
test("CSVはBOMと日本語ヘッダつき", () => {
  const data = checkIn(addVisit(emptyData(), input(), "one"), "one", now);
  const csv = generateCsv(data.visits, data, now);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.includes('"受付番号"'));
  assert.ok(csv.includes('"山岸 拓海"'));
});
test("CSVのファイル名に期間", () =>
  assert.equal(csvFilename("2026-11-01", "2026-11-18"), "入退館記録_2026-11-01_2026-11-18.csv"));
test("CSVはカンマ・改行・引用符をエスケープ", () =>
  assert.equal(csvCell('A,"B"\nC'), '"A,""B""\nC"'));
test("CSVの数式注入を防ぐ", () => assert.equal(csvCell("=1+1"), '"\'=1+1"'));
test("CSVは未入館の予約を除く", () => {
  const data = addVisit(emptyData(), input(), "one");
  assert.equal(generateCsv(data.visits, data, now).split("\r\n").length, 1);
});
