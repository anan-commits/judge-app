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
import {
  isAuthenticated,
  loadPeopleByUser,
  loadRelationshipLogsByUser,
  saveRelationshipLogsByUser,
} from "../../lib/people/storage";
import type { Person, Relationship, RelationshipLog } from "../../lib/people/types";
import { detectRelationshipPhase } from "../../lib/relationship/phase";
import AuthAction from "../../components/AuthAction";

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
const LATEST_INPUT_KEY = "judge_latest_input";

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
type StrategyMode = "reply" | "position" | "future" | "line";

type StrategyAnalysis = {
  kind: "generic" | "line";
  title: string;
  phaseLabel: "接近フェーズ" | "慎重接近フェーズ" | "距離注意フェーズ";
  favorability: number;
  distanceLabel: "やや近い" | "適正距離" | "やや遠い";
  line1: string;
  line2: string;
  line3: string;
  paidLine: string;
  lineDraft?: string;
  linePatterns?: { type: string; text: string }[];
  ngList?: string[];
  point?: string;
  usedHistory?: boolean;
};

type LiveAnalysisEntry = {
  id: string;
  mode: StrategyMode;
  userText: string;
  analysis: StrategyAnalysis;
};

type RelationshipLogItem = {
  id: string;
  personId?: string;
  timestamp?: number;
  date?: string;
  type: "line" | "date" | "call" | "note" | "LINE" | "デート" | "気づき";
  content: string;
};

type QuickLogType = "line" | "talk" | "date" | "call" | "note";

type LatestInput = {
  myBirthDate?: string;
  myBirthTime?: string;
  partnerBirthDate?: string;
  partnerBirthTime?: string;
  personId?: string;
  relationshipType?: Relationship["type"];
};

const relationshipLabelMap: Record<Relationship["type"], string> = {
  love: "恋愛",
  work: "仕事",
  friend: "友人",
  family: "家族",
};

const quickLogLabels: Record<QuickLogType, string> = {
  line: "LINE",
  talk: "会話",
  date: "デート",
  call: "電話",
  note: "気づき",
};

const quickSuggestions: { type: QuickLogType; label: string; content: string }[] = [
  { type: "line", label: "既読スルーされた", content: "既読スルーされた" },
  { type: "line", label: "返信きた", content: "返信きた" },
  { type: "date", label: "デートした", content: "デートした" },
  { type: "call", label: "電話した", content: "電話した" },
];

function analyzeQuickLog(type: QuickLogType, content: string): string {
  const normalized = content.toLowerCase();
  if (normalized.includes("既読") && normalized.includes("スルー")) {
    return "既読スルー直後は追撃より待機が安全です。次の一手は短文1通に絞ると温度差を抑えやすいです。";
  }
  if (type === "date") {
    return "デート後は感謝＋次の余白を残す一言が有効です。結論を急がず接点維持を優先してください。";
  }
  if (type === "call") {
    return "電話後は情報量が多くなりやすいため、要点1つのフォローLINEで関係を安定させるのが最適です。";
  }
  if (type === "line" && normalized.includes("返信")) {
    return "返信が来た局面は主導しすぎず、相手が返しやすい短文で往復回数を増やすと前進しやすいです。";
  }
  return "記録を反映しました。温度差と相手の負荷を見ながら、次は短文・余白ありで動くのが安全です。";
}

function buildPhaseMeta(
  mode: StrategyMode,
  text: string
): Pick<StrategyAnalysis, "phaseLabel" | "favorability" | "distanceLabel"> {
  const normalized = text.toLowerCase();
  const hasRiskWord = ["無理", "既読", "未読", "冷め", "しんど", "距離", "返事ない"].some((w) =>
    normalized.includes(w)
  );
  const base = text.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const favorability = 62 + (base % 23); // 62-84%
  if (hasRiskWord) {
    return {
      phaseLabel: "距離注意フェーズ",
      favorability,
      distanceLabel: "やや遠い",
    };
  }
  if (mode === "line" || mode === "reply") {
    return {
      phaseLabel: "慎重接近フェーズ",
      favorability,
      distanceLabel: "適正距離",
    };
  }
  return {
    phaseLabel: "接近フェーズ",
    favorability,
    distanceLabel: "やや近い",
  };
}

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

