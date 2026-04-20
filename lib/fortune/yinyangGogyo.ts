export type YinYangGogyoResult = {
  destinyNumber: number;
  stem: string;
  element: string;
  label: string;
};

function reduceToSingleDigit(num: number): number {
  while (num > 9) {
    num = num
      .toString()
      .split("")
      .reduce((sum, n) => sum + Number(n), 0);
  }
  return num === 0 ? 9 : num;
}

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
};

export function calculateYinYangGogyo(birthDate: string): YinYangGogyoResult {
  const [year = 1990, month = 1, day = 1] = birthDate.split("-").map((v) => Number(v));
  const total = year + month + day;
  const destinyNumber = reduceToSingleDigit(total);
  const mapped = STEM_MAP[destinyNumber];

  return {
    destinyNumber,
    stem: mapped.stem,
    element: mapped.element,
    label: mapped.label,
  };
}
