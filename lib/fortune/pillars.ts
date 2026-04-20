import { Solar } from "lunar-typescript";
import type { BirthInput, PillarResult } from "./types";
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
 * - uses lunar-typescript to derive Four Pillars (BaZi)
 */
export function calcPillars(input: BirthInput): PillarResult {
  const { y, m, d, hh, mm } = parseDate(input);
  const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const tenGods: string[] = [
    ec.getYearShiShenGan(),
    ec.getMonthShiShenGan(),
    ec.getDayShiShenGan(),
  ];

  if (input.birthTime) {
    tenGods.push(ec.getTimeShiShenGan());
  }

  return {
    yearPillar: ec.getYear(),
    monthPillar: ec.getMonth(),
    dayPillar: ec.getDay(),
    hourPillar: input.birthTime ? ec.getTime() : undefined,
    tenGods,
  };
}
