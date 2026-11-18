const { test } = require("node:test");
const assert = require("node:assert/strict");
require("./helpers");
const { createSeed } = require("../src/lib/seed.ts");
const { validateDatabase } = require("../src/lib/backup.ts");
const { status } = require("../src/lib/stats.ts");
const { businessDay, weekday, epoch } = require("../src/lib/dates.ts");

const scenarios = [
  "2026-11-18T14:30:00",
  "2026-11-18T00:10:00",
  "2026-11-18T23:50:00",
  "2027-01-02T10:00:00",
  "2026-05-04T11:00:00",
  "2026-11-18T08:00:00",
  "2026-11-18T09:15:00",
  "2026-11-18T12:00:00",
  "2026-11-18T17:00:00",
  "2026-11-18T18:00:00",
  "2026-11-21T12:00:00",
  "2026-11-22T12:00:00",
  "2026-12-01T12:00:00",
  "2026-11-30T17:00:00",
  "2026-11-23T12:00:00",
  "2027-01-04T12:00:00",
  "2026-12-29T10:00:00",
  "2026-12-31T10:00:00",
  "2027-01-01T10:00:00",
  "2027-01-03T10:00:00",
  "2026-05-06T10:00:00",
  "2026-11-19T14:30:00",
  "2026-11-20T14:30:00",
  "2026-11-18T09:00:00",
];
const ranges = {
  納品: [10, 20],
  打合せ: [40, 120],
  面接: [50, 70],
  工事: [120, 240],
  その他: [30, 90],
};
function officeDay(date) {
  return businessDay(date) && date.slice(5) > "01-03" && date.slice(5) < "12-29";
}

