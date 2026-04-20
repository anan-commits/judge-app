import { Solar } from "lunar-typescript";
import type { BirthInput, NineStarKiResult } from "./types";
import { normalizeBirthDate } from "./normalizeBirthDate";

function parseDate(input: BirthInput) {
  const normalizedBirthDate = normalizeBirthDate(input.birthDate);
  if (!normalizedBirthDate) {
    throw new Error(`Failed to parse birthDate: ${input.birthDate}`);
  }
  const [y, m, d] = normalizedBirthDate.split("-").map((v) => Number(v));
  const [hh = 12, mm = 0] = (input.birthTime || "12:00").split(":").map((v) => Number(v));

  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    throw new Error(`Failed to parse birthDate: ${input.birthDate}`);
  }

  return { y, m, d, hh, mm };
}

/**
 * external library adapter:
 * - uses lunar-typescript NineStar (year/month)
 */
export function calcNineStarKi(input: BirthInput): NineStarKiResult {
  const { y, m, d, hh, mm } = parseDate(input);
  const lunar = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar();
  return {
    honmei: lunar.getYearNineStar().toString(),
    getsumei: lunar.getMonthNineStar().toString(),
    note: "立春・節入り基準で算出。流派差により表示が異なる場合があります。",
  };
}
