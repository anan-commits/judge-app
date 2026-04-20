"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildPartnerProfile,
  calculateCompatibility,
  type CompatibilityResult,
  type PersonProfile,
} from "../lib/compatibility";
import type { FortuneResult } from "../../lib/fortune/types";
import { getFortuneProfile } from "../../lib/fortune/getFortuneProfile";

type RelationshipConversionPattern = {
  essence: string;
  tendency: string;
  neglectRisk: string;
  tease: string;
};

const RELATIONSHIP_CONVERSION_PATTERNS: RelationshipConversionPattern[] = [
  {
    essence: "この2人は、近づくほど気持ちの温度差が見えやすい関係です。",
    tendency:
      "その中であなたは、相手に合わせて動きすぎて、自分の軸を後回しにしやすいです。",
    neglectRisk:
      "このまま放置すると、あなたが我慢するほど関係の主導権を失い、気づかないうちに距離が固定化しやすくなります。",
    tease:
      "改善の鍵は、相手の反応を待つ前にあなたの伝え方を1段階切り替えることです。ここを外すと努力が逆効果になりやすいです。",
  },
  {
    essence: "この2人は、表面は穏やかでも本音のズレが蓄積しやすい関係です。",
    tendency:
      "その中であなたは、空気を壊さないように本音を飲み込み、様子見を長引かせやすいです。",
    neglectRisk:
      "この状態を続けると、話し合う前に相手の中で結論だけが進み、あなたが気づいた時には修復コストが大きくなりやすいです。",
    tease:
      "実は、切り出すタイミングには失敗しにくい運気帯があります。そこを外さずに動けるかで結果が変わります。",
  },
  {
    essence: "この2人は、好意が強いほど踏み込み量の差が出やすい関係です。",
    tendency:
      "その中であなたは、誤解を避けようとして説明を重ね、連絡頻度を上げすぎやすいです。",
    neglectRisk:
      "この流れを放置すると、あなたの誠実さが相手には圧として届き、返答が遅れるほど関係が冷えやすくなります。",
    tease:
      "突破口は『連絡回数』ではなく『1通目の設計』にあります。たった一行の違いで相手の反応は大きく変わります。",
  },
];

type ThreeLayerModel = {
  innateScore: number;
  correctionPotential: number;
  reachableLabel: string;
  correctionHint: string;
  reachableHint: string;
};

const THREE_LAYER_MODEL_DUMMY: ThreeLayerModel = {
  innateScore: 62,
  correctionPotential: 28,
  reachableLabel: "90点以上",
  correctionHint: "連絡頻度と感情表現の順番で改善余地あり",
  reachableHint: "今月の運気タイミングを使えば大きく伸ばせる",
};

const selfProfile: PersonProfile = {
  birthdate: "1992-11-08",
  birthtime: "08:24",
  fiveElement: "wood",
  nineStar: 3,
  personalityType: 7,
};

/**
 * 課金導線用コピー（MVPダミー）。essence→tendency→neglectRisk が一文脈でつながるストーリー。
 * 後から診断スコア・タイプと接続。
 */


function buildDisplayProfile(birthdate: string, birthtime: string) {
  const fortune = getFortuneProfile({
    birthDate: birthdate,
    birthTime: birthtime,
  });
  return {
    birthdate,
    birthtime,
    dayStem: fortune.dayStem,
    fiveElement: fortune.gogyo,
    nineStar: fortune.kyusei,
    personality: fortune.koseigaku,
    luckyDirection: "-",
  };
}

function pickStoryPatternIndex(partnerBirthdate: string | undefined): number {
  const digits = partnerBirthdate?.replaceAll(/\D/g, "") ?? "";
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    sum += digits.charCodeAt(i);
  }
  const seeded = sum % RELATIONSHIP_CONVERSION_PATTERNS.length;
  const jitter = Math.floor(Math.random() * RELATIONSHIP_CONVERSION_PATTERNS.length);
  return (seeded + jitter) % RELATIONSHIP_CONVERSION_PATTERNS.length;
}