for (const now of scenarios) {
  const data = createSeed(now);
  const today = now.slice(0, 10);
  const visits = data.visits;
  const todays = visits.filter((visit) => visit.date === today);
  test(`${now}：実績・通知は厳密に現在より前で整合する`, () => {
    assert.ok(validateDatabase(data));
    for (const visit of visits) {
      for (const key of ["enteredAt", "exitedAt", "returnedAt"]) {
        if (visit[key]) assert.ok(visit[key] < now, `${key}: ${visit[key]}`);
      }
      if (visit.exitedAt) assert.ok(visit.enteredAt < visit.exitedAt);
    }
    for (const notice of data.notices) {
      assert.ok(notice.createdAt < now);
      if (notice.readAt) assert.ok(notice.readAt < now);
    }
  });
  test(`${now}：営業日・予約件数・未来の状態`, () => {
    const active = officeDay(today) && now.slice(11, 16) >= "06:00" && now.slice(11, 16) < "23:00";
    assert.equal(todays.length, active ? [0, 5, 8, 6, 7, 4, 0][weekday(today)] : 0);
    assert.ok(visits.every((visit) => officeDay(visit.date)));
    const elapsed = todays.filter((visit) => `${today}T${visit.time}:00` < now);
    assert.equal(
      elapsed.filter((visit) => status(visit, now) === "遅れ").length,
      elapsed.length ? 1 : 0,
    );
    for (const visit of todays.filter((visit) => `${today}T${visit.time}:00` >= now)) {
      assert.equal(visit.enteredAt, null);
      assert.equal(visit.badge, null);
      assert.equal(status(visit, now), "予定");
    }
  });
  test(`${now}：25人以上・常連と単発・頻度`, () => {
    const counts = new Map();
    const monthly = new Map();
    for (const visit of visits) {
      const key = `${visit.company}/${visit.name}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      const month = `${key}/${visit.date.slice(0, 7)}`;
      monthly.set(month, (monthly.get(month) ?? 0) + 1);
    }
    assert.ok(counts.size >= 25 && counts.size <= 35);
    assert.ok([...counts.values()].some((count) => count >= 3));
    assert.ok([...counts.values()].filter((count) => count === 1).length >= 10);
    assert.ok([...monthly.values()].every((count) => count <= 4));
    assert.ok(visits.filter((visit) => visit.date < today).length >= 80);
    assert.ok(
      visits
        .filter((visit) => visit.date < today)
        .every((visit) => epoch(now) - epoch(visit.enteredAt) <= 61 * 86400000),
    );
  });
  test(`${now}：入館の分・予約からの差・用件別滞在`, () => {
    const entered = visits.filter((visit) => visit.enteredAt);
    assert.ok(new Set(entered.map((visit) => visit.enteredAt.slice(14, 16))).size >= 20);
    const durations = [];
    for (const visit of entered) {
      const gap = (epoch(visit.enteredAt) - epoch(`${visit.date}T${visit.time}:00`)) / 60000;
      assert.ok(gap >= -5 && gap <= 10);
      if (visit.exitedAt) {
        const minutes = (epoch(visit.exitedAt) - epoch(visit.enteredAt)) / 60000;
        durations.push(minutes);
        const [min, max] = ranges[visit.purpose];
        assert.ok(minutes >= min && minutes <= max, `${visit.purpose}: ${minutes}`);
      }
    }
    assert.ok(new Set(durations).size >= 15);
    assert.ok(
      visits.filter((visit) => ["00", "15", "30", "45"].includes(visit.time.slice(3))).length /
        visits.length >
        0.65,
    );
    assert.ok(visits.some((visit) => !["00", "15", "30", "45"].includes(visit.time.slice(3))));
    assert.ok(visits.filter((visit) => visit.time.startsWith("12:")).length / visits.length < 0.1);
  });
  test(`${now}：メモは3〜5割・重複も日時前置きもなし`, () => {
    const memos = visits.map((visit) => visit.memo).filter(Boolean);
    assert.ok(memos.length / visits.length >= 0.3 && memos.length / visits.length <= 0.5);
    assert.equal(new Set(memos).size, memos.length);
    assert.ok(memos.every((memo) => !/^\s*(\d{4}[-/年]|\d{1,2}[:時])/.test(memo)));
  });
  test(`${now}：会社担当と同行者の一貫性`, () => {
    const companies = new Map();
    const companions = new Map();
    for (const visit of visits) {
      if (companies.has(visit.company))
        assert.equal(visit.employeeId, companies.get(visit.company));
      companies.set(visit.company, visit.employeeId);
      assert.equal(visit.count, visit.companions ? 2 : 1);
      if (visit.companions) {
        if (companions.has(visit.companions))
          assert.equal(visit.company, companions.get(visit.companions));
        companions.set(visit.companions, visit.company);
      }
    }
    assert.equal(companies.get("みなと通商"), "employee-1");
    assert.ok(companions.size >= 3);
    assert.ok(visits.filter((visit) => !visit.companions).length / visits.length > 0.6);
  });
  test(`${now}：月に数件の飛込み・補記・未返却・未読`, () => {
    const months = new Map();
    visits
      .filter((visit) => visit.walkIn)
      .forEach((visit) => {
        const key = visit.date.slice(0, 7);
        months.set(key, (months.get(key) ?? 0) + 1);
      });
    assert.ok([...months.values()].every((count) => count >= 2 && count <= 3));
    const carried = visits.filter((visit) => visit.exitedAt && !visit.returnedAt);
    assert.ok(carried.length >= 1 && carried.length <= 2);
    assert.equal(visits.filter((visit) => visit.memo.includes("補記")).length, 1);
    assert.ok(data.notices.some((notice) => !notice.readAt));
    if (!todays.length) assert.ok(visits.every((visit) => visit.exitedAt));
  });
  test(`${now}：滞在中・未返却の入館証を再貸出ししない`, () => {
    const badges = new Map();
    const entered = visits
      .filter((visit) => visit.enteredAt)
      .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));
    for (const visit of entered) {
      assert.ok(!badges.has(visit.badge) || badges.get(visit.badge) < visit.enteredAt);
      badges.set(visit.badge, visit.returnedAt ?? "9999");
    }
  });
}

test("平日午後の画面に館内・退館済み・遅れ・予定が揃う", () => {
  const now = scenarios[0];
  const data = createSeed(now);
  const todays = data.visits.filter((visit) => visit.date === now.slice(0, 10));
  assert.ok(todays.some((visit) => visit.enteredAt && !visit.exitedAt));
  assert.ok(todays.some((visit) => visit.exitedAt));
  assert.ok(todays.some((visit) => status(visit, now) === "遅れ"));
  assert.ok(todays.some((visit) => status(visit, now) === "予定"));
});
test("同じ日時なら再現でき、日を変えると予定時刻も変わる", () => {
  assert.deepEqual(createSeed(scenarios[0]), createSeed(scenarios[0]));
  const times = (now) =>
    createSeed(now)
      .visits.filter((visit) => visit.date === now.slice(0, 10))
      .map((visit) => visit.time);
  assert.notDeepEqual(times(scenarios[0]), times("2026-11-25T14:30:00"));
});
