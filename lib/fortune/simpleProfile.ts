import { kanshi60 } from "./kanshi";

export type SimpleFortuneInput = {
  birthDate: string;
  birthTime?: string;
};

export type SimpleFortuneProfile = {
  dayStem: string;
  gogyo: string;
  kyusei: string;
  koseigaku: string;
  luckyDirection: string;
};

const kyuseiList = [
  "一白水星",
  "二黒土星",
  "三碧木星",
  "四緑木星",
  "五黄土星",
  "六白金星",
  "七赤金星",
  "八白土星",
  "九紫火星",
] as const;

const koseigakuList = ["大物思考", "城思考", "人思考"] as const;
const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const gogyoMap: Record<(typeof stems)[number], "木" | "火" | "土" | "金" | "水"> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};
const directionByGogyo: Record<"木" | "火" | "土" | "金" | "水", string> = {
  木: "東",
  火: "南",
  土: "南西",
  金: "西",
  水: "北",
};

function parseBirthDate(birthDate: string) {
  const [y = 1990, m = 1, d = 1] = birthDate.split("-").map((v) => Number(v));
  return { year: y, month: m, day: d };
}

export function getSimpleFortuneProfile(input: SimpleFortuneInput): SimpleFortuneProfile {
  const { year, month, day } = parseBirthDate(input.birthDate || "1990-01-01");
  const kyusei = kyuseiList[(year + 2) % 9];
  const dayStem = stems[(year + month + day) % 10];
  const gogyo = gogyoMap[dayStem];
  const koseigaku = koseigakuList[(year + month) % 3];
  const luckyDirection = directionByGogyo[gogyo];
  const pillar = kanshi60[(year + month + day) % kanshi60.length];

  return {
    dayStem: dayStem || pillar.charAt(0),
    gogyo,
    kyusei,
    koseigaku,
    luckyDirection,
  };
}
