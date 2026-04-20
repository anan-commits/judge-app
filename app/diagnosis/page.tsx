"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFortuneProfile } from "../../lib/fortune/getFortuneProfile";
import { normalizeBirthDate } from "../../lib/fortune/normalizeBirthDate";

export default function DiagnosisPage() {
  const router = useRouter();
  const [selfBirthdate, setSelfBirthdate] = useState("");
  const [selfBirthtime, setSelfBirthtime] = useState("");
  const [partnerBirthdate, setPartnerBirthdate] = useState("");
  const [partnerBirthtime, setPartnerBirthtime] = useState("");
  const [didCompleteStep1, setDidCompleteStep1] = useState(false);
  const [showPartnerStep, setShowPartnerStep] = useState(false);
  const user = {
    birthDate: selfBirthdate || "1992-11-08",
    birthTime: selfBirthtime || undefined,
  };
  const partner = {
    birthDate: partnerBirthdate || "1995-03-21",
    birthTime: partnerBirthtime || undefined,
  };
  const myBirthDate = user.birthDate;
  const myBirthTime = user.birthTime;
  const partnerBirthDate = partner.birthDate;
  const partnerBirthTime = partner.birthTime;
  const normalizedMyBirthDate = normalizeBirthDate(myBirthDate);
  const normalizedPartnerBirthDate = normalizeBirthDate(partnerBirthDate);

  const myProfile = getFortuneProfile({
    birthDate: user.birthDate,
    birthTime: user.birthTime,
  });
  const partnerProfile = getFortuneProfile({
    birthDate: partner.birthDate,
    birthTime: partner.birthTime,
  });

  console.log("birthDate raw", myBirthDate);
  console.log("birthDate normalized", normalizedMyBirthDate);
  console.log("profile", myProfile);
  console.log("birthDate raw", partnerBirthDate);
  console.log("birthDate normalized", normalizedPartnerBirthDate);
  console.log("profile", partnerProfile);
  const tendencyComment = `日柱天干「${myProfile.dayStem}」と五行「${myProfile.gogyo}」の傾向から、${myProfile.koseigaku}として関係を作るタイプです。`;

  const scrollToPartnerInput = () => {
    setShowPartnerStep(true);
    setTimeout(() => {
      const target = document.getElementById("partner-section");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleStep1Submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selfBirthdate) return;
    sessionStorage.setItem("judge-code:self-birthdate", selfBirthdate);
    sessionStorage.setItem("judge-code:self-birthtime", selfBirthtime);
    setDidCompleteStep1(true);
  };

  const handleFinalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partnerBirthdate) return;

    const selfBirthDate = selfBirthdate || "1992-11-08";
    const selfBirthTime = selfBirthtime || undefined;
    const partnerBirthTime = partnerBirthtime || undefined;

    try {
      const res = await fetch("/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          self: {
            birthDate: selfBirthDate,
            birthTime: selfBirthTime,
          },
          partner: {
            birthDate: partnerBirthdate,
            birthTime: partnerBirthTime,
          },
        }),
      });

      if (!res.ok) throw new Error("diagnosis api failed");
      const diagnosis = await res.json();
      sessionStorage.setItem("judge-code:latest-diagnosis", JSON.stringify(diagnosis));
    } catch {
      // API失敗時も既存導線を止めない
      sessionStorage.removeItem("judge-code:latest-diagnosis");
    }

    // 既存互換: /result で参照するキーは維持
    sessionStorage.setItem("judge-code:self-birthdate", selfBirthDate);
    sessionStorage.setItem("judge-code:self-birthtime", selfBirthtime || "");
    sessionStorage.setItem("judge-code:partner-birthdate", partnerBirthdate);
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

        {didCompleteStep1 ? (
          <article className="mt-5 rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              STEP2
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950">
              あなたは「{myProfile.koseigaku}」です
            </h3>
            <div className="mt-2 text-xs text-gray-500">
              陰陽五行：{myProfile.dayStem}（{myProfile.gogyo}）｜{myProfile.kyusei}｜{myProfile.koseigaku}
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium text-zinc-600">あなたの傾向</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{tendencyComment}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-700">
              人との関係は相性だけでは決まりません。運気・タイミング・行動で結果は大きく変わります。
            </p>
            {!showPartnerStep ? (
              <button
                type="button"
                onClick={scrollToPartnerInput}
                className="mt-4 inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                相手との関係を見る
              </button>
            ) : null}
          </article>
        ) : null}

        {didCompleteStep1 && showPartnerStep ? (
          <article id="partner-section" className="mt-5 rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              STEP3
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950">相手の情報を入力</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              生年月日だけでも進めます。出生時間は任意です。
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h4 className="text-base font-bold text-zinc-900">あなた</h4>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <div>陰陽五行: {myProfile.dayStem}（{myProfile.gogyo}）</div>
                  <div>九星気学: {myProfile.kyusei}</div>
                  <div>個性学: {myProfile.koseigaku}</div>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h4 className="text-base font-bold text-zinc-900">お相手</h4>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <div>陰陽五行: {partnerProfile.dayStem}（{partnerProfile.gogyo}）</div>
                  <div>九星気学: {partnerProfile.kyusei}</div>
                  <div>個性学: {partnerProfile.koseigaku}</div>
                </div>
              </div>
            </div>

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
