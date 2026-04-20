export function normalizeBirthDate(input: string): string {
  if (!input) return "";

  const normalized = input
    .trim()
    .replaceAll("/", "-")
    .replaceAll(".", "-")
    .replaceAll("／", "-");

  const parts = normalized.split("-").map((v) => v.trim());

  if (parts.length !== 3) {
    throw new Error(`Invalid birthDate format: ${input}`);
  }

  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (
    !yearRaw ||
    !monthRaw ||
    !dayRaw ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(`Failed to parse birthDate: ${input}`);
  }

  return `${yearRaw.padStart(4, "0")}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(2, "0")}`;
}
