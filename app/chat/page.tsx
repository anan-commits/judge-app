"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

/** `/chat?full=1` で相手入力が無いときに相性サマリー用に使うダミー */
const DEMO_PARTNER_BIRTHDATE = "1995-03-21";
const DEMO_PARTNER_BIRTHTIME = "15:00";

/** 未診断モード: この文字数以上の入力（下書き）または1回の送信で診断導線を出す */
const DEEP_CONSULT_MIN_CHARS = 120;
/** 未診断モード: この送信回数で診断導線を出す */
const DIAGNOSIS_NUDGE_AFTER_SENDS = 3;

const UNDIAGNOSED_LIGHT_REPLY_T3 =
  "まず24〜48時間は間を空けるのが無難です。要点は1つに絞った短文にすると負担が少ないです。（※五行・九星などの統合視点は診断後に案内します）";

type ChatMode = "loading" | "full" | "diagnosed" | "undiagnosed";

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

function threadsForMode(mode: ChatMode): ConsultThread[] {
  if (mode !== "undiagnosed") return dummyThreads;
  return dummyThreads.map((t) =>
    t.id === "t3"
      ? {
          ...t,
          assistantMode: "simple" as const,
          assistantSimpleText: UNDIAGNOSED_LIGHT_REPLY_T3,
          sections: undefined,
        }
      : t,
  );
}

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

function ChatPaywallCard() {
  return (
    <div
      role="region"
      aria-label="有料開放の案内"
      className="rounded-2xl border border-amber-200/90 bg-amber-50/95 p-4 shadow-sm ring-1 ring-amber-100/60 sm:p-5"
    >
      <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-amber-950 sm:text-base">
        この状況では最初の一言で結果が変わります
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-amber-950/90">
        <li>・送るべき具体的なLINE</li>
        <li>・NG行動</li>
        <li>・相手の心理</li>
      </ul>
      <button
        type="button"
        onClick={() => {
          console.log("[paywall] 続きを見る ¥980");
        }}
        className="mt-4 flex h-12 w-full min-h-[48px] items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 active:bg-zinc-800"
      >
        続きを見る（¥980）
      </button>
    </div>
  );
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ChatMode>("loading");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [partner, setPartner] = useState<PersonProfile | null>(null);
  const [draft, setDraft] = useState("");
  const [sendCount, setSendCount] = useState(0);
  const [showDiagnosisNudge, setShowDiagnosisNudge] = useState(false);

  const isFullDemo = searchParams.get("full") === "1";
  const isFreeUser = !isFullDemo;

  useEffect(() => {
    const storedBirthdate = sessionStorage.getItem("judge-code:partner-birthdate");
    const storedBirthtime = sessionStorage.getItem("judge-code:partner-birthtime");
    const hasStoredPartner = Boolean(storedBirthdate && storedBirthtime);

    if (isFullDemo) {
      const birthdate = storedBirthdate || DEMO_PARTNER_BIRTHDATE;
      const birthtime = storedBirthtime || DEMO_PARTNER_BIRTHTIME;
      const partnerProfile = buildPartnerProfile(birthdate, birthtime);
      setPartner(partnerProfile);
      setResult(calculateCompatibility(selfProfile, partnerProfile));
      setMode("full");
      return;
    }

    if (hasStoredPartner) {
      const partnerProfile = buildPartnerProfile(storedBirthdate!, storedBirthtime!);
      setPartner(partnerProfile);
      setResult(calculateCompatibility(selfProfile, partnerProfile));
      setMode("diagnosed");
      return;
    }

    setPartner(null);
    setResult(null);
    setMode("undiagnosed");
  }, [isFullDemo]);

  useEffect(() => {
    if (mode !== "undiagnosed") {
      setShowDiagnosisNudge(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "undiagnosed") return;
    if (draft.trim().length >= DEEP_CONSULT_MIN_CHARS) {
      setShowDiagnosisNudge(true);
    }
  }, [mode, draft]);

  const displayThreads = useMemo(() => threadsForMode(mode), [mode]);

  const summaryTags = useMemo(() => {
    if (!result) return [];
    return [
      `総合 ${result.totalScore}/100`,
      `タイプ ${result.relationshipType}`,
      `強み ${result.strengths[0] ?? "-"}`,
      `注意 ${result.cautions[0] ?? "-"}`,
    ];
  }, [result]);

  const handleSend = () => {
    const text = draft.trim();
    if (mode === "undiagnosed" && text.length > 0) {
      const nextCount = sendCount + 1;
      setSendCount(nextCount);
      const longMessage = text.length >= DEEP_CONSULT_MIN_CHARS;
      if (nextCount >= DIAGNOSIS_NUDGE_AFTER_SENDS || longMessage) {
        setShowDiagnosisNudge(true);
      }
    }
    setDraft("");
  };

  if (mode === "loading") {
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
          {mode === "undiagnosed" ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  未診断モード
                </p>
                <span className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                  軽いアドバイスのみ
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                相手の生年月日が未入力のため、統合占術のサマリーは表示されません。診断すると深い伴走が利用できます。
              </p>
              <Link
                href="/diagnosis"
                className="mt-2 inline-flex text-xs font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
              >
                2人の診断をはじめる
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-5 pb-8">
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm md:p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            チャット相談履歴
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {mode === "undiagnosed"
              ? "ダミー履歴（未診断のため短文アドバイスのみ）"
              : "ダミー3件（最新のみ6セクション形式）"}
          </p>

          <div className="mt-5 space-y-6">
            {displayThreads.map((thread) => (
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

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4">
            {mode === "undiagnosed" && showDiagnosisNudge ? (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Judge Code AI
                </p>
                <ChatPaywallCard />
              </div>
            ) : null}
            <textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                mode === "undiagnosed"
                  ? "状況を書くと、まずは軽い観点からの返答を想定しています（送信は準備中・回数のみカウント）"
                  : "ここに2人の状況や相談したい文面を入力してください（MVPでは送信は未接続）"
              }
              className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
            />
            {mode === "undiagnosed" ? (
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                発言が{DIAGNOSIS_NUDGE_AFTER_SENDS}回以上、または{DEEP_CONSULT_MIN_CHARS}
                文字以上入力したとき、上に続き開放の案内が表示されます。
              </p>
            ) : null}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSend}
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
