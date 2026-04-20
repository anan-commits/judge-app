import { normalizeBirthDate } from "./normalizeBirthDate";

export type YinYangGogyoResult = {
  destinyNumber: number;
  stem: string;
  element: string;
  label: string;
};

const STEM_MAP: Record<number, { stem: string; element: string; label: string }> = {
  1: { stem: "甲", element: "木", label: "木の陽" },
  2: { stem: "乙", element: "木", label: "木の陰" },
  3: { stem: "丙", element: "火", label: "火の陽" },
  4: { stem: "丁", element: "火", label: "火の陰" },
  5: { stem: "戊", element: "土", label: "土の陽" },
  6: { stem: "己", element: "土", label: "土の陰" },
  7: { stem: "庚", element: "金", label: "金の陽" },
  8: { stem: "辛", element: "金", label: "金の陰" },
  9: { stem: "壬", element: "水", label: "水の陽" },
  0: { stem: "癸", element: "水", label: "水の陰" },
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const TABLE_RANGE_START = 1950;
const TABLE_RANGE_END = 2025;
const TABLE_ANCHOR_KEY = "1971-01";
const TABLE_ANCHOR_VALUE = 22;
const CYCLE = 60;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1] ?? 30;
}

function modulo(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function shiftYearBase(base: number, year: number, targetYear: number): number {
  let value = base;
  if (targetYear >= year) {
    for (let y = year; y < targetYear; y += 1) {
      value = modulo(value + (isLeapYear(y) ? 6 : 5), CYCLE);
    }
    return value;
  }

  for (let y = year - 1; y >= targetYear; y -= 1) {
    value = modulo(value - (isLeapYear(y) ? 6 : 5), CYCLE);
  }
  return value;
}

function buildMonthlyTable(startYear: number, endYear: number): Record<string, number> {
  const table: Record<string, number> = {};
  const anchorYear = Number(TABLE_ANCHOR_KEY.split("-")[0]);
  const janBase = shiftYearBase(TABLE_ANCHOR_VALUE, anchorYear, startYear);

  let currentJanBase = janBase;
  for (let year = startYear; year <= endYear; year += 1) {
    let monthBase = currentJanBase;
    for (let month = 1; month <= 12; month += 1) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      table[key] = monthBase;
      monthBase = modulo(monthBase + getDaysInMonth(year, month), CYCLE);
    }
    currentJanBase = modulo(currentJanBase + (isLeapYear(year) ? 6 : 5), CYCLE);
  }
  return table;
}

const TABLE: Record<string, number> = buildMonthlyTable(TABLE_RANGE_START, TABLE_RANGE_END);

export function calculateYinYangGogyo(birthDate: string): YinYangGogyoResult {
  const normalizedBirthDate = normalizeBirthDate(birthDate);
  if (!normalizedBirthDate) {
    throw new Error(`Failed to parse birthDate: ${birthDate}`);
  }
  const [year, month, day] = normalizedBirthDate.split("-").map(Number);

  if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error(`Failed to parse birthDate: ${birthDate}`);
  }

  console.log("normalized birthDate", normalizedBirthDate);
  console.log("parsed", { year, month, day });

  const key = `${year}-${String(month).padStart(2, "0")}`;
  const base = TABLE[key];

  if (base === undefined) {
    throw new Error(`早見表データがありません: ${key}`);
  }

  const total = base + day;
  const destinyNumber = total % 10;
  const mapped = STEM_MAP[destinyNumber];

  if (normalizedBirthDate === "1971-01-29") {
    console.log({
      birthDate: "1971-01-29",
      key,
      base,
      day,
      total,
      destinyNumber,
      result: `${mapped.stem}（${mapped.element}）`,
    });
  }

  return {
    destinyNumber,
    stem: mapped.stem,
    element: mapped.element,
    label: mapped.label,
  };
}
