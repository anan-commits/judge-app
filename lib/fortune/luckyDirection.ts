import type { BirthInput, LuckyDirectionResult, NineStarKiResult } from "./types";

const directionByStar: Record<string, { good: string[]; bad: string[] }> = {
  一: { good: ["北", "北東"], bad: ["南"] },
  二: { good: ["南西", "西"], bad: ["北東"] },
  三: { good: ["東", "南東"], bad: ["西"] },
  四: { good: ["東南", "南"], bad: ["北西"] },
  五: { good: ["中央", "南東"], bad: ["北"] },
  六: { good: ["北西", "西"], bad: ["東南"] },
  七: { good: ["西", "北西"], bad: ["東"] },
  八: { good: ["北東", "南西"], bad: ["南"] },
  九: { good: ["南", "東"], bad: ["北"] },
};

export function calcLuckyDirection(
  _input: BirthInput,
  nineStarKi?: NineStarKiResult
): LuckyDirectionResult {
  const key = (nineStarKi?.honmei || "").charAt(0);
  const mapped = directionByStar[key] || { good: ["東", "南東"], bad: ["北西"] };
  return {
    goodDirections: mapped.good,
    badDirections: mapped.bad,
    note: "年盤ベースの簡易算出。月盤・日盤は今後拡張予定です。",
  };
}