function StoryFlowBlock({
  essence,
  tendency,
  neglectRisk,
}: Pick<RelationshipConversionPattern, "essence" | "tendency" | "neglectRisk">) {
  return (
    <div className="mt-6 max-w-2xl space-y-6 border-l-2 border-amber-200/90 pl-4 sm:pl-5">
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-amber-900/75">関係性</p>
        <p className="mt-1.5 text-sm leading-[1.75] text-amber-950 sm:text-[15px]">{essence}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-amber-900/75">その中でのあなた</p>
        <p className="mt-1.5 text-sm leading-[1.75] text-amber-950 sm:text-[15px]">{tendency}</p>
      </div>
      <div role="note" className="rounded-r-xl border-l-4 border-red-600 bg-red-50/95 py-3 pl-4 pr-3 shadow-sm sm:py-4 sm:pl-5">
        <p className="text-[11px] font-bold tracking-wide text-red-900">その結果（放置リスク）</p>
        <p className="mt-2 text-sm font-semibold leading-[1.75] text-red-950 sm:text-[15px]">{neglectRisk}</p>
      </div>
    </div>
  );
}

function TeaseBlock({ tease }: { tease: string }) {
  return (
    <div className="space-y-4 border-t border-dashed border-amber-300/70 pt-6">
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-amber-900/80">続きの核心（プレビュー）</p>
        <p aria-hidden className="mt-2 select-none text-sm leading-[1.75] text-amber-950/90 blur-[3.5px] sm:text-[15px]">
          {tease}
        </p>
        <p className="sr-only">{tease}</p>
      </div>
    </div>
  );
}

function PaidCta({ patternIndex }: { patternIndex: number }) {
  return (
    <button
      type="button"
      onClick={() => {
        console.log("[paywall] 続きを見る ¥980", { patternIndex });
      }}
      className="inline-flex h-12 min-h-[48px] w-full max-w-md items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800"
    >
      続きを見る（¥980）
    </button>
  );
}

