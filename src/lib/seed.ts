import { addDays, businessDay, dateOf, weekday } from "./dates";
import { badgeNumber } from "./badges";
import { createNotice } from "./notices";
import type { Database, Purpose, Visit } from "./types";

const employees = [
  ["総務窓口", "総務"],
  ["青柳 美咲", "営業"],
  ["水原 直人", "開発"],
  ["森岡 結衣", "人事"],
  ["高瀬 修平", "営業"],
  ["秋庭 千尋", "広報"],
  ["藤森 航", "開発"],
  ["小坂 真帆", "経理"],
  ["成瀬 悠介", "企画"],
  ["若松 沙織", "総務"],
  ["北原 亮", "開発"],
  ["花村 玲奈", "人事"],
].map(([name, department], index) => ({ id: `employee-${index}`, name, department }));

// 企業・氏名はすべてデモ用の架空設定。前半16名は継続取引、後半14名は単発。
const guests: [string, string, Purpose, number, string][] = [
  ["みなと通商", "山岸 拓海", "打合せ", 1, "汐見 杏"],
  ["つむぎデザイン", "河原 里奈", "打合せ", 5, "戸倉 蒼"],
  ["北葉テクノロジー", "宮園 健太", "打合せ", 2, "深町 理央"],
  ["青羽オフィスサービス", "谷口 圭介", "納品", 0, ""],
  ["こもれび設備", "杉原 達也", "工事", 9, "久瀬 友哉"],
  ["さざなみ企画", "坂井 遥", "打合せ", 8, "萩原 由衣"],
  ["月丘印刷", "広瀬 真琴", "納品", 5, ""],
  ["みなと通商", "野原 誠", "打合せ", 1, "汐見 杏"],
  ["東雲ソリューション", "安西 美緒", "打合せ", 6, "笹森 潤"],
  ["若葉物流", "中瀬 祐樹", "納品", 0, ""],
  ["凪原電機", "椎名 昴", "工事", 9, "瀬尾 朝陽"],
  ["灯里会計サポート", "小出 詩織", "打合せ", 7, ""],
  ["星庭ネットワーク", "榊 夏樹", "工事", 10, "朝倉 朱音"],
  ["藍路パッケージ", "滝沢 郁", "納品", 4, ""],
  ["空穂リサーチ", "三枝 理沙", "打合せ", 8, "折原 怜"],
  ["風待ちラボ", "矢島 周", "打合せ", 2, ""],
  ["個人（面接）", "松葉 佳奈", "面接", 3, ""],
  ["花霞商事", "有坂 涼", "打合せ", 4, ""],
  ["個人（面接）", "桂木 朋香", "面接", 3, ""],
  ["水緒キャリア学院", "芦原 湊", "その他", 11, ""],
  ["個人（面接）", "蓮見 佳樹", "面接", 3, ""],
  ["夕凪文具", "石蕗 玲", "打合せ", 0, ""],
  ["個人（面接）", "真柴 梓", "面接", 3, ""],
  ["橙坂専門学校", "穂積 晴", "その他", 11, ""],
  ["白帆メディア", "結城 美月", "その他", 5, ""],
  ["木立ソフト", "羽鳥 啓", "打合せ", 6, ""],
  ["個人（面接）", "一ノ瀬 翠", "面接", 3, ""],
  ["翠湖アカデミー", "日下部 航平", "その他", 11, ""],
  ["個人（面接）", "遠野 柚葉", "面接", 3, ""],
  ["小径フーズ", "楠木 岳", "打合せ", 0, ""],
];

