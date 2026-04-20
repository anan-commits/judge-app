import { Solar } from "lunar-typescript";
import type { BirthInput, PillarResult, WuxingResult } from "./types";
import { normalizeBirthDate } from "./normalizeBirthDate";

const elementMap: Record<string, keyof Omit<WuxingResult, "dominant" | "lacking">> = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water",
};

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

function fromPillarsFallback(pillars: PillarResult): WuxingResult {
  const counters = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const text = `${pillars.yearPillar}${pillars.monthPillar}${pillars.dayPillar}${pillars.hourPillar || ""}`;
  for (const ch of text) {
    const key = elementMap[ch];
    if (key) counters[key] += 1;
  }
  const entries = Object.entries(counters) as [keyof typeof counters, number][];
  const dominant = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "earth";
  const lacking = entries.filter(([, v]) => v === 0).map(([k]) => k);
  return { ...counters, dominant, lacking };
}

/**
 * external library adapter:
 * - uses lunar-typescript EightChar Wx strings like "水金"
 */
export function calcWuxing(pillars: PillarResult, input?: BirthInput): WuxingResult {
  if (!input) return fromPillarsFallback(pillars);

  const { y, m, d, hh, mm } = parseDate(input);
  const ec = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar().getEightChar();

  const wxValues = [ec.getYearWuXing(), ec.getMonthWuXing(), ec.getDayWuXing()];
  if (input.birthTime) wxValues.push(ec.getTimeWuXing());

  const counters = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  wxValues.join("").split("").forEach((ch) => {
    const key = elementMap[ch];
    if (key) counters[key] += 1;
  });

  const entries = Object.entries(counters) as [keyof typeof counters, number][];
  const dominant = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "earth";
  const lacking = entries.filter(([, v]) => v === 0).map(([k]) => k);
  return { ...counters, dominant, lacking };
}