function RelationshipEssenceSection({
  partnerBirthdate,
  isFreeUser,
}: {
  partnerBirthdate: string | undefined;
  isFreeUser: boolean;
}) {
  const [patternIndex] = useState(() => pickStoryPatternIndex(partnerBirthdate));
  const { essence, tendency, neglectRisk, tease } = RELATIONSHIP_CONVERSION_PATTERNS[patternIndex];
  return (
    <section
      className="border-b-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-orange-50/95 to-rose-50/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)]"
      aria-labelledby="relationship-conversion-heading"
    >
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900/65">
          関係の本質
        </p>
        <h2
          id="relationship-conversion-heading"
          className="mt-2 text-base font-semibold leading-snug text-amber-950 sm:text-lg"
        >
          この関係は相性だけで判断すると損をします
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-amber-950/90 sm:text-[15px]">
          土台のズレはあります。ですが、運気・タイミング・行動設計で補正できる余地もあります。
          Judge Codeはその改善ルートまで可視化します。
        </p>
        <StoryFlowBlock essence={essence} tendency={tendency} neglectRisk={neglectRisk} />
        {isFreeUser ? (
          <div className="mt-6 max-w-2xl space-y-4">
            <TeaseBlock tease={tease} />
            <PaidCta patternIndex={patternIndex} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ThreeLayerScoreSection() {
  const model = THREE_LAYER_MODEL_DUMMY;
  return (
    <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6 md:rounded-3xl md:p-7">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">3層相性モデル</p>
      <h2 className="mt-2 text-lg font-semibold leading-snug text-zinc-950 sm:text-xl">
        相性は「先天」だけでなく、補正と実行で伸ばせます
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        悪い相性で終わらせず、どこを変えれば伸びるかまで見るのがJudge Codeです。
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">先天相性</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{model.innateScore}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">生まれ持った噛み合わせ（現在地）</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">補正可能性</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-900">+{model.correctionPotential}</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">{model.correctionHint}</p>
        </article>
        <article className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">実行到達点</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-950">{model.reachableLabel}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">{model.reachableHint}</p>
        </article>
      </div>
    </section>
  );
}

function ResultPersonHeader({ label, initial }: { label: string; initial: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 rounded-2xl border border-zinc-200/90 bg-white px-2 py-4 shadow-sm sm:gap-3 sm:px-3 sm:py-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-700 ring-1 ring-zinc-200/80 sm:h-14 sm:w-14 sm:text-lg"
        aria-hidden
      >
        {initial}
      </div>
      <p className="max-w-full truncate text-center text-sm font-semibold leading-tight text-zinc-900 sm:text-base">
        {label}
      </p>
    </div>
  );
}

type DisplayProfile = ReturnType<typeof buildDisplayProfile>;

type DiagnosisPayload = {
  relationshipPhase: "接近フェーズ" | "様子見フェーズ" | "距離注意フェーズ";
  phaseReason: string;
  fortuneResult: {
    self: FortuneResult;
    partner: FortuneResult;
  };
};

function compatibilityBridgeCopy(result: CompatibilityResult | null): string {
  const score = result?.totalScore ?? 0;
  const fe = result?.breakdown.fiveElement ?? 0;
  if (score >= 72 && fe >= 28) {
    return "この2人は土台相性が強い組み合わせです。";
  }
  if (score >= 58) {
    return "この2人は違いを補い合いながら伸びるタイプです。";
  }
  return "この2人はペースのズレに気をつければ前向きに進めます。";
}

function ProfileStatusCard({
  title,
  display,
}: {
  title: string;
  display: DisplayProfile | null;
}) {
  const d = display;
  return (
    <article className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6 md:rounded-3xl md:p-7">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{title}</p>
      <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-zinc-700">
        <p>
          生年月日:{" "}
          <span className="font-semibold text-zinc-900">{d?.birthdate ?? "-"}</span>
        </p>
        <p className="hidden md:block">
          出生時間: <span className="font-semibold text-zinc-900">{d?.birthtime ?? "-"}</span>
        </p>
        <p className="hidden md:block">
          日柱天干: <span className="font-semibold text-zinc-900">{d?.dayStem ?? "-"}</span>
        </p>
        <p>
          五行: <span className="font-semibold text-zinc-900">{d?.fiveElement ?? "-"}</span>
        </p>
        <p>
          九星気学: <span className="font-semibold text-zinc-900">{d?.nineStar ?? "-"}</span>
        </p>
        <p>
          個性学: <span className="font-semibold text-zinc-900">{d?.personality ?? "-"}</span>
        </p>
        <p className="hidden md:block">
          吉方位: <span className="font-semibold text-zinc-900">{d?.luckyDirection ?? "-"}</span>
        </p>
        <details className="group mt-1 rounded-xl border border-zinc-200 bg-zinc-50/90 px-3 py-2 md:hidden">
          <summary className="cursor-pointer list-none text-xs font-medium text-zinc-600 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-zinc-300 underline-offset-2">
              その他（出生時間・日柱天干・吉方位）
            </span>
          </summary>
          <div className="mt-3 space-y-2 border-t border-zinc-200/80 pt-3 text-xs leading-relaxed text-zinc-600">
            <p>
              出生時間:{" "}
              <span className="font-medium text-zinc-800">{d?.birthtime ?? "-"}</span>
            </p>
            <p>
              日柱天干: <span className="font-medium text-zinc-800">{d?.dayStem ?? "-"}</span>
            </p>
            <p>
              吉方位: <span className="font-medium text-zinc-800">{d?.luckyDirection ?? "-"}</span>
            </p>
          </div>
        </details>
      </div>
    </article>
  );
}

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFreeUser = searchParams.get("full") !== "1";
  const [saved, setSaved] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [activePartnerIndex] = useState(0);
  const [partnerProfiles, setPartnerProfiles] = useState<PersonProfile[]>([]);
  const [resultsByPartner, setResultsByPartner] = useState<CompatibilityResult[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisPayload | null>(null);
  const [selfBirthdate, setSelfBirthdate] = useState(selfProfile.birthdate);
  const [selfBirthtime, setSelfBirthtime] = useState(selfProfile.birthtime);

  useEffect(() => {
    const birthdate = sessionStorage.getItem("judge-code:partner-birthdate");
    const birthtime = sessionStorage.getItem("judge-code:partner-birthtime");
    const diagnosisRaw = sessionStorage.getItem("judge-code:latest-diagnosis");
    const storedSelfBirthdate = sessionStorage.getItem("judge-code:self-birthdate");
    const storedSelfBirthtime = sessionStorage.getItem("judge-code:self-birthtime");

    if (!birthdate || !birthtime) {
      router.replace("/diagnosis");
      return;
    }

    if (storedSelfBirthdate) setSelfBirthdate(storedSelfBirthdate);
    if (storedSelfBirthtime) setSelfBirthtime(storedSelfBirthtime);

    const partner = buildPartnerProfile(birthdate, birthtime);
    const partnerList = [partner];
    setPartnerProfiles(partnerList);
    setResultsByPartner(partnerList.map((item) => calculateCompatibility(selfProfile, item)));
    if (diagnosisRaw) {
      try {
        const parsed = JSON.parse(diagnosisRaw) as DiagnosisPayload;
        setDiagnosisData(parsed);
      } catch {
        setDiagnosisData(null);
      }
    } else {
      setDiagnosisData(null);
    }
    setCheckedSession(true);
  }, [router]);

  const handleSave = () => {
    const activePartner = partnerProfiles[activePartnerIndex];
    const activeResult = resultsByPartner[activePartnerIndex] ?? null;
    const payload = {
      savedAt: new Date().toISOString(),
      partners: partnerProfiles.map((profile, index) => ({
        profile,
        compatibility: resultsByPartner[index] ?? null,
      })),
      activePartnerIndex,
      partner: activePartner
        ? {
            birthdate: activePartner.birthdate,
            birthtime: activePartner.birthtime,
          }
        : null,
      compatibility: activeResult,
    };
    localStorage.setItem("judge-code:latest-result", JSON.stringify(payload));
    setSaved(true);
  };

  if (!checkedSession) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-zinc-500 md:px-10">
          診断情報を確認しています...
        </div>
      </main>
    );
  }

  const activePartner = partnerProfiles[activePartnerIndex] ?? null;
  const result = resultsByPartner[activePartnerIndex] ?? null;
  const myProfile = getFortuneProfile({
    birthDate: selfBirthdate,
    birthTime: selfBirthtime,
  });
  const partnerProfile = getFortuneProfile({
    birthDate: activePartner?.birthdate ?? "1995-03-21",
    birthTime: activePartner?.birthtime,
  });
  const myDisplayProfile = {
    dayStem: myProfile.dayStem,
    gogyo: myProfile.gogyo,
    kyusei: myProfile.kyusei,
    koseigaku: myProfile.koseigaku,
  };
  const partnerDisplayProfile = {
    dayStem: partnerProfile.dayStem,
    gogyo: partnerProfile.gogyo,
    kyusei: partnerProfile.kyusei,
    koseigaku: partnerProfile.koseigaku,
  };
  const selfDisplay = buildDisplayProfile(selfBirthdate, selfBirthtime);
  const partnerDisplay = activePartner
    ? buildDisplayProfile(activePartner.birthdate, activePartner.birthtime)
    : null;
  console.log("myProfile", myProfile);
  console.log("myDisplayProfile", myDisplayProfile);
  console.log("partnerProfile", partnerProfile);
  console.log("partnerDisplayProfile", partnerDisplayProfile);
  const recommendedAction = result?.actions[0] ?? "週1回15分の方針共有を設定する";
  const dangerAlert = result?.cautions[0] ?? "連絡間隔のズレで誤解が起きやすい状態です";
  const selfFortune = diagnosisData?.fortuneResult.self;
  const partnerFortune = diagnosisData?.fortuneResult.partner;
  const warnings = [
    ...(selfFortune?.calculationMeta.warnings ?? []),
    ...(partnerFortune?.calculationMeta.warnings ?? []),
    partnerFortune?.nineStarKi?.note ?? "",
  ].filter(Boolean);
  const currentPhase =
    (result?.totalScore ?? 0) >= 80
      ? "前進フェーズ"
      : (result?.totalScore ?? 0) >= 60
        ? "様子見フェーズ"
        : "調整フェーズ";
  const conciseReason =
    result?.cautions[0] ?? "返信頻度と温度感から、好意はあるが慎重な状態です。";
  const ngTop = (result?.cautions ?? []).slice(0, 2);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-[#f7f7f5]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
          <a href="/" className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-[0.2em] text-zinc-900">JUDGE</span>
            <span className="text-sm font-medium tracking-wide text-zinc-500">CODE</span>
          </a>
          <span className="hidden text-xs font-medium tracking-wide text-zinc-500 sm:inline">
            診断結果
          </span>
        </div>
      </header>

      <RelationshipEssenceSection
        partnerBirthdate={activePartner?.birthdate}
        isFreeUser={isFreeUser}
      />

      <section className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-18">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Diagnosis result
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
            人間関係診断の結果
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 md:text-base">
            MVPロジック（五行・九星気学・個性学・タイミング補正）に基づく診断結果です。
          </p>
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-700">
            <p>
              お相手の生年月日:{" "}
              <span className="font-semibold text-zinc-900">{activePartner?.birthdate ?? "-"}</span>
            </p>
            <p className="mt-1">
              お相手の出生時間:{" "}
              <span className="font-semibold text-zinc-900">{activePartner?.birthtime ?? "-"}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        {diagnosisData ? (
          <div className="mb-4 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">統合占術エンジン結果</p>
            <div className="mt-3 rounded-xl bg-black p-4 text-white">
              <p className="text-xs opacity-70">関係フェーズ</p>
              <p className="mt-1 text-lg font-bold">{diagnosisData.relationshipPhase}</p>
              <p className="mt-1 text-xs text-white/80">{diagnosisData.phaseReason}</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                <p className="font-semibold text-zinc-900">四柱推命（あなた）</p>
                <p className="mt-1">日柱天干: {myDisplayProfile.dayStem}</p>
                <p>五行: {myDisplayProfile.gogyo}</p>
                <p>九星気学: {myDisplayProfile.kyusei}</p>
                <p>個性学: {myDisplayProfile.koseigaku}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                <p className="font-semibold text-zinc-900">四柱推命（お相手）</p>
                <p className="mt-1">日柱天干: {partnerDisplayProfile.dayStem}</p>
                <p>五行: {partnerDisplayProfile.gogyo}</p>
                <p>九星気学: {partnerDisplayProfile.kyusei}</p>
                <p>個性学: {partnerDisplayProfile.koseigaku}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                <p className="font-semibold text-zinc-900">五行バランス（お相手）</p>
                <p className="mt-1">五行: {partnerDisplayProfile.gogyo}</p>
                <p>主軸: {partnerDisplayProfile.gogyo}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                <p className="font-semibold text-zinc-900">九星気学（お相手）</p>
                <p className="mt-1">本命星: {partnerDisplayProfile.kyusei}</p>
                <p>月命星: {partnerDisplayProfile.kyusei}</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">計算精度</p>
              <p className="mt-1">
                あなた: {selfFortune?.calculationMeta.precisionLevel ?? "basic"} / お相手:{" "}
                {partnerFortune?.calculationMeta.precisionLevel ?? "basic"}
              </p>
              {warnings.length ? (
                <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                  {warnings.map((warning, idx) => (
                    <li key={`${warning}-${idx}`}>・{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="mb-4 rounded-xl bg-black p-5 text-white">
          <p className="text-sm opacity-70">現在の関係性</p>
          <p className="mt-1 text-xl font-bold">今は「{currentPhase}」です</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600">{conciseReason}</p>
        </div>
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="mb-2 font-bold text-red-600">やってはいけないこと</p>
          <ul className="text-sm">
            {(ngTop.length ? ngTop : ["追いLINE", "長文"]).map((item) => (
              <li key={item}>・{item}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4 rounded-lg border bg-blue-50 p-4">
          <p className="mb-2 font-bold">次の一手</p>
          <p className="text-sm">{recommendedAction}</p>
        </div>

        <details className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-700 [&::-webkit-details-marker]:hidden">
            もっと見る（相性詳細・性格分析・長文解説）
          </summary>
          <div className="mt-4 space-y-8">
            <ThreeLayerScoreSection />

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6 md:rounded-3xl md:p-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">相性サマリー</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-8">
            <div>
              <p className="text-sm text-zinc-600">総合相性スコア</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                {result?.totalScore ?? 0}
                <span className="text-lg font-medium text-zinc-500">/100</span>
              </p>
            </div>
            <div className="min-w-0 sm:max-w-md">
              <p className="text-sm text-zinc-600">タイプ</p>
              <p className="mt-1 text-lg font-semibold leading-snug text-zinc-900 sm:text-xl">
                {result?.relationshipType ?? "-"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 line-clamp-3 md:line-clamp-none md:text-[15px]">
            {result?.summary ?? "診断結果を読み込んでいます。"}
          </p>
          <p className="mt-2 text-[11px] text-zinc-500 md:hidden">全文は下の「総評（全文）」でもご覧いただけます。</p>
            </div>

            <p className="text-center text-xs font-medium leading-relaxed text-zinc-500 md:hidden">
          2人の基本プロフィール
            </p>

            <div
              className="flex flex-col gap-3 md:mt-2 md:flex-row md:gap-4"
              role="group"
              aria-label="診断対象"
            >
          <ResultPersonHeader label="あなた" initial="あ" />
          <ResultPersonHeader label="お相手" initial="相" />
            </div>

            <div className="mt-6 flex flex-col gap-6 md:hidden">
          <ProfileStatusCard title="あなたの占術ステータス" display={selfDisplay} />
          <p className="text-center text-xs font-medium leading-relaxed text-zinc-500">
            {compatibilityBridgeCopy(result)}
          </p>
          <ProfileStatusCard title="お相手の占術ステータス" display={partnerDisplay} />
            </div>

            <div className="mt-8 hidden gap-5 md:grid md:grid-cols-2">
          <ProfileStatusCard title="あなたの占術ステータス" display={selfDisplay} />
          <ProfileStatusCard title="お相手の占術ステータス" display={partnerDisplay} />
            </div>

            <div className="rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            占術ごとの相性
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              {
                label: "五行相性",
                score: result?.breakdown.fiveElement ?? 0,
                max: 40,
                note: "価値観と基礎特性の噛み合い",
              },
              {
                label: "九星気学相性",
                score: result?.breakdown.nineStar ?? 0,
                max: 30,
                note: "流れ・周期の相性",
              },
              {
                label: "個性学相性",
                score: result?.breakdown.personality ?? 0,
                max: 20,
                note: "行動特性と対話傾向の相性",
              },
              {
                label: "タイミング補正",
                score: result?.breakdown.timing ?? 0,
                max: 10,
                note: "出生時間の近さによる補正",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {item.score} / {item.max}
                </p>
                <p className="mt-1 text-sm text-zinc-600">{item.note}</p>
              </div>
            ))}
          </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            無料で見られる診断結果
          </p>
          <p className="mt-2 text-xs text-zinc-500 md:hidden">スコアとタイプは上の相性サマリーにも記載しています。</p>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
            <p className="text-sm font-semibold text-zinc-900">総評（全文）</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-700">{result?.summary}</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-sm font-semibold text-zinc-900">強み</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {(result?.strengths ?? []).map((item) => (
                  <li key={item}>・{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-sm font-semibold text-zinc-900">注意点</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {(result?.cautions ?? []).map((item) => (
                  <li key={item}>・{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-semibold text-emerald-900">推奨アクション（無料）</p>
              <p className="mt-1 text-sm text-emerald-800">{recommendedAction}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm font-semibold text-rose-900">危険アラート（無料）</p>
              <p className="mt-1 text-sm text-rose-800">{dangerAlert}</p>
            </div>
          </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">ロック中の詳細分析</p>
          <div className="relative mt-4 grid gap-4 md:grid-cols-2">
            {[
              "次に送るべきLINE",
              "ベストな誘い方",
              "NG行動リスト",
              "詳細な心理分析",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-sm font-semibold text-zinc-900">{item}</p>
                <p className="mt-2 select-none text-sm text-zinc-400 blur-[2px]">
                  詳細な内容はロックされています。LINE連携で閲覧できます。
                </p>
              </div>
            ))}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/35" />
          </div>
          <a
            href="https://line.me/R/ti/p/@judgecode"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-[#06C755] px-8 text-sm font-semibold text-white transition hover:bg-[#05af4a]"
          >
            LINEで詳細を受け取る
          </a>
            </div>
          </div>
        </details>

        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-700">
            ⚠️ 今の返信次第で、この関係は一気に動く可能性があります
          </p>
          <p className="mt-2 text-sm text-gray-600">
            分析で止まらず、次に送る1通を先に決めると失敗を減らせます。
          </p>
          <a
            href="/chat"
            className="mt-3 inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto"
          >
            LINE生成を開く
          </a>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            この結果を保存する
          </button>
          <a
            href="/diagnosis"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            入力に戻る
          </a>
          <a
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            トップへ戻る
          </a>
        </div>
        {saved ? (
          <p className="mt-4 text-sm text-zinc-600">
            結果をこのブラウザに保存しました（key: `judge-code:latest-result`）。
          </p>
        ) : null}

        <div className="mt-8 rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            Next step
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            診断結果をもとに、2人の状況に合わせた継続相談を進められます。
          </p>
          <a
            href="/chat"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            2人専用の相談ルームへ進む
          </a>
        </div>
      </section>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
          <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-zinc-500 md:px-10">
            診断結果を読み込んでいます...
          </div>
        </main>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