const memos = [
  "駐車場を1台使用。",
  "前回の見積の修正版を持参予定。",
  "車椅子での来訪のためエレベーター前で案内。",
  "受付で貸出用の傘を預かる。",
  "資料の原本は担当者へ直接手渡し。",
  "帰りのタクシーは西口に手配済み。",
  "大きな荷物があるためロビーの台車を使用。",
  "受付で封筒を預かり経理へ取次ぎ。",
  "入口の段差を避けて東側通路から案内。",
  "担当者は別棟から戻るため内線で呼出し。",
  "社名変更後の名刺を受領予定。",
  "同行者の到着が遅れるため先に代表者を案内。",
  "飲み物は常温の水を希望。",
  "署名済みの受領書は受付の保管箱へ。",
  "雨で濡れた梱包材は搬入口で回収。",
  "忘れ物の手帳を受付で返却予定。",
  "受付端末の読み取りが難しいため氏名で照合。",
  "訪問先の内線番号を紙で案内。",
  "帰路に使うバス停の案内図を用意。",
  "持参した資料は受付で複写せず担当へ渡す。",
  "手話通訳の案内について総務に連絡済み。",
  "到着時は正面玄関の呼出しボタンを使用。",
  "機密資料入りの鞄は本人が携行。",
  "持込機材の電源アダプターを確認。",
  "搬入口の扉は総務が解錠。",
  "来訪者用Wi-Fiの案内カードを準備。",
  "席は入口から近い場所を希望。",
  "会社印の入った封筒は開封せず受領。",
  "配送用の空箱を帰りに引き取る予定。",
  "応接用の筆談ボードを用意。",
  "先方の連絡先変更を担当者へ共有。",
  "受付で預かったマフラーを退館時に返却。",
  "手荷物の一時保管場所は総務が案内。",
  "試料の保冷バッグは立てたまま保管。",
  "訪問後は別拠点へ移動するため出口を案内。",
  "玄関の工事中につき通用口へ誘導。",
  "押印が必要な書類を担当者へ事前連絡。",
  "返却用の鍵は総務が対面で受領。",
  "名刺を忘れたため予約名と所属を口頭確認。",
  "郵送できなかった冊子を受付で受領。",
  "代表電話への折返しは不要と確認済み。",
  "駐輪場の利用方法を到着時に案内。",
  "訪問後の宅配便発送は総務へ依頼済み。",
  "持参した花束はロビーで担当者へ渡す。",
];

const ranges: Record<Purpose, [number, number]> = {
  納品: [10, 20],
  打合せ: [40, 120],
  面接: [50, 70],
  工事: [120, 240],
  その他: [30, 90],
};

function officeDay(date: string) {
  const day = date.slice(5);
  return businessDay(date) && !(day >= "12-29" || day <= "01-03");
}

