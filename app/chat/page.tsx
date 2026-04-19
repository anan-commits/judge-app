"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildPartnerProfile,
  calculateCompatibility,
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

/** AI返答は必ずこの6キーで構成（表示順固定） */
export type AiReplySections = {
  currentState: string;
  partnerMind: string;
  integratedEvidence: string;
  recommendedAction: string;
  ngActions: string;
  replyDraft: string;
};

type ConsultThread = {
  id: string;
  date: string;
  userText: string;
  /** 最新スレッドのみ6セクション。それ以外は短文ダミー */
  assistantMode: "simple" | "sixSections";
  assistantSimpleText?: string;
  sections?: AiReplySections;
};

const LINE_DETAIL_URL = "https://line.me/R/ti/p/@judgecode";

const dummyThreads: ConsultThread[] = [
  {
    id: "t1",
    date: "2026-04-17",
    userText: "初回デート後、次の連絡はいつ頃が自然ですか？",
    assistantMode: "simple",
    assistantSimpleText:
      "翌日〜2日以内の軽い一言が無難です。長文より短い感謝＋次の候補日を添えると続きやすいです。",
  },
  {
    id: "t2",
    date: "2026-04-18",
    userText: "相手が既読だけで返さないとき、どう待てばいい？",
    assistantMode: "simple",
    assistantSimpleText:
      "まず24〜48時間は様子を見るのが安全です。生活リズム差を前提に、短文で「急がない」一言を添えると負担が減ります。",
  },
  {
    id: "t3",
    date: "2026-04-20",
    userText: "既読はつくけど返信が来ない時、追撃していいですか？",
    assistantMode: "sixSections",
    sections: {
      currentState:
        "即時返信が難しいタイミングに入り、未返信が不安材料になっています。関係の温度自体は維持されている前提で整理します。",
      partnerMind:
        "拒絶ではなく、返答内容を考える余裕がない・優先順位が下がっている可能性が高いです。",
      integratedEvidence:
        "五行は価値観の土台が近く衝突は小さめ。九星は反応が遅れやすい周期に重なりやすい。個性学は結論を急かすと防衛が出やすいタイプの組み合わせです。",
      recommendedAction: "24時間以上空けて、要点1つだけの短文で再送する。",
      ngActions: "連続送信、感情的な詰問、既読確認の強要。",
      replyDraft: "「急ぎじゃないので、落ち着いたら一言だけもらえると安心です。」",
    },
  },
];

const SECTION_DEF: { key: keyof AiReplySections; title: string }[] = [
  { key: "currentState", title: "1. 現状整理" },
  { key: "partnerMind", title: "2. 相手の心理" },
  { key: "integratedEvidence", title: "3. 統合占術の根拠（五行 / 九星 / 個性学）" },
  { key: "recommendedAction", title: "4. 推奨アクション" },
  { key: "ngActions", title: "5. NG行動" },
  { key: "replyDraft", title: "6. 返信案" },
];

function AiSixSectionCards({
  sections,
  isFreeUser,
}: {
  sections: AiReplySections;
  isFreeUser: boolean;
}) {
  return (
    <div className="space-y-4">
      {SECTION_DEF.map(({ key, title }) => {
        const value = sections[key];
        const isUnlocked = key === "currentState" || key === "recommendedAction";
        const locked = isFreeUser && !isUnlocked;

        return (
          <div
            key={key}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold tracking-wide text-zinc-500">{title}</p>
            <p
              aria-hidden={locked || undefined}
              className={`mt-3 text-sm leading-relaxed text-zinc-800 ${
                locked ? "select-none blur-[3px]" : ""
              }`}
            >
              {value}
            </p>
            {locked ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href="/result"
                  className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 sm:flex-none"
                >
                  続きを見る
                </Link>
                <a
                  href={LINE_DETAIL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full bg-[#06C755] px-4 text-sm font-semibold text-white hover:bg-[#05af4a] sm:flex-none"
                >
                  LINEで詳細を受け取る
                </a>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [partner, setPartner] = useState<PersonProfile | null>(null);
  /** デモ用: `/chat?full=1` で有料相当（6セクションすべて表示） */
  const isFreeUser = searchParams.get("full") !== "1";

  useEffect(() => {
    const birthdate = sessionStorage.getItem("judge-code:partner-birthdate");
    const birthtime = sessionStorage.getItem("judge-code:partner-birthtime");
    if (!birthdate || !birthtime) {
      router.replace("/diagnosis");
      return;
    }

    const partnerProfile = buildPartnerProfile(birthdate, birthtime);
    setPartner(partnerProfile);
    setResult(calculateCompatibility(selfProfile, partnerProfile));
    setChecked(true);
  }, [router]);

  const summaryTags = useMemo(() => {
    if (!result) return [];
    return [
      `総合 ${result.totalScore}/100`,
      `タイプ ${result.relationshipType}`,
      `強み ${result.strengths[0] ?? "-"}`,
      `注意 ${result.cautions[0] ?? "-"}`,
    ];
  }, [result]);

  if (!checked) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-500">
          相談ルームを準備しています...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <a href="/" className="text-xs font-semibold tracking-[0.18em] text-zinc-900">
            JUDGE CODE
          </a>
          <span className="text-[11px] font-medium tracking-wide text-zinc-500">恋愛伴走</span>
        </div>
      </header>

      <section className="sticky top-0 z-20 border-b border-zinc-200/80 bg-[#f7f7f5]/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            2人の相性サマリー
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summaryTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[11px] text-zinc-700"
              >
                {tag}
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[11px] text-zinc-700">
              相手 {partner?.birthdate ?? "-"}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-5 pb-8">
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm md:p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            チャット相談履歴
          </p>
          <p className="mt-1 text-xs text-zinc-500">ダミー3件（最新のみ6セクション形式）</p>

          <div className="mt-5 space-y-6">
            {dummyThreads.map((thread) => (
              <div key={thread.id} className="border-b border-zinc-100 pb-6 last:border-0 last:pb-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-zinc-500">{thread.date}</span>
                  {thread.assistantMode === "sixSections" ? (
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
                      最新
                    </span>
                  ) : null}
                </div>

                <article className="ml-auto max-w-[92%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    あなた
                  </p>
                  <p className="leading-relaxed">{thread.userText}</p>
                </article>

                <div className="mt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Judge Code AI
                  </p>
                  {thread.assistantMode === "simple" ? (
                    <article className="max-w-[96%] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800">
                      {thread.assistantSimpleText}
                    </article>
                  ) : thread.sections ? (
                    <AiSixSectionCards sections={thread.sections} isFreeUser={isFreeUser} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              相談入力のヒント
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-700">
              <li>・LINEを貼り付ける</li>
              <li>・スクショを送る</li>
              <li>・送りたい文章を相談する</li>
            </ul>
            <label className="mt-3 inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">
              スクショを選択（準備中）
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3">
            <textarea
              rows={3}
              placeholder="ここに2人の状況や相談したい文面を入力してください（MVPでは送信は未接続）"
              className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800"
              >
                送信（準備中）
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
          <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-500">
            相談ルームを準備しています...
          </div>
        </main>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
