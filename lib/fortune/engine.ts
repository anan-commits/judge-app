import { calcPillars } from "./pillars";
import { calcWuxing } from "./wuxing";
import { calcNineStarKi } from "./nineStarKi";
import { calcKoseigaku } from "./koseigaku";
import { calcLuckyDirection } from "./luckyDirection";
import type { BirthInput, FortuneResult } from "./types";

export function calculateFortune(input: BirthInput): FortuneResult {
  const warnings: string[] = [];

  const usedBirthTime = !!input.birthTime;
  const usedBirthPlace = !!input.birthPlace;

  if (!usedBirthTime) {
    warnings.push("出生時刻が未入力のため、時柱は簡易計算または未算出です。");
  }

  if (!usedBirthPlace) {
    warnings.push("出生地が未入力のため、真太陽時補正は未適用です。");
  }

  const pillars = calcPillars(input);
  const wuxing = calcWuxing(pillars, input);
  const nineStarKi = calcNineStarKi(input);
  const koseigaku = calcKoseigaku(input);
  const luckyDirection = calcLuckyDirection(input, nineStarKi);

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
