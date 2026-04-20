import type { BirthInput, KoseigakuResult } from "./types";
import { normalizeBirthDate } from "./normalizeBirthDate";

const categories = ["人志向", "城志向", "大物志向"] as const;
const subtypes = ["調和型", "先導型", "分析型", "実行型", "慎重型", "創造型"] as const;

export function calcKoseigaku(input: BirthInput): KoseigakuResult {
  const normalizedBirthDate = normalizeBirthDate(input.birthDate);
  if (!normalizedBirthDate) {
    throw new Error(`Failed to parse birthDate: ${input.birthDate}`);
  }
  const digits = normalizedBirthDate.replaceAll("-", "").split("").map((v) => Number(v) || 0);
  const seed = digits.reduce((acc, n) => acc + n, 0);

  return {
    category: categories[seed % categories.length],
    subtype: subtypes[seed % subtypes.length],
    note: "節入日・23時以降の翌日処理は拡張予定です。",
  };
}
