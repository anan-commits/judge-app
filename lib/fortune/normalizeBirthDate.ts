export function normalizeBirthDate(input?: string): string | null {
  if (!input || !input.trim()) return null;

  const normalized = input
    .trim()
    .replaceAll("/", "-")
    .replaceAll(".", "-")
    .replaceAll("／", "-");

  const parts = normalized.split("-").map((v) => v.trim());

  if (parts.length !== 3) return null;

  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!yearRaw || !monthRaw || !dayRaw) return null;
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return `${yearRaw.padStart(4, "0")}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(2, "0")}`;
}
