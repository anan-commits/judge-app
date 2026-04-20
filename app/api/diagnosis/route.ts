import { NextResponse } from "next/server";
import { calculateFortune } from "../../../lib/fortune/engine";
import type { BirthInput, FortuneResult } from "../../../lib/fortune/types";

type DiagnosisRequest = {
  self: BirthInput;
  partner: BirthInput;
};

type DiagnosisResponse = {
  relationshipPhase: "接近フェーズ" | "様子見フェーズ" | "距離注意フェーズ";
  phaseReason: string;
  fortuneResult: {
    self: FortuneResult;
    partner: FortuneResult;
  };
};

function calcRelationshipPhase(
  selfFortune: FortuneResult,
  partnerFortune: FortuneResult
): { phase: DiagnosisResponse["relationshipPhase"]; reason: string } {
  const selfDominant = selfFortune.wuxing?.dominant;
  const partnerDominant = partnerFortune.wuxing?.dominant;

  if (selfDominant && partnerDominant && selfDominant === partnerDominant) {
    return {
      phase: "接近フェーズ",
      reason: "五行の主軸が近く、関係が進展しやすい局面です。",
    };
  }

  const cautionCount =
    (selfFortune.wuxing?.lacking?.length || 0) + (partnerFortune.wuxing?.lacking?.length || 0);
  if (cautionCount >= 3) {
    return {
      phase: "距離注意フェーズ",
      reason: "五行バランスに不足があり、温度差が出やすい局面です。",
    };
  }

  return {
    phase: "様子見フェーズ",
    reason: "相性の傾向はあるが、運気の流れを見ながら調整が必要です。",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DiagnosisRequest;
    if (!body?.self?.birthDate || !body?.partner?.birthDate) {
      return NextResponse.json({ error: "self.birthDate and partner.birthDate are required" }, { status: 400 });
    }

    const selfFortune = calculateFortune(body.self);
    const partnerFortune = calculateFortune(body.partner);
    const phase = calcRelationshipPhase(selfFortune, partnerFortune);

    const response: DiagnosisResponse = {
      relationshipPhase: phase.phase,
      phaseReason: phase.reason,
      fortuneResult: {
        self: selfFortune,
        partner: partnerFortune,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