function detectTone(text: string): "ポジティブ" | "ネガティブ" {
  const negativeHints = ["無理", "もう", "疲れ", "既読", "未読", "冷め", "しんど", "距離", "返事ない"];
  const normalized = text.toLowerCase();
  return negativeHints.some((word) => normalized.includes(word)) ? "ネガティブ" : "ポジティブ";
}

function buildStrategyAnalysis(mode: StrategyMode, text: string): StrategyAnalysis {
  const meta = buildPhaseMeta(mode, text);
  if (mode === "reply") {
    const tone = detectTone(text);
    const lead = tone === "ネガティブ" ? "相手優位" : "拮抗";
    return {
      kind: "generic",
      title: "返信分析",
      ...meta,
      line1: `感情トーン: ${tone}`,
      line2: `何が起きてるか: 返答に迷いがあり、温度合わせ待ちの状態です。`,
      line3: `主導権: ${lead}（あなたの一言で流れを戻せる局面）`,
      paidLine: "具体的LINE案: 『責めずに温度だけ合わせる1通』を先に送ると反応率が上がりやすいです。",
    };
  }
  if (mode === "position") {
    return {
      kind: "generic",
      title: "ポジション分析",
      ...meta,
      line1: "本命: 感情は強いが慎重で、決定打待ちの位置",
      line2: "安定: 連絡継続はしやすいが熱量は上がりにくい位置",
      line3: "刺激: 反応は出るが長期安定しにくい位置",
      paidLine: "具体的LINE案: 本命化に寄せる『安心＋余白』の一文テンプレを提示できます。",
    };
  }
  if (mode === "line") {
    const compact = text.replaceAll("\n", " ").slice(0, 80);
    const base = compact ? `「${compact}」の件も、` : "";
    const patterns = [
      {
        type: "軽め",
        text: `今日はありがとう😊 ${base}また話せるタイミングで連絡もらえたら嬉しい。`,
      },
      {
        type: "標準",
        text: `今日はありがとう。${base}無理のない範囲で、近いうちに少し話せると嬉しいです。`,
      },
      {
        type: "少し主導",
        text: `今週どこかで10分だけ話せる？ ${base}タイミング合わせて前に進めたい。`,
      },
    ];
    const lineDraft = patterns[0].text;
    return {
      kind: "line",
      title: "意思決定提案",
      ...meta,
      line1: `現在の関係は温度差が出やすく、相手は慎重に様子を見ている局面です。`,
      line2: "今の最適行動: 送るなら短文1通。迷うなら半日待ってから軽めで送る。",
      line3: "分岐: このまま押すと防衛反応が上がりやすく、余白を作ると関係維持が安定しやすいです。",
      paidLine: lineDraft,
      lineDraft,
      linePatterns: patterns,
      ngList: ["感情のぶつけ連投", "返事を急かす圧のある文", "過去の不満を一度に書く"],
      point: "結論を1つに絞り、相手が返しやすい短文で送るほど反応率が上がります。",
    };
  }
  return {
    kind: "generic",
    title: "未来分岐",
    ...meta,
    line1: "このままいくと: 連絡は続くが、曖昧な関係で停滞しやすいです。",
    line2: "ミスると: 追い連絡で相手の防衛が上がり、返信間隔がさらに伸びます。",
    line3: "勝ち筋: 次の1通で目的を1つに絞ると、関係が前進しやすくなります。",
    paidLine: "具体的LINE案: 分岐を好転させる『短文3パターン』を状況別に出し分けます。",
  };
}

