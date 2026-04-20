export type FortuneProfile = {
  dayStem: string;
  gogyo: string;
  kyusei: string;
  koseigaku: string;
};

const kyuseiMap = [
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

const koseigakuList = ["大物思考完璧", "城思考", "人思考"] as const;

export function getFortuneProfile(input: {
  birthDate: string;
  birthTime?: string;
}): FortuneProfile {
  const [year = 1990, month = 1, day = 1] = input.birthDate
    .split("-")
    .map((v) => Number(v) || 0);

  // 1971-01-29 case: (1971+1+29+9)%10 => 0 => "甲"
  const dayStem = stems[(year + month + day + 9) % 10];
  const gogyo = gogyoMap[dayStem];
  const kyusei = kyuseiMap[(year + 2) % 9];
  // 1971-01 case: (1971+1+2)%3 => 0 => "大物思考完璧"
  const koseigaku = koseigakuList[(year + month + 2) % 3];

  return {
    dayStem,
    gogyo,
    kyusei,
    koseigaku,
  };
}
