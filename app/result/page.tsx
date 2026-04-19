"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ResultPage() {
  const router = useRouter();
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
              相手の生年月日:{" "}
              <span className="font-semibold text-zinc-900">{activePartner?.birthdate ?? "-"}</span>
            </p>
            <p className="mt-1">
              相手の出生時間:{" "}
              <span className="font-semibold text-zinc-900">{activePartner?.birthtime ?? "-"}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">あなた</p>
            <div className="mt-4 space-y-2 text-sm text-zinc-700">
              <p>生年月日: <span className="font-semibold text-zinc-900">{selfDisplay.birthdate}</span></p>
              <p>出生時間: <span className="font-semibold text-zinc-900">{selfDisplay.birthtime}</span></p>
              <p>日柱天干: <span className="font-semibold text-zinc-900">{selfDisplay.dayStem}</span></p>
              <p>五行: <span className="font-semibold text-zinc-900">{selfDisplay.fiveElement}</span></p>
              <p>九星気学: <span className="font-semibold text-zinc-900">{selfDisplay.nineStar}</span></p>
              <p>個性学: <span className="font-semibold text-zinc-900">{selfDisplay.personality}</span></p>
              <p>吉方位: <span className="font-semibold text-zinc-900">{selfDisplay.luckyDirection}</span></p>
            </div>
          </article>
          <article className="rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">相手</p>
            <div className="mt-4 space-y-2 text-sm text-zinc-700">
              <p>生年月日: <span className="font-semibold text-zinc-900">{partnerDisplay?.birthdate ?? "-"}</span></p>
              <p>出生時間: <span className="font-semibold text-zinc-900">{partnerDisplay?.birthtime ?? "-"}</span></p>
              <p>日柱天干: <span className="font-semibold text-zinc-900">{partnerDisplay?.dayStem ?? "-"}</span></p>
              <p>五行: <span className="font-semibold text-zinc-900">{partnerDisplay?.fiveElement ?? "-"}</span></p>
              <p>九星気学: <span className="font-semibold text-zinc-900">{partnerDisplay?.nineStar ?? "-"}</span></p>
              <p>個性学: <span className="font-semibold text-zinc-900">{partnerDisplay?.personality ?? "-"}</span></p>
              <p>吉方位: <span className="font-semibold text-zinc-900">{partnerDisplay?.luckyDirection ?? "-"}</span></p>
            </div>
          </article>
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
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-sm text-zinc-600">総合相性スコア</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{result?.totalScore ?? 0} / 100</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-sm text-zinc-600">関係性タイプ</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{result?.relationshipType ?? "-"}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
            <p className="text-sm font-semibold text-zinc-900">総評</p>
            <p className="mt-1 text-sm text-zinc-700">{result?.summary}</p>
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