async function buildStrategyAnalysisViaApi(
  mode: StrategyMode,
  text: string,
  context?: {
    currentPerson?: Person | null;
    currentPersonId?: string;
    latestInput?: LatestInput | null;
    logs?: RelationshipLogItem[];
  },
): Promise<StrategyAnalysis | null> {
  try {
    const meta = buildPhaseMeta(mode, text);
    const logs = (context?.logs ?? []).map((item) => ({
      id: item.id,
      date:
        item.date ||
        new Date(item.timestamp || Date.now()).toISOString().slice(0, 10),
      type:
        item.type === "line"
          ? "LINE"
          : item.type === "date"
            ? "デート"
            : "気づき",
      content: item.content,
    }));
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: text,
        mode,
        logs,
        context: {
          person: context?.currentPerson
            ? {
                id: context.currentPerson.id,
                name: context.currentPerson.name,
                birthDate: context.currentPerson.birthDate,
                birthTime: context.currentPerson.birthTime,
                memo: context.currentPerson.memo,
              }
            : null,
          latestInput: context?.latestInput ?? null,
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      usedHistory?: boolean;
      generic?: {
        status?: string;
        action?: string;
        ng?: string;
        note?: string;
        overview?: string;
        reason?: string;
        branch?: string;
      };
      line?: { light?: string; standard?: string; lead?: string; reason?: string };
    };

    if (mode === "line") {
      const light = data.line?.light || "今日はありがとう。落ち着いたらまた話せると嬉しい。";
      const standard = data.line?.standard || "今日はありがとう。今週どこかで少し話せると嬉しい。";
      const lead = data.line?.lead || "今週どこかで少し話せる？タイミング合わせたい。";
      return {
        kind: "line",
        title: "意思決定提案",
        ...meta,
        line1: data.generic?.overview || "ログを踏まえた状況整理を反映しています。",
        line2: data.generic?.action || "今は短文で余白を残す判断が最適です。",
        line3: data.generic?.branch || "このまま押すと温度差が拡大しやすく、引くと関係維持が安定します。",
        paidLine: light,
        lineDraft: light,
        linePatterns: [
          { type: "軽め", text: light },
          { type: "標準", text: standard },
          { type: "少し主導", text: lead },
        ],
        ngList:
          data.generic?.ng
            ?.split("\n")
            .map((s) => s.replace(/^・/, "").trim())
            .filter(Boolean)
            .slice(0, 3) ?? ["感情のぶつけ連投", "返事を急かす圧のある文", "過去の不満を一度に書く"],
        point: data.generic?.reason || data.line?.reason || "占術とログから見た判断理由です。",
        usedHistory: Boolean(data.usedHistory),
      };
    }

    return {
      kind: "generic",
      title: mode === "reply" ? "返信分析" : mode === "position" ? "ポジション分析" : "未来分岐",
      ...meta,
      line1: `現在の関係ステータス: ${data.generic?.status || "慎重フェーズ"}`,
      line2: `次に取るべき行動: ${data.generic?.action || "要点1つで送る"}`,
      line3: `NG行動: ${data.generic?.ng || "感情の連投"}`,
      paidLine: `補足: ${data.generic?.note || "ログを重ねると精度が上がります。"}`,
      usedHistory: Boolean(data.usedHistory),
    };
  } catch {
    return null;
  }
}

