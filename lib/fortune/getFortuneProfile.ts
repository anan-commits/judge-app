import { calculateYinYangGogyo } from "./yinyangGogyo";
import { normalizeBirthDate } from "./normalizeBirthDate";

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

const koseigakuList = ["大物思考完璧", "城思考", "人思考"] as const;

export function getFortuneProfile(input: {
  birthDate?: string;
  birthTime?: string;
}): FortuneProfile | null {
  const normalizedBirthDate = normalizeBirthDate(input.birthDate);
  if (!normalizedBirthDate) {
    console.error("[fortune] invalid birthDate", input.birthDate);
    return null;
  }

  const [year, month, day] = normalizedBirthDate.split("-").map((v) => Number(v));

  if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    console.error("[fortune] failed to parse birthDate", {
      birthDate: input.birthDate,
      normalizedBirthDate,
    });
    return null;
  }

  let gogyoResult: ReturnType<typeof calculateYinYangGogyo>;
  try {
    gogyoResult = calculateYinYangGogyo(normalizedBirthDate);
  } catch (error) {
    console.error("[fortune] calculateYinYangGogyo failed", {
      birthDate: input.birthDate,
      normalizedBirthDate,
      error,
    });
    return null;
  }
  const dayStem = gogyoResult.stem;
  const gogyo = gogyoResult.element;
  const kyusei = kyuseiMap[(year + 2) % 9];
  // 1971-01 case: (1971+1+2)%3 => 0 => "大物思考完璧"
  const koseigaku = koseigakuList[(year + month + 2) % 3];

  const profile = {
    dayStem,
    gogyo,
    kyusei,
    koseigaku,
  };

  console.log("gogyoResult", gogyoResult);
  console.log("profile", profile);

  return profile;
}