function stamp(date: string, minutes: number) {
  return `${date}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
}

export function createSeed(now: string): Database {
  const today = dateOf(now);
  // 日付を種にするので、同日の再生成でも予約内容は変わらない。
  let state = Number(today.replaceAll("-", ""));
  const random = (limit: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 4294967296) * limit);
  };
  const shuffle = <T>(items: T[]) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const dates = Array.from({ length: 60 }, (_, i) => addDays(today, i - 60)).filter(officeDay);
  const visits: Visit[] = [];
  const stays = new Map<string, number>();
  const makeVisit = (guestIndex: number, date: string, minutes: number) => {
    const [company, name, purpose, employee, companion] = guests[guestIndex];
    const companions = companion && random(4) === 0 ? companion : "";
    const index = visits.length;
    const visit: Visit = {
      id: `seed-${index}`,
      code: String(2400 + index),
      date,
      time: stamp(date, minutes).slice(11, 16),
      company,
      name,
      purpose,
      employeeId: `employee-${employee}`,
      companions,
      count: companions ? 2 : 1,
      destination:
        purpose === "工事"
          ? "2F執務エリア"
          : purpose === "納品"
            ? "受付ロビー"
            : purpose === "面接"
              ? "4F応接室"
              : random(2)
                ? "3F会議室A"
                : "3F会議室B",
      memo: "",
      walkIn: false,
      cancelled: false,
      enteredAt: stamp(date, minutes + random(16) - 5),
      exitedAt: null,
      badge: null,
      returnedAt: null,
    };
    const [min, max] = ranges[purpose];
    const stay = min + random(max - min + 1);
    stays.set(visit.id, stay);
    const enteredMinutes =
      Number(visit.enteredAt!.slice(11, 13)) * 60 + Number(visit.enteredAt!.slice(14, 16));
    visit.exitedAt = stamp(date, enteredMinutes + stay);
    visit.returnedAt = visit.exitedAt;
    visits.push(visit);
    return visit;
  };

  guests.forEach((guest, guestIndex) => {
    const months = new Map<string, number>();
    // 約10日ごとの枠から営業日を抽選。同じ人を毎日巡回させない。
    const chosen =
      guestIndex < 16
        ? Array.from({ length: 6 }, (_, block) => {
            const candidates = dates.filter(
              (date) =>
                date >= addDays(today, -60 + block * 10) && date < addDays(today, -50 + block * 10),
            );
            // 当日の追加予約を含めても月4回以内に収める。
            const date = shuffle(candidates).find(
              (date) => (months.get(date.slice(0, 7)) ?? 0) < 3,
            );
            if (date) months.set(date.slice(0, 7), (months.get(date.slice(0, 7)) ?? 0) + 1);
            return date;
          }).filter((date): date is string => !!date)
        : [dates[random(dates.length)]];
    chosen.forEach((date) => {
      const morning = guest[2] === "納品" || guest[2] === "工事";
      const options = morning
        ? [540, 555, 570, 600, 615, 630]
        : [555, 600, 630, 660, 690, 780, 810, 840, 885, 915, 960];
      const minutes = options[random(options.length)] + (random(5) === 0 ? random(11) - 5 : 0);
      makeVisit(guestIndex, date, minutes);
    });
  });

  // 月ごとに2〜3件だけ、営業訪問または配送を予約なしの受付にする。
  for (const month of new Set(dates.map((date) => date.slice(0, 7)))) {
    const candidates = shuffle(
      visits.filter(
        (visit) => visit.date.startsWith(month) && ["納品", "打合せ"].includes(visit.purpose),
      ),
    );
    candidates.slice(0, 2 + random(2)).forEach((visit) => {
      visit.walkIn = true;
    });
  }

  const clock = now.slice(11, 16);
  if (officeDay(today) && clock >= "06:00" && clock < "23:00") {
    const count = [0, 5, 8, 6, 7, 4, 0][weekday(today)];
    const times = [540, 630, 780, 855, 945, 990, 675, 915]
      .slice(0, count)
      .map((minute) => minute + [0, 0, -5, -15, 5][random(5)])
      .sort((a, b) => a - b);
    const regulars = shuffle([0, 1, 2, 5, 7, 8, 11, 14, 15]).filter(
      (index) =>
        visits.filter(
          (visit) => visit.name === guests[index][1] && visit.date.startsWith(today.slice(0, 7)),
        ).length < 4,
    );
    const todays = times.map((minute, index) => makeVisit(regulars[index], today, minute));
    const elapsed = todays.filter((visit) => `${today}T${visit.time}:00` < now);
    const late = elapsed.length >= 2 ? elapsed[elapsed.length - 2] : elapsed[0];
    for (const visit of todays) {
      if (`${today}T${visit.time}:00` >= now || visit === late) {
        visit.enteredAt = null;
        visit.exitedAt = null;
        visit.returnedAt = null;
      } else {
        // 予定を過ぎていれば受付済み。未来の打刻は作らない。
        if (visit.enteredAt! >= now)
          visit.enteredAt = stamp(
            today,
            Number(visit.time.slice(0, 2)) * 60 + Number(visit.time.slice(3)) - 1,
          );
        const minutes =
          Number(visit.enteredAt!.slice(11, 13)) * 60 + Number(visit.enteredAt!.slice(14, 16));
        visit.exitedAt = stamp(today, minutes + stays.get(visit.id)!);
        if (visit.exitedAt >= now) visit.exitedAt = null;
        visit.returnedAt = visit.exitedAt;
      }
    }
  }

  // 個別メモは約4割。異常例の追記も同じ枠内に収める。
  const annotated = shuffle(visits).slice(0, Math.round(visits.length * 0.4));
  annotated.forEach((visit, index) => {
    visit.memo = memos[index] ?? "";
  });
  const historical = shuffle(annotated.filter((visit) => visit.date < today));
  const carried = historical[0];
  carried.memo = "入館証を鞄に入れたまま持ち帰り、総務から返送用封筒を送付済み。";
  carried.returnedAt = null;
  carried.badge = "V-20";
  historical[1].memo = "退館操作を忘れたため、担当者の見送り記録と照合して実際の退館時刻を補記。";

  // 同時滞在と未返却を考慮し、持ち帰り用のV-20は再貸出ししない。
  const available = Array<string>(19).fill("");
  visits.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  [...visits]
    .filter((visit) => visit.enteredAt && visit !== carried)
    .sort((a, b) => a.enteredAt!.localeCompare(b.enteredAt!))
    .forEach((visit) => {
      const slot = available.findIndex((until) => until < visit.enteredAt!);
      if (slot < 0) throw new Error("シードの同時貸出数が入館証の枚数を超えています。");
      visit.badge = badgeNumber(slot + 1);
      available[slot] = visit.returnedAt ?? "9999";
    });
  const notices = visits
    .filter((visit) => visit.enteredAt)
    .map((visit) => {
      const notice = createNotice(visit.id, visit.enteredAt!);
      if (visit.exitedAt && visit !== carried) {
        notice.readAt = visit.enteredAt;
        notice.responderId = visit.employeeId;
      }
      return notice;
    });
  return {
    version: 1,
    company: "あおぞらシステムズ 本社（架空）",
    employees,
    destinations: ["受付ロビー", "3F会議室A", "3F会議室B", "4F応接室", "2F執務エリア"],
    badgeStart: 1,
    badgeEnd: 20,
    visits,
    notices,
  };
}
