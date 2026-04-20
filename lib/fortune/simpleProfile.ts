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
const gogyoList = ["木", "火", "土", "金", "水"] as const;
const directionList = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"] as const;

function buildSeed(input: SimpleFortuneInput): number {
  const dateSeed = input.birthDate
    .replaceAll("-", "")
    .split("")
    .reduce((acc, v) => acc + (Number(v) || 0), 0);
  const timeSeed = (input.birthTime || "")
    .replaceAll(":", "")
    .split("")
    .reduce((acc, v) => acc + (Number(v) || 0), 0);
  return dateSeed + timeSeed;
}

export function getSimpleFortuneProfile(input: SimpleFortuneInput): SimpleFortuneProfile {
  const seed = buildSeed({
    birthDate: input.birthDate || "1990-01-01",
    birthTime: input.birthTime,
  });
  const pillar = kanshi60[seed % kanshi60.length];

  return {
    dayStem: pillar.charAt(0),
    gogyo: gogyoList[seed % gogyoList.length],
    kyusei: kyuseiList[seed % kyuseiList.length],
    koseigaku: koseigakuList[seed % koseigakuList.length],
    luckyDirection: directionList[seed % directionList.length],
  };
}
