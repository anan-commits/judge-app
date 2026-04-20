export type BirthInput = {
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm
  birthPlace?: string; // city or prefecture
  gender?: "male" | "female" | "other";
};

export type PillarResult = {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar?: string;
  tenGods?: string[];
};

export type WuxingResult = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  dominant: string;
  lacking?: string[];
};

export type NineStarKiResult = {
  honmei: string;
  getsumei?: string;
  note?: string;
};

export type KoseigakuResult = {
  category: string;
  subtype?: string;
  note?: string;
};

export type LuckyDirectionResult = {
  goodDirections: string[];
  badDirections: string[];
  note?: string;
};

export type FortuneResult = {
  pillars?: PillarResult;
  wuxing?: WuxingResult;
  nineStarKi?: NineStarKiResult;
  koseigaku?: KoseigakuResult;
  luckyDirection?: LuckyDirectionResult;
  calculationMeta: {
    usedBirthTime: boolean;
    usedBirthPlace: boolean;
    precisionLevel: "basic" | "advanced";
    warnings: string[];
  };
};
