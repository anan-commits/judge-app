import type { RelationshipLog } from "../people/types";

export type RelationshipPhase =
  | "接近フェーズ"
  | "様子見フェーズ"
  | "距離注意フェーズ";

export function detectRelationshipPhase(logs: RelationshipLog[]): {
  phase: RelationshipPhase;
  score: number;
  reason: string;
} {
  let score = 0;

  logs.forEach((log) => {
    const text = log.content;

    if (
      text.includes("デート") ||
      text.includes("電話") ||
      text.includes("返信きた") ||
      text.includes("優しかった") ||
      text.includes("誘われた") ||
      text.includes("盛り上がった")
    ) {
      score += 1;
    }

    if (
      text.includes("既読スルー") ||
      text.includes("未読") ||
      text.includes("冷たい") ||
      text.includes("返信遅い") ||
      text.includes("断られた") ||
      text.includes("そっけない")
    ) {
      score -= 1;
    }
  });

  if (score >= 2) {
    return {
      phase: "接近フェーズ",
      score,
      reason: "ポジティブな接触が続いています",
    };
  }

  if (score <= -1) {
    return {
      phase: "距離注意フェーズ",
      score,
      reason: "反応が弱く、押しすぎ注意の状態です",
    };
  }

  return {
    phase: "様子見フェーズ",
    score,
    reason: "好意の可能性はあるが、慎重に見るべき段階です",
  };
}
