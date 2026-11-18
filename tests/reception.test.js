const { test } = require("node:test");
const assert = require("node:assert/strict");
const { now, emptyData, input } = require("./helpers");
const {
  addVisit,
  editVisit,
  cancelVisit,
  issueCode,
  searchVisits,
  maskedVisitor,
} = require("../src/lib/visits.ts");
const { checkIn, checkOut, inside, findDeparture } = require("../src/lib/reception.ts");
const {
  allocateBadge,
  returnBadge,
  outstandingBadges,
  badgeNumber,
} = require("../src/lib/badges.ts");
const { acknowledge, overdue, receptionMessage } = require("../src/lib/notices.ts");

function reserved() {
  return addVisit(emptyData(), input(), "new-visit");
}

function entered() {
  return checkIn(reserved(), "new-visit", now);
}

test("受付番号は4桁で発行", () => assert.match(issueCode([]), /^\d{4}$/));
test("受付番号は取消済みも再利用しない", () =>
  assert.equal(issueCode([{ code: "1000", cancelled: true }, { code: "1001" }]), "1002"));
test("受付番号を使い切ると拒否", () =>
  assert.throws(() =>
    issueCode(Array.from({ length: 9000 }, (_, index) => ({ code: String(index + 1000) }))),
  ));
test("同じIDを登録できない", () => assert.throws(() => addVisit(reserved(), input(), "new-visit")));
test("予約登録で入力元を変更しない", () => {
  const data = emptyData();
  addVisit(data, input(), "one");
  assert.equal(data.visits.length, 0);
});
test("予約編集で番号を維持", () => {
  const data = editVisit(reserved(), "new-visit", input({ count: 3 }));
  assert.equal(data.visits[0].count, 3);
  assert.equal(data.visits[0].code, "1000");
});
test("受付後の編集を拒否", () => assert.throws(() => editVisit(entered(), "new-visit", input())));
test("予約取消で検索対象から外れる", () => {
  const data = cancelVisit(reserved(), "new-visit");
  assert.equal(searchVisits(data.visits, "2026-11-18", "1000", true).length, 0);
});
test("受付後の取消を拒否", () => assert.throws(() => cancelVisit(entered(), "new-visit")));
for (const invalid of [
  { count: 0 },
  { count: 100 },
  { count: 1.5 },
  { date: "2026-02-30" },
  { time: "24:00" },
  { name: " " },
  { company: "" },
  { employeeId: "missing" },
  { destination: "missing" },
  { purpose: "会議室予約" },
]) {
  test(`不正な予約入力を拒否 ${JSON.stringify(invalid)}`, () =>
    assert.throws(() => addVisit(emptyData(), input(invalid), "bad")));
}
test("受付番号で完全一致検索", () =>
  assert.equal(searchVisits(reserved().visits, "2026-11-18", "1000", true).length, 1));
test("受付番号の部分一致を拒否", () =>
  assert.equal(searchVisits(reserved().visits, "2026-11-18", "100", true).length, 0));
test("全角の受付番号を正規化", () =>
  assert.equal(searchVisits(reserved().visits, "2026-11-18", "１０００", true).length, 1));
test("名前で予約検索", () =>
  assert.equal(searchVisits(reserved().visits, "2026-11-18", "山岸").length, 1));
test("会社で予約検索", () =>
  assert.equal(searchVisits(reserved().visits, "2026-11-18", "みなと").length, 1));
test("空欄検索では一覧を公開しない", () =>
  assert.equal(searchVisits(reserved().visits, "2026-11-18", "").length, 0));
test("別の日の予約を検索しない", () =>
  assert.equal(searchVisits(reserved().visits, "2026-11-19", "山岸").length, 0));
test("受付済みの予約は検索に出ない", () =>
  assert.equal(searchVisits(entered().visits, "2026-11-18", "山岸").length, 0));
