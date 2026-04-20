"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type QuickInsight = {
  personality: string;
  loveStyle: string;
  comment: string;
};

const QUICK_INSIGHT_TABLE: QuickInsight[] = [
  {
    personality: "慎重に相手を見極める観察型",
    loveStyle: "安心感を積み上げるほど深く続くタイプ",
    comment:
      "最初は距離を取りますが、信頼ができると一気に誠実さが伝わるタイプです。焦らず段階を作るほど、関係の質が上がります。",
  },
  {
    personality: "感受性が高い共感型",
    loveStyle: "言葉より空気感で温度を読むタイプ",
    comment:
      "相手の些細な反応に気づける強みがあります。気持ちを抱え込みすぎず、言葉で小さく共有すると関係が安定しやすいです。",
  },
  {
    personality: "行動が早い推進型",
    loveStyle: "決めたら一気に距離を縮めるタイプ",
    comment:
      "進展を作る力が強い反面、ペース差で誤解が起きやすい傾向もあります。タイミングを合わせる意識で強みが活きます。",
  },
  {
    personality: "調整力が高いバランス型",
    loveStyle: "衝突を避けつつ長く続けるタイプ",
    comment:
      "相手に合わせるのが上手で関係は続きやすいです。必要な場面で本音を出すほど、あなたらしさが伝わり関係が深まります。",
  },
];

function pickQuickInsight(birthdate: string): QuickInsight {
  const normalized = birthdate.replaceAll("-", "");
  const score = normalized.split("").reduce((acc, v) => acc + (Number(v) || 0), 0);
  return QUICK_INSIGHT_TABLE[score % QUICK_INSIGHT_TABLE.length] ?? QUICK_INSIGHT_TABLE[0];
}

export default function DiagnosisPage() {
  const router = useRouter();
  const [selfBirthdate, setSelfBirthdate] = useState("");
  const [selfBirthtime, setSelfBirthtime] = useState("");
  const [partnerBirthdate, setPartnerBirthdate] = useState("");
  const [partnerBirthtime, setPartnerBirthtime] = useState("");
  const [didCompleteStep1, setDidCompleteStep1] = useState(false);
  const [showPartnerStep, setShowPartnerStep] = useState(false);

  const insight = useMemo(
    () => (didCompleteStep1 && selfBirthdate ? pickQuickInsight(selfBirthdate) : null),
    [didCompleteStep1, selfBirthdate]
  );

  const handleStep1Submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selfBirthdate) return;
    sessionStorage.setItem("judge-code:self-birthdate", selfBirthdate);
    sessionStorage.setItem("judge-code:self-birthtime", selfBirthtime);
    setDidCompleteStep1(true);
  };

  const handleFinalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partnerBirthdate) return;

    sessionStorage.setItem("judge-code:partner-birthdate", partnerBirthdate);
    // 互換性維持: 未入力時は既存ロジックが壊れないようデフォルトを保存
    sessionStorage.setItem("judge-code:partner-birthtime", partnerBirthtime || "12:00");
    router.push("/result");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-[#f7f7f5]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <a href="/" className="text-xs font-semibold tracking-[0.18em] text-zinc-900">
            JUDGE CODE
          </a>
          <span className="text-[11px] font-medium tracking-wide text-zinc-500">人間関係診断</span>
        </div>
      </header>

      <section className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            Step input
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            まずはあなたの情報だけで、今すぐ傾向を見ます
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            最初の入力は最小限。先にあなたの傾向を表示し、そのあと相手入力へ進めます。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-6 pb-10">
        <article className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            STEP1
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950">あなたの生年月日を入力</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            出生時間は任意です（あとからでもOK）
          </p>

          <form onSubmit={handleStep1Submit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="self-birthdate" className="text-sm font-medium text-zinc-700">
                生年月日
              </label>
              <input
                id="self-birthdate"
                type="date"
                required
                value={selfBirthdate}
                onChange={(e) => setSelfBirthdate(e.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="self-birthtime" className="text-sm font-medium text-zinc-700">
                出生時間（任意）
              </label>
              <input
                id="self-birthtime"
                type="time"
                value={selfBirthtime}
                onChange={(e) => setSelfBirthtime(e.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              まず自分の傾向を見る
            </button>
          </form>
        </article>

        {didCompleteStep1 && insight ? (
          <article className="mt-5 rounded-3xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">
              STEP2
            </p>
            <h3 className="mt-1 text-lg font-semibold text-emerald-950">あなたの簡易分析</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700">性格</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{insight.personality}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700">恋愛傾向</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{insight.loveStyle}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700">短い分析コメント</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700">{insight.comment}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-700">
              相性だけでは関係は決まりません。運気・タイミング・行動で結果は変わります。
            </p>
            {!showPartnerStep ? (
              <button
                type="button"
                onClick={() => setShowPartnerStep(true)}
                className="mt-4 inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                相手も見る
              </button>
            ) : null}
          </article>
        ) : null}

        {didCompleteStep1 && showPartnerStep ? (
          <article className="mt-5 rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              STEP3
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950">相手の情報を入力</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              生年月日だけでも進めます。出生時間は任意です。
            </p>

            <form onSubmit={handleFinalSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="partner-birthdate" className="text-sm font-medium text-zinc-700">
                  お相手の生年月日
                </label>
                <input
                  id="partner-birthdate"
                  type="date"
                  required
                  value={partnerBirthdate}
                  onChange={(e) => setPartnerBirthdate(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="partner-birthtime" className="text-sm font-medium text-zinc-700">
                  お相手の出生時間（任意）
                </label>
                <input
                  id="partner-birthtime"
                  type="time"
                  value={partnerBirthtime}
                  onChange={(e) => setPartnerBirthtime(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                STEP4: 診断結果を見る
              </button>
            </form>
          </article>
        ) : null}
      </section>
    </main>
  );
}