function StrategyAnalysisCard({
  analysis,
  locked,
  isPaidUser,
}: {
  analysis: StrategyAnalysis;
  locked: boolean;
  isPaidUser: boolean;
}) {
  const patterns = analysis.linePatterns ?? [{ type: "基本", text: analysis.lineDraft ?? "" }];
  const [activePattern, setActivePattern] = useState(0);
  const selectedLine = patterns[activePattern]?.text ?? "";
  const previewLine = `${selectedLine.slice(0, 24)}…（続きは有料）`;
  const lineForDisplay = locked ? previewLine : selectedLine;

  const copyLine = async () => {
    if (!selectedLine || !isPaidUser) return;
    try {
      await navigator.clipboard.writeText(selectedLine);
      console.log("[line-copy] copied");
    } catch {
      console.log("[line-copy] failed");
    }
  };

  if (analysis.kind === "line") {
    return (
      <article className="max-w-[96%] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800">
        <p className="text-xs font-semibold tracking-wide text-zinc-500">{analysis.title}</p>
        <div className="mb-2 mt-1 text-xs text-gray-400">
          四柱推命・九星気学・五行バランスを統合して算出
        </div>
        <div className="mb-4 rounded-xl bg-black p-4 text-white">
          <p className="text-xs opacity-70">統合占術による関係フェーズ</p>
          <p className="text-lg font-bold">{analysis.phaseLabel}</p>
        </div>
        <div className="mb-4 flex gap-3 text-sm">
          <div>好意度：{analysis.favorability}%</div>
          <div>距離感：{analysis.distanceLabel}</div>
        </div>
        {analysis.usedHistory ? (
          <p className="mt-1 text-xs text-gray-400">過去のやり取りをもとに分析しています</p>
        ) : null}
        <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-700">
            ⚠️ このまま進むと「都合のいい人」で終わる可能性があります
          </p>
          <p className="mt-2 text-sm text-gray-600">
            特に今のタイミングでのLINEは、関係性を大きく左右します。
          </p>
        </div>
        <div className="mt-2 space-y-3">
          <div>
            <p className="text-xs font-semibold text-zinc-600">■状況整理</p>
            <p className="mt-1">{analysis.line1}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-600">■今の最適行動</p>
            {locked ? (
              <div className="relative mt-1 rounded-lg bg-white/80 p-2">
                <p aria-hidden className="blur-[3px]">{analysis.line2}</p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                    判断を解放する（有料）
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1">{analysis.line2}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-600">■やってはいけないこと</p>
            <ul className="mt-1 space-y-1">
              {(analysis.ngList ?? []).map((item) => (
                <li key={item}>・{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-600">■分岐</p>
            <p className="mt-1">{analysis.line3}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-600">■LINE（補助）</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {patterns.map((pattern, idx) => (
                <button
                  key={`${pattern.type}-${idx}`}
                  type="button"
                  onClick={() => setActivePattern(idx)}
                  className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium ${
                    activePattern === idx
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  {pattern.type}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-end">
              <div className="max-w-xs rounded-2xl bg-green-500 px-4 py-2 text-white shadow">
                {locked ? (
                  <div className="relative">
                    <div aria-hidden className="line-clamp-2 blur-sm">
                      {selectedLine}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                        続きを見る（有料）
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>👉 {lineForDisplay}</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-600">■ポイント</p>
            <p className="mt-1">{analysis.point}</p>
          </div>
          <button
            type="button"
            onClick={copyLine}
            disabled={!isPaidUser}
            className={`inline-flex h-10 min-h-[40px] w-full items-center justify-center rounded-full px-4 text-sm font-medium ${
              isPaidUser
                ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
            }`}
          >
            コピー
          </button>
          <div className="text-center">
            <p className="mb-2 text-sm text-gray-600">この判断で関係の流れが決まります</p>
            <button className="rounded-full bg-red-500 px-6 py-3 text-lg font-bold text-white shadow">
              意思決定を今すぐ解放する
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="max-w-[96%] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800">
      <p className="text-xs font-semibold tracking-wide text-zinc-500">{analysis.title}</p>
      <div className="mb-2 mt-1 text-xs text-gray-400">
        四柱推命・九星気学・五行バランスを統合して算出
      </div>
      <div className="mb-4 rounded-xl bg-black p-4 text-white">
        <p className="text-xs opacity-70">統合占術による関係フェーズ</p>
        <p className="text-lg font-bold">{analysis.phaseLabel}</p>
      </div>
      <div className="mb-4 flex gap-3 text-sm">
        <div>好意度：{analysis.favorability}%</div>
        <div>距離感：{analysis.distanceLabel}</div>
      </div>
      {analysis.usedHistory ? (
        <p className="mt-1 text-xs text-gray-400">過去のやり取りをもとに分析しています</p>
      ) : null}
      <div className="mt-2 space-y-1.5">
        <p>{analysis.line1}</p>
        <p>{analysis.line2}</p>
        <p>{analysis.line3}</p>
        <p aria-hidden={locked || undefined} className={locked ? "select-none blur-[3px]" : ""}>
          {analysis.paidLine}
        </p>
      </div>
      {locked ? (
        <p className="mt-3 text-xs font-medium text-amber-800">
          具体的なLINE文は有料開放で表示されます。
        </p>
      ) : null}
    </article>
  );
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ChatMode>("loading");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [partner, setPartner] = useState<PersonProfile | null>(null);
  const [latestInput, setLatestInput] = useState<LatestInput | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPersonId, setCurrentPersonId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [sendCount, setSendCount] = useState(0);
  const [showDiagnosisNudge, setShowDiagnosisNudge] = useState(false);
  const [strategyMode, setStrategyMode] = useState<StrategyMode>("reply");
  const [liveEntries, setLiveEntries] = useState<LiveAnalysisEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quickLogType, setQuickLogType] = useState<QuickLogType>("line");
  const [quickLogContent, setQuickLogContent] = useState("");
  const [relationshipLogs, setRelationshipLogs] = useState<RelationshipLog[]>([]);
  const [quickAnalysis, setQuickAnalysis] = useState("");
  const [canSaveData, setCanSaveData] = useState(false);

  const isFullDemo = searchParams.get("full") === "1";
  const isFreeUser = !isFullDemo;

  useEffect(() => {
    void (async () => {
      const latestRaw =
        sessionStorage.getItem(LATEST_INPUT_KEY) ||
        (typeof window !== "undefined" ? window.localStorage.getItem(LATEST_INPUT_KEY) : null);
      let latest: LatestInput | null = null;
      if (latestRaw) {
        try {
          latest = JSON.parse(latestRaw) as LatestInput;
        } catch {
          latest = null;
        }
      }
      const auth = await isAuthenticated();
      setCanSaveData(auth);
      const loadedPeople = await loadPeopleByUser();
      setPeople(loadedPeople);
      setRelationshipLogs(await loadRelationshipLogsByUser());
      const initialPersonId = latest?.personId || loadedPeople[0]?.id || "";
      setCurrentPersonId(initialPersonId);
      setLatestInput(latest);

      const selectedPerson = loadedPeople.find((person) => person.id === initialPersonId) ?? null;
      const storedBirthdate = selectedPerson?.birthDate || latest?.partnerBirthDate;
      const storedBirthtime = selectedPerson?.birthTime || latest?.partnerBirthTime;
      const hasStoredPartner = Boolean(storedBirthdate);

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
        const partnerProfile = buildPartnerProfile(storedBirthdate!, storedBirthtime || "12:00");
        setPartner(partnerProfile);
        setResult(calculateCompatibility(selfProfile, partnerProfile));
        setMode("diagnosed");
        return;
      }

      setPartner(null);
      setResult(null);
      setMode("undiagnosed");
    })();
  }, [isFullDemo]);

  useEffect(() => {
    if (mode === "loading") return;
    if (isFullDemo) return;
    const selectedPerson = people.find((person) => person.id === currentPersonId) ?? null;
    if (!selectedPerson?.birthDate) return;
    const partnerProfile = buildPartnerProfile(
      selectedPerson.birthDate,
      selectedPerson.birthTime || "12:00"
    );
    setPartner(partnerProfile);
    setResult(calculateCompatibility(selfProfile, partnerProfile));
    setMode("diagnosed");
  }, [currentPersonId, people, mode, isFullDemo]);

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
  const currentPersonLogs = useMemo(
    () =>
      relationshipLogs
        .filter((log) => log.personId === currentPersonId)
        .sort((a, b) => b.timestamp - a.timestamp),
    [relationshipLogs, currentPersonId]
  );
  const phaseSummary = useMemo(
    () => detectRelationshipPhase(currentPersonLogs),
    [currentPersonLogs]
  );

  const summaryTags = useMemo(() => {
    if (!result) return [];
    return [
      `総合 ${result.totalScore}/100`,
      `タイプ ${result.relationshipType}`,
      `強み ${result.strengths[0] ?? "-"}`,
      `注意 ${result.cautions[0] ?? "-"}`,
    ];
  }, [result]);
  const lockActive = mode === "undiagnosed" && showDiagnosisNudge;
  const isPaidUser = !lockActive;
  const latestLineEntry = [...liveEntries]
    .reverse()
    .find((entry) => entry.analysis.kind === "line");
  const fixedCopyText = latestLineEntry?.analysis.linePatterns?.[0]?.text ?? latestLineEntry?.analysis.lineDraft ?? "";

  const handleQuickLogSave = () => {
    if (!canSaveData) return;
    const content = quickLogContent.trim();
    if (!content || !currentPersonId) return;
    const logType: RelationshipLog["type"] =
      quickLogType === "talk" ? "note" : quickLogType;
    const log: RelationshipLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      personId: currentPersonId,
      type: logType,
      content,
      timestamp: Date.now(),
    };
    const nextLogs = [log, ...relationshipLogs];
    setRelationshipLogs(nextLogs);
    void saveRelationshipLogsByUser(nextLogs);
    setQuickAnalysis(analyzeQuickLog(quickLogType, content));
    setQuickLogContent("");
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (text.length > 0) {
      setIsGenerating(true);
      const currentPerson = people.find((person) => person.id === currentPersonId) ?? null;
      const apiAnalysis = await buildStrategyAnalysisViaApi(strategyMode, text, {
        currentPerson,
        currentPersonId,
        latestInput,
        logs: relationshipLogs,
      });
      const analysis = apiAnalysis ?? buildStrategyAnalysis(strategyMode, text);
      setLiveEntries((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          mode: strategyMode,
          userText: text,
          analysis,
        },
      ]);
      setIsGenerating(false);
    }
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
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium tracking-wide text-zinc-500">恋愛伴走</span>
            <AuthAction />
          </div>
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
              <p className="mt-1 text-xs text-zinc-600">
                今の相談相手：
                {people.find((person) => person.id === currentPersonId)?.name || "未選択"}
                （
                {relationshipLabelMap[(latestInput?.relationshipType || "love") as Relationship["type"]]}
                ）
              </p>
              {people.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {people.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setCurrentPersonId(person.id)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] ${
                        currentPersonId === person.id
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white text-zinc-700"
                      }`}
                    >
                      {person.name || "未命名"}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 rounded-xl bg-black p-4 text-white">
                <div className="text-sm opacity-70">関係フェーズ</div>
                <div className="text-xl font-bold">{phaseSummary.phase}</div>
                <div className="mt-1 text-sm">{phaseSummary.reason}</div>
              </div>
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

      <section className="mx-auto max-w-2xl px-4 py-5 pb-28">
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

            {liveEntries.map((entry) => (
              <div key={entry.id} className="border-b border-zinc-100 pb-6 last:border-0 last:pb-0">
                <article className="ml-auto max-w-[92%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    あなた
                  </p>
                  <p className="leading-relaxed">{entry.userText}</p>
                </article>
                <div className="mt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Judge Code AI
                  </p>
                  <StrategyAnalysisCard analysis={entry.analysis} locked={lockActive} isPaidUser={isPaidUser} />
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
            <div className="mb-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                関係ログクイック入力
              </p>
              {!canSaveData ? (
                <p className="text-xs text-amber-700">この内容を保存するにはログインしてください。</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(quickLogLabels) as QuickLogType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setQuickLogType(type)}
                    className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium ${
                      quickLogType === type
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-300 bg-white text-zinc-700"
                    }`}
                  >
                    + {quickLogLabels[type]}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={quickLogContent}
                onChange={(e) => setQuickLogContent(e.target.value)}
                placeholder="何があった？（一言でOK）"
                className="min-h-[64px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
              />
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setQuickLogType(item.type);
                      setQuickLogContent(item.content);
                    }}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] text-zinc-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleQuickLogSave}
                  disabled={!canSaveData || !quickLogContent.trim() || !currentPersonId}
                  className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold ${
                    canSaveData && quickLogContent.trim() && currentPersonId
                      ? "bg-zinc-900 text-white"
                      : "cursor-not-allowed bg-zinc-300 text-zinc-600"
                  }`}
                >
                  ログを保存
                </button>
              </div>
              {quickAnalysis ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {quickAnalysis}
                </div>
              ) : null}
              <div className="space-y-1">
                {currentPersonLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="text-xs text-zinc-700">
                    {log.type}：{log.content}
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { key: "reply", label: "返信分析" },
                { key: "position", label: "ポジション分析" },
                { key: "future", label: "未来分岐" },
                { key: "line", label: "LINE生成" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStrategyMode(item.key as StrategyMode)}
                  className={`inline-flex h-9 min-h-[36px] items-center rounded-full px-3 text-xs font-medium ${
                    strategyMode === item.key
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
                disabled={isGenerating}
                className={`inline-flex h-11 min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-medium text-white ${
                  isGenerating ? "cursor-not-allowed bg-zinc-400" : "bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                {isGenerating ? "分析中..." : "送信（準備中）"}
              </button>
            </div>
          </div>
        </div>
      </section>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-3">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            disabled={!isPaidUser || !fixedCopyText}
            onClick={async () => {
              if (!isPaidUser || !fixedCopyText) return;
              await navigator.clipboard.writeText(fixedCopyText);
              console.log("[line-copy] fixed copied");
            }}
            className={`w-full rounded-lg py-3 text-lg font-bold ${
              isPaidUser && fixedCopyText
                ? "bg-green-600 text-white"
                : "cursor-not-allowed bg-zinc-200 text-zinc-500"
            }`}
          >
            LINEにコピーして使う
          </button>
        </div>
      </div>
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