test("伏せ字で氏名と会社の全文を隠す", () => {
  const label = maskedVisitor(reserved().visits[0]);
  assert.ok(label.includes("山◯"));
  assert.ok(!label.includes("山岸 拓海"));
  assert.ok(!label.includes("みなと通商"));
});
test("最小の空き入館証を割当", () => assert.equal(allocateBadge(entered()), "V-02"));
test("入館証番号のゼロ埋め", () => assert.equal(badgeNumber(7), "V-07"));
test("入館証が使い切りなら拒否", () =>
  assert.throws(() => allocateBadge({ ...entered(), badgeEnd: 1 })));
test("入館すると通知が未読で生成される", () => {
  const data = entered();
  assert.equal(data.notices.length, 1);
  assert.equal(data.notices[0].readAt, null);
  assert.equal(data.notices[0].createdAt, now);
});
test("二重受付を防止", () => assert.throws(() => checkIn(entered(), "new-visit", now)));
test("取消予約は受付不可", () =>
  assert.throws(() => checkIn(cancelVisit(reserved(), "new-visit"), "new-visit", now)));
test("翌日の受付を拒否", () =>
  assert.throws(() => checkIn(reserved(), "new-visit", "2026-11-19T12:00:00")));
test("館内判定は退館時刻の有無", () => {
  assert.equal(inside(entered().visits[0]), true);
  assert.equal(inside(reserved().visits[0]), false);
});
test("入館証による退館検索", () =>
  assert.equal(findDeparture(entered().visits, "v-01").id, "new-visit"));
test("受付番号による退館検索", () =>
  assert.equal(findDeparture(entered().visits, "1000").id, "new-visit"));
test("退館時刻と返却を記録", () => {
  const data = checkOut(entered(), "new-visit", "2026-11-18T13:00:00", true);
  assert.equal(data.visits[0].returnedAt, data.visits[0].exitedAt);
  assert.equal(inside(data.visits[0]), false);
});
test("二重退館を防止", () =>
  assert.throws(() =>
    checkOut(checkOut(entered(), "new-visit", now, true), "new-visit", now, true),
  ));
test("入館前の退館時刻を拒否", () =>
  assert.throws(() => checkOut(entered(), "new-visit", "2026-11-18T11:59:00", true)));
test("未返却入館証を再割当しない", () => {
  const data = checkOut(entered(), "new-visit", now, false);
  assert.equal(allocateBadge(data), "V-02");
  assert.equal(outstandingBadges(data.visits).length, 1);
});
test("返却後に入館証を再利用", () => {
  const data = returnBadge(checkOut(entered(), "new-visit", now, false), "new-visit", now);
  assert.equal(allocateBadge(data), "V-01");
});
test("入館中の返却だけの記録を拒否", () =>
  assert.throws(() => returnBadge(entered(), "new-visit", now)));
test("対応者と既読時刻を記録", () => {
  const data = acknowledge(entered(), "notice-new-visit", "employee-0", now);
  assert.equal(data.notices[0].responderId, "employee-0");
  assert.equal(data.notices[0].readAt, now);
});
test("二重対応を拒否", () => {
  const data = acknowledge(entered(), "notice-new-visit", "employee-0", now);
  assert.throws(() => acknowledge(data, "notice-new-visit", "employee-1", now));
});
test("5分未満は未対応強調しない", () =>
  assert.equal(overdue(entered().notices[0], "2026-11-18T12:04:59"), false));
test("5分ちょうどで強調", () =>
  assert.equal(overdue(entered().notices[0], "2026-11-18T12:05:00"), true));
test("既読は時間経過しても強調しない", () =>
  assert.equal(overdue({ ...entered().notices[0], readAt: now }, "2026-11-18T13:00:00"), false));
test("未対応受付ではロビー待機案内", () =>
  assert.match(receptionMessage(entered().notices[0], now), /ロビー/));
test("5分経過で総務に取次ぎ案内", () =>
  assert.match(receptionMessage(entered().notices[0], "2026-11-18T12:05:00"), /総務/));
test("対応済みで担当者到着の案内", () =>
  assert.match(
    receptionMessage({ ...entered().notices[0], readAt: now }, now),
    /担当者が向かっています/,
  ));
