export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";

export type PersonProfile = {
  birthdate: string;
  birthtime: string;
  fiveElement: FiveElement;
  nineStar: number; // 1-9
  personalityType: number; // 1-12
};

export type CompatibilityResult = {
  totalScore: number;
  breakdown: {
    fiveElement: number; // /40
    nineStar: number; // /30
    personality: number; // /20
    timing: number; // /10
  };
  relationshipType: string;
  summary: string;
  strengths: string[];
  cautions: string[];
  actions: string[];
};

const elementSupports: Record<FiveElement, FiveElement> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

const elementControls: Record<FiveElement, FiveElement> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire",
};

function scoreFiveElement(self: FiveElement, partner: FiveElement): number {
  if (self === partner) return 32;
  if (elementSupports[self] === partner || elementSupports[partner] === self) return 40;
  if (elementControls[self] === partner || elementControls[partner] === self) return 18;
  return 24;
}

function scoreNineStar(self: number, partner: number): number {
  const diff = Math.abs(self - partner);
  if (diff === 0) return 24;
  if (diff <= 2) return 30;
  if (diff <= 4) return 22;
  if (diff <= 6) return 16;
  return 10;
}

function scorePersonality(self: number, partner: number): number {
  const mod = Math.abs(self - partner) % 6;
  if (mod === 0) return 16;
  if (mod === 1 || mod === 5) return 20;
  if (mod === 2 || mod === 4) return 14;
  return 10;
}

function scoreTiming(selfBirthtime: string, partnerBirthtime: string): number {
  const selfHour = Number(selfBirthtime.split(":")[0] ?? 0);
  const partnerHour = Number(partnerBirthtime.split(":")[0] ?? 0);
  const diff = Math.abs(selfHour - partnerHour);
  if (diff <= 1) return 10;
  if (diff <= 3) return 8;
  if (diff <= 6) return 6;
  if (diff <= 9) return 4;
  return 2;
}

export function buildPartnerProfile(birthdate: string, birthtime: string): PersonProfile {
  const normalized = birthdate.replaceAll("-", "");
  const digits = normalized.split("").map((v) => Number(v) || 0);
  const seed = digits.reduce((acc, cur) => acc + cur, 0);
  const elements: FiveElement[] = ["wood", "fire", "earth", "metal", "water"];

  return {
    birthdate,
    birthtime,
    fiveElement: elements[seed % elements.length],
    nineStar: (seed % 9) + 1,
    personalityType: (seed % 12) + 1,
  };
}

export function calculateCompatibility(
  self: PersonProfile,
  partner: PersonProfile
): CompatibilityResult {
  const fiveElement = scoreFiveElement(self.fiveElement, partner.fiveElement);
  const nineStar = scoreNineStar(self.nineStar, partner.nineStar);
  const personality = scorePersonality(self.personalityType, partner.personalityType);
  const timing = scoreTiming(self.birthtime, partner.birthtime);

  const totalScore = fiveElement + nineStar + personality + timing;
  const normalized = {
    fiveElement: fiveElement / 40,
    nineStar: nineStar / 30,
    personality: personality / 20,
    timing: timing / 10,
  };

  const weakestArea = Object.entries(normalized).sort((a, b) => a[1] - b[1])[0]?.[0];

  const relationshipType =
    totalScore >= 80 ? "シナジー共創型" : totalScore >= 60 ? "調整安定型" : "段階改善型";

  const summary =
    totalScore >= 80
      ? "高相性。意思決定の速度と質がそろいやすく、共同判断で成果を出しやすい関係です。"
      : totalScore >= 60
        ? "中相性。土台は安定しており、役割の明確化で継続的に相性を高められる関係です。"
        : "改善余地あり。対話設計と判断プロセスのすり合わせにより、相性改善が見込める関係です。";

  const strengths: string[] = [];
  const cautions: string[] = [];
  const actions: string[] = [];

  if (normalized.fiveElement >= 0.75) {
    strengths.push("価値観の土台が近く、長期方針の合意形成が早い");
  }
  if (normalized.nineStar >= 0.75) {
    strengths.push("タイミング感覚が近く、重要判断の着手が揃いやすい");
  }
  if (normalized.personality >= 0.75) {
    strengths.push("対話スタイルが噛み合い、摩擦が起きても修復しやすい");
  }
  if (normalized.timing >= 0.75) {
    strengths.push("日々の判断テンポが近く、意思決定のストレスが少ない");
  }
  if (strengths.length === 0) {
    strengths.push("異なる視点を持つため、検討の抜け漏れを減らしやすい");
  }

  if (weakestArea === "fiveElement") {
    cautions.push("価値基準の違いで優先順位がズレやすい");
    actions.push("判断前に『何を最重視するか』を先に1文で共有する");
  }
  if (weakestArea === "nineStar") {
    cautions.push("動くべきタイミングの感覚差で停滞が起きやすい");
    actions.push("期限と中間チェック日を同時に決め、判断を先送りしない");
  }
  if (weakestArea === "personality") {
    cautions.push("伝え方の癖の違いで意図が誤解されやすい");
    actions.push("結論・理由・依頼の順で短く伝えるフォーマットを統一する");
  }
  if (weakestArea === "timing") {
    cautions.push("判断速度の差で片方に負荷が偏りやすい");
    actions.push("即決事項と持ち帰り事項のルールを分ける");
  }

  if (totalScore >= 80) {
    actions.push("月1回、成果と改善点を振り返り、強みを再現する");
  } else if (totalScore >= 60) {
    actions.push("週1回15分の方針共有を固定し、認識ズレを未然に防ぐ");
  } else {
    actions.push("まず2週間、意思決定ログを取り、ズレる場面を可視化する");
  }

  return {
    totalScore,
    breakdown: {
      fiveElement,
      nineStar,
      personality,
      timing,
    },
    relationshipType,
    summary,
    strengths,
    cautions,
    actions,
  };
}
