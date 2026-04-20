"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildPartnerProfile,
  calculateCompatibility,
  type FiveElement,
  type CompatibilityResult,
  type PersonProfile,
} from "../lib/compatibility";

const selfProfile: PersonProfile = {
  birthdate: "1992-11-08",
  birthtime: "08:24",
  fiveElement: "wood",
  nineStar: 3,
  personalityType: 7,
};

const dayStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const luckyDirections = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"] as const;
/**
 * 課金導線用コピー（MVPダミー）。essence→tendency→neglectRisk が一文脈でつながるストーリー。
 * 後から診断スコア・タイプと接続。
 */
type RelationshipConversionPattern = {
  essence: string;
  tendency: string;
  neglectRisk: string;
  /** 本質の続きで最重要な一点をぼかして見せる（課金ティーズ） */
  tease: string;
};

const RELATIONSHIP_CONVERSION_PATTERNS: RelationshipConversionPattern[] = [
  {
    essence: "この2人は、近づくほど「仲良さそうに見えて温度が合わない」空気が出やすい関係です。",
    tendency:
      "その空気の中で、あなたは返信が遅いと不安を口にしたり、確認の一言を重ねてしまいやすくなります。",
    neglectRisk:
      "相手は負担として距離を置き、あなただけが画面の前で空回りし続けやすいです。気づかないうちに関係が終わる可能性があります。",
    tease:
      "決定的なのは、LINEの文面そのものより「相手が無意識に出しているサイン」をどこで拾うかです。ここを外すと温度差は埋まらず、逆に“空回りのループ”だけが残りやすくなります。",
  },
  {
    essence: "この2人は、言葉に出さないすれ違いが静かに積もりやすい関係です。",
    tendency:
      "その積もりを抱えたまま、あなたは察してほしい気持ちだけを増やし、LINEを開いては閉じるを繰り返しやすくなります。",
    neglectRisk:
      "ある日突然、相手からの温度がゼロになるタイミングが来やすいです。あなたが気づいたときには、もう戻れないラインまで進んでいる可能性があります。",
    tease:
      "本当に危ないのは、既読の有無より「沈黙の“長さ”と相手の生活リズムが重なる瞬間」です。この交差点を読めないまま送る一言が、関係を静かに終わらせるトリガーになりやすいです。",
  },
  {
    essence: "この2人は、好意を出し合うほど踏み込みの度合いがズレやすい関係です。",
    tendency:
      "そのズレを埋めようとして、あなたは連絡の回数と文章量を増やし、「ちゃんと伝えよう」と必死になりやすくなります。",
    neglectRisk:
      "相手にとってはしつこさに見え、沈黙・既読スルー・距離の固定化に進みやすいです。挽回がきかないほど冷え切る可能性があります。",
    tease:
      "踏み込みの強さを調整する鍵は、文章の長さではなく「相手が今いる心理フェーズ」への合わせ方にあります。フェーズを誤ると、好意が一気に負担に反転しやすいです。",
  },
  {
    essence: "この2人は、一度盛り上がったあと急に温度差が露わになりやすい関係です。",
    tendency:
      "その落差に耐えられず、あなたは我慢と追い討ちのあいだを往復し、自分を責める言葉まで増やしやすくなります。",
    neglectRisk:
      "あなたの我慢は相手に伝わらず、「別にいいや」で終わらせられやすいです。気づかないうちに関係が終わる可能性があります。",
    tease:
      "盛り上がり直後にだけ出る「相手の安心サイン」と、その後にだけ出る「距離を取るサイン」はセットで読む必要があります。片方だけを信じると、急な冷め込みにあなただけが取り残されやすいです。",
  },
  {
    essence: "この2人は、表面的には穏やかでも、内心の不安だけが肥大化しやすい関係です。",
    tendency:
      "その不安を隠したまま、あなたは既読や返信の速さを何度も確かめ、小さなサインを探し続けやすくなります。",
    neglectRisk:
      "本音のタイミングを逃したまま時間が空くほど、相手は勝手な解釈で距離を決めやすいです。あなたが気づいたときには、もう終わっている可能性があります。",
    tease:
      "表面の穏やかさが続くほど、相手の頭の中では「別ルートの結論」が先に固まりやすいです。あなたが気づく前に、会話の前提だけがすり替わっているパターンが起きやすいです。",
  },
];

const nineStarLabels = [
  "",
  "一白水星",
  "二黒土星",
  "三碧木星",
  "四緑木星",
  "五黄土星",
  "六白金星",
  "七赤金星",
  "八白土星",
  "九紫火星",
] as const;

