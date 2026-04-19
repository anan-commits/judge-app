const profileItems = [
  { label: "生年月日", value: "1992年 11月 08日" },
  { label: "出生時間", value: "08:24" },
  { label: "日柱天干", value: "甲" },
  { label: "五行", value: "木" },
  { label: "九星気学", value: "三碧木星" },
  { label: "個性学", value: "調和型" },
  { label: "吉方位", value: "東南" },
] as const;

function PersonSilhouette() {
  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-zinc-100 to-zinc-50 ring-1 ring-zinc-200">
      <svg
        viewBox="0 0 120 120"
        className="h-20 w-20 text-zinc-400"
        aria-hidden="true"
        fill="none"
      >
        <circle cx="60" cy="36" r="18" fill="currentColor" opacity="0.9" />
        <path
          d="M28 96c3-18 16-28 32-28s29 10 32 28"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function DiagnosisPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-[#f7f7f5]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
          <a href="/" className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-[0.2em] text-zinc-900">JUDGE</span>
            <span className="text-sm font-medium tracking-wide text-zinc-500">CODE</span>
          </a>
          <span className="hidden text-xs font-medium tracking-wide text-zinc-500 sm:inline">
            人間関係診断
          </span>
        </div>
      </header>

      <section className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-18">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Relationship diagnosis
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
            自分と相手の相性を、統合占術で整理する
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 md:text-base">
            左側にあなたの基礎プロフィール、右側に相手の情報を入力して診断を開始します。
            まずは最小限の入力で比較できる構成です。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-5">
                <PersonSilhouette />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                    あなた
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    現在は確認用のダミーデータを表示しています。
                  </p>
                </div>
              </div>
              <span className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-zinc-50 px-4 text-xs font-medium text-zinc-500">
                判定基礎データ
              </span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {profileItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-zinc-200/90 bg-[#fcfcfb] px-4 py-4"
                >
                  <p className="text-xs font-medium tracking-wide text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-base font-semibold tracking-tight text-zinc-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-zinc-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Input
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                相手を入力
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                相手の基本情報を入力すると、関係性の見立てに必要な比較データを生成します。
              </p>
            </div>

            <form className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="partner-birthdate"
                  className="text-sm font-medium tracking-wide text-zinc-700"
                >
                  生年月日
                </label>
                <input
                  id="partner-birthdate"
                  name="partner-birthdate"
                  type="date"
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="partner-birthtime"
                  className="text-sm font-medium tracking-wide text-zinc-700"
                >
                  出生時間
                </label>
                <input
                  id="partner-birthtime"
                  name="partner-birthtime"
                  type="time"
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold tracking-wide text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              >
                診断する
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                Note
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                入力導線はスマートフォンでも読みやすいよう、余白と文字サイズをやや大きめに設定しています。
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
