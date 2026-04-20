 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFortuneProfile } from "../lib/fortune/getFortuneProfile";

const LATEST_INPUT_KEY = "judge_latest_input";

type LatestInput = {
  myBirthDate: string;
  myBirthTime?: string;
  partnerBirthDate: string;
  partnerBirthTime?: string;
};

export default function Home() {
  const [latestInput, setLatestInput] = useState<LatestInput | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LATEST_INPUT_KEY);
      if (!raw) {
        setLatestInput(null);
        return;
      }
      const parsed = JSON.parse(raw) as LatestInput;
      if (!parsed.myBirthDate || !parsed.partnerBirthDate) {
        setLatestInput(null);
        return;
      }
      setLatestInput(parsed);
    } catch (error) {
      console.error("[top] failed to parse latest input", error);
      setLatestInput(null);
    }
  }, []);

  const myBirthDate = latestInput?.myBirthDate;
  const myBirthTime = latestInput?.myBirthTime || "";
  const partnerBirthDate = latestInput?.partnerBirthDate;
  const partnerBirthTime = latestInput?.partnerBirthTime || "";

  const myProfile = getFortuneProfile({
    birthDate: myBirthDate,
    birthTime: myBirthTime || undefined,
  });
  const partnerProfile = getFortuneProfile({
    birthDate: partnerBirthDate,
    birthTime: partnerBirthTime || undefined,
  });

  const statuses = [
    {
      label: "自分",
      birthdate: myBirthDate || "未入力",
      birthtime: myBirthTime || "未入力",
      kanshi: myProfile?.kanshi,
      yinYangGogyo: myProfile?.yinYangGogyo,
      nineStar: myProfile ? `${myProfile.honmei}（本命）｜${myProfile.getsumei}（月命）` : null,
      personality: myProfile?.koseigaku,
      luckyDirection: null,
    },
    {
      label: "相手",
      birthdate: partnerBirthDate || "未入力",
      birthtime: partnerBirthTime || "未入力",
      kanshi: partnerProfile?.kanshi,
      yinYangGogyo: partnerProfile?.yinYangGogyo,
      nineStar: partnerProfile
        ? `${partnerProfile.honmei}（本命）｜${partnerProfile.getsumei}（月命）`
        : null,
      personality: partnerProfile?.koseigaku,
      luckyDirection: null,
    },
  ] as const;

  const history = [
    {
      date: "2026-04-19",
      title: "返信テンポが落ちた不安",
      user: "今日の出来事: 返信が3時間後だった。相手の発言:『今日はバタバタしてる』",
      ai: "今日は追い打ちせず短文で労う方針が有効。温度確認は明日に回すのが安全です。",
    },
    {
      date: "2026-04-18",
      title: "次の約束の切り出し方",
      user: "送りたいLINE:『今週どこか会える？』だと重いですか？",
      ai: "候補を2つに絞った提案が良いです。『木曜夜か土曜昼、どちらが楽？』が無難です。",
    },
    {
      date: "2026-04-19",
      title: "既読スルー時の対応",
      user: "相手の発言: 昨日は返信なし。今日の出来事: SNSは更新あり。",
      ai: "感情的な確認より、生活文脈に寄せた一通を推奨。結論を迫らない文面が適切です。",
    },
  ] as const;

  const basicCompatibility = {
    score: 78,
    relationshipType: "調整安定型",
    summary: "土台は良好。連絡テンポの差を調整すると関係がさらに安定しやすい状態です。",
    strengths: ["価値観の方向性が近く、長期目線の話が噛み合いやすい"],
    cautions: ["忙しい時期に反応が簡潔化し、温度差として誤解されやすい"],
  } as const;

  const currentStance = "今は会話量を増やすべき";

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold tracking-[0.2em] text-zinc-900">JUDGE CODE</span>
            <a href="/about" className="text-xs text-zinc-500 underline-offset-2 hover:underline">
              Judge Codeとは
            </a>
            <Link href="/log" className="text-xs text-blue-600 underline-offset-2 hover:underline">
              関係ログを見る
            </Link>
          </div>
          <a href="/chat" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
            相談ルームへ
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-10 md:py-8">
        <div className="grid gap-5 md:grid-cols-2">
          {statuses.map((person) => (
            <article
              key={person.label}
              className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{person.label}</p>
              <div className="mt-3 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100">
                  <svg viewBox="0 0 120 120" className="h-16 w-16 text-zinc-400" aria-hidden>
                    <circle cx="60" cy="36" r="18" fill="currentColor" />
                    <path
                      d="M28 96c3-18 16-28 32-28s29 10 32 28"
                      stroke="currentColor"
                      strokeWidth="14"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-zinc-700">
                <p>生年月日: {person.birthdate}</p>
                <p>出生時間: {person.birthtime}</p>
                {person.kanshi ? <p>日柱天干: {person.kanshi}</p> : null}
                {person.yinYangGogyo ? <p>五行: {person.yinYangGogyo}</p> : null}
                {person.nineStar ? <p>九星気学: {person.nineStar}</p> : null}
                {person.personality ? <p>個性学: {person.personality}</p> : null}
                {person.luckyDirection ? <p>吉方位: {person.luckyDirection}</p> : null}
              </div>
            </article>
          ))}
        </div>

        <section className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">基本相性</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-600">総合相性スコア</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{basicCompatibility.score} / 100</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-600">関係性タイプ</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {basicCompatibility.relationshipType}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">一言総評</p>
            <p className="mt-1 text-sm text-zinc-700">{basicCompatibility.summary}</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">強み</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {basicCompatibility.strengths.map((item) => (
                  <li key={item}>・{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">注意点</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {basicCompatibility.cautions.map((item) => (
                  <li key={item}>・{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">現在の推奨スタンス</p>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-base font-semibold text-zinc-900">{currentStance}</p>
            <p className="mt-1 text-sm text-zinc-700">
              返信テンポを合わせることを優先し、結論より対話回数を増やす運用が適しています。
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-zinc-600">今は押すべき</span>
            <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-zinc-600">今は一旦引くべき</span>
            <span className="rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1 text-white">
              今は会話量を増やすべき
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">チャット相談履歴</p>
            <a href="/chat" className="text-xs text-zinc-600 underline-offset-2 hover:underline">
              続きから相談する
            </a>
          </div>
          <div className="mt-4 space-y-4">
            {history.map((item) => (
              <article key={`${item.date}-${item.title}`} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  <span className="text-xs text-zinc-500">{item.date}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-700">
                  <span className="font-medium text-zinc-900">相談内容:</span> {item.user}
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  <span className="font-medium text-zinc-900">AI回答:</span> {item.ai}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">相談入力欄</p>
          <p className="mt-2 text-sm text-zinc-700">
            「今日の出来事」「相手の発言」「送りたいLINE」をそのまま入力してください。
          </p>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
            <div className="flex items-end gap-2">
              <textarea
                rows={3}
                placeholder="例）今日の出来事: / 相手の発言: / 送りたいLINE:"
                className="min-h-16 flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
              <button
                type="button"
                className="inline-flex h-12 min-w-24 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                相談する
              </button>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">入力はこのデバイスで安全に保持されます（MVP）。</div>
          </div>
        </section>
      </section>
    </main>
  );
}