function toElementLabel(value: FiveElement): string {
  const map: Record<FiveElement, string> = {
    wood: "木",
    fire: "火",
    earth: "土",
    metal: "金",
    water: "水",
  };
  return map[value];
}

function toPersonalityLabel(value: number): string {
  const labels = ["先導型", "分析型", "調整型", "実行型", "創造型", "慎重型", "調和型", "挑戦型", "安定型", "支援型", "戦略型", "柔軟型"];
  return labels[(value - 1) % labels.length] ?? "調和型";
}

function buildDisplayProfile(base: PersonProfile) {
  const seed = Number(base.birthdate.replaceAll("-", "").slice(-2)) || 1;
  return {
    birthdate: base.birthdate,
    birthtime: base.birthtime,
    dayStem: dayStems[seed % dayStems.length],
    fiveElement: toElementLabel(base.fiveElement),
    nineStar: nineStarLabels[base.nineStar] ?? `${base.nineStar}星`,
    personality: toPersonalityLabel(base.personalityType),
    luckyDirection: luckyDirections[seed % luckyDirections.length],
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
          いまの関係を、一文のストーリーで読み解く
        </p>
        <h2
          id="relationship-conversion-heading"
          className="mt-2 text-base font-semibold leading-snug text-amber-950 sm:text-lg"
        >
          関係性 → あなたの動き → その先に待っている落とし穴
        </h2>

        <div className="mt-6 max-w-2xl space-y-6 border-l-2 border-amber-200/90 pl-4 sm:pl-5">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-amber-900/75">関係性</p>
            <p className="mt-1.5 text-sm font-normal leading-[1.75] text-amber-950 sm:text-[15px]">
              {essence}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-amber-900/75">その中でのあなた</p>
            <p className="mt-1.5 text-sm font-normal leading-[1.75] text-amber-950 sm:text-[15px]">
              {tendency}
            </p>
          </div>
          <div
            role="note"
            className="rounded-r-xl border-l-4 border-red-600 bg-red-50/95 py-3 pl-4 pr-3 shadow-sm sm:py-4 sm:pl-5"
          >
            <p className="text-[11px] font-bold tracking-wide text-red-900">その結果（放置リスク）</p>
            <p className="mt-2 text-sm font-semibold leading-[1.75] text-red-950 sm:text-[15px]">
              {neglectRisk}
            </p>
          </div>

          {isFreeUser ? (
            <div className="space-y-4 border-t border-dashed border-amber-300/70 pt-6">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-amber-900/80">
                  続きの核心（プレビュー）
                </p>
                <p
                  aria-hidden
                  className="mt-2 select-none text-sm leading-[1.75] text-amber-950/90 blur-[3.5px] sm:text-[15px]"
                >
                  {tease}
                </p>
                <p className="sr-only">{tease}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log("[paywall] 続きを見る ¥980", { patternIndex });
                }}
                className="inline-flex h-12 min-h-[48px] w-full max-w-md items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800"
              >
                続きを見る（¥980）
              </button>
            </div>
          ) : null}
        </div>
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

  useEffect(() => {
    const birthdate = sessionStorage.getItem("judge-code:partner-birthdate");
    const birthtime = sessionStorage.getItem("judge-code:partner-birthtime");

    if (!birthdate || !birthtime) {
      router.replace("/diagnosis");
      return;
    }

    const partner = buildPartnerProfile(birthdate, birthtime);
    const partnerList = [partner];
    setPartnerProfiles(partnerList);
    setResultsByPartner(partnerList.map((item) => calculateCompatibility(selfProfile, item)));
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

  const selfDisplay = buildDisplayProfile(selfProfile);
  const activePartner = partnerProfiles[activePartnerIndex] ?? null;
  const result = resultsByPartner[activePartnerIndex] ?? null;
  const partnerDisplay = activePartner ? buildDisplayProfile(activePartner) : null;
  const recommendedAction = result?.actions[0] ?? "週1回15分の方針共有を設定する";
  const dangerAlert = result?.cautions[0] ?? "連絡間隔のズレで誤解が起きやすい状態です";

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

        <p className="mt-6 text-center text-xs font-medium leading-relaxed text-zinc-500 md:hidden">
          2人の基本プロフィール
        </p>

        <div
          className="mt-3 flex flex-col gap-3 md:mt-8 md:flex-row md:gap-4"
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

        <div className="mt-8 rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
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

        <div className="mt-8 rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
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

        <div className="mt-8 rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
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
