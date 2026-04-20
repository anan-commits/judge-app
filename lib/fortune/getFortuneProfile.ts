import { calculateYinYangGogyo } from "./yinyangGogyo";
import { normalizeBirthDate } from "./normalizeBirthDate";
import { calcNineStarKi } from "./nineStarKi";

export type FortuneProfile = {
  kanshi: string;
  yinYangGogyo: string;
  honmei: string;
  getsumei: string;
  koseigaku: string;
};

const koseigakuList = ["大物思考完璧", "城思考", "人思考"] as const;
const kanshiByDestinyNumber: Record<number, string> = {
  1: "甲寅",
  2: "乙卯",
  3: "丙辰",
  4: "丁巳",
  5: "戊午",
  6: "己未",
  7: "庚申",
  8: "辛酉",
  9: "壬戌",
  0: "癸亥",
};

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
  const kanshi = kanshiByDestinyNumber[gogyoResult.destinyNumber];
  if (!kanshi) {
    console.error("[fortune] kanshi mapping missing", gogyoResult.destinyNumber);
    return null;
  }
  const yinYangGogyo = gogyoResult.label;
  const nineStar = calcNineStarKi({
    birthDate: normalizedBirthDate,
    birthTime: input.birthTime,
  });
  const honmei = nineStar.honmei;
  const getsumei = nineStar.getsumei ?? "";
  // 1971-01 case: (1971+1+2)%3 => 0 => "大物思考完璧"
  const koseigaku = koseigakuList[(year + month + 2) % 3];

  const profile = {
    kanshi,
    yinYangGogyo,
    honmei,
    getsumei,
    koseigaku,
  };

  console.log("gogyoResult", gogyoResult);
  console.log("profile", profile);

  return profile;
}
