import { calcPillars } from "./pillars";
import { calcWuxing } from "./wuxing";
import { calcNineStarKi } from "./nineStarKi";
import { calcKoseigaku } from "./koseigaku";
import { calcLuckyDirection } from "./luckyDirection";
import type { BirthInput, FortuneResult } from "./types";
import { normalizeBirthDate } from "./normalizeBirthDate";

export function calculateFortune(input: BirthInput): FortuneResult {
  const normalizedInput: BirthInput = {
    ...input,
    birthDate: normalizeBirthDate(input.birthDate),
  };
  const warnings: string[] = [];

  const usedBirthTime = !!normalizedInput.birthTime;
  const usedBirthPlace = !!normalizedInput.birthPlace;

  if (!usedBirthTime) {
    warnings.push("出生時刻が未入力のため、時柱は簡易計算または未算出です。");
  }

  if (!usedBirthPlace) {
    warnings.push("出生地が未入力のため、真太陽時補正は未適用です。");
  }

  const pillars = calcPillars(normalizedInput);
  const wuxing = calcWuxing(pillars, normalizedInput);
  const nineStarKi = calcNineStarKi(normalizedInput);
  const koseigaku = calcKoseigaku(normalizedInput);
  const luckyDirection = calcLuckyDirection(normalizedInput, nineStarKi);

  return {
    pillars,
    wuxing,
    nineStarKi,
    koseigaku,
    luckyDirection,
    calculationMeta: {
      usedBirthTime,
      usedBirthPlace,
      precisionLevel: usedBirthTime && usedBirthPlace ? "advanced" : "basic",
      warnings,
    },
  };
}
