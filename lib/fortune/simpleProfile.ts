import { kanshi60 } from "./kanshi";

export type SimpleFortuneProfile = {
  kyusei: string;
  pillar: string;
  koseigaku: string;
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

function hashBirthDate(birthDate: string): number {
  return birthDate.replaceAll("-", "").split("").reduce((acc, v) => acc + (Number(v) || 0), 0);
}

export function getSimpleFortuneProfile(birthDate: string): SimpleFortuneProfile {
  const seed = hashBirthDate(birthDate || "1990-01-01");

  return {
    kyusei: kyuseiList[seed % kyuseiList.length],
    pillar: kanshi60[seed % kanshi60.length],
    koseigaku: koseigakuList[seed % koseigakuList.length],
  };
}
