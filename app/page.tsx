const modalities = [
  {
    title: "五行",
    subtitle: "Element balance",
    description:
      "思考の偏りと資質のバランスを整理し、判断の前提となる「土台」を可視化します。",
  },
  {
    title: "四柱推命",
    subtitle: "Four pillars",
    description:
      "時間の流れに沿った構造から、本質的な強みとリスクの輪郭を捉えます。",
  },
  {
    title: "九星気学",
    subtitle: "Nine-star ki",
    description:
      "周期と環境要因を踏まえ、今の局面で効きやすい要因を補助的に示します。",
  },
  {
    title: "個性学",
    subtitle: "Personality mapping",
    description:
      "行動特性と対人スタイルを言語化し、意思決定プロセスへの摩擦を減らします。",
  },
  {
    title: "吉方位",
    subtitle: "Spatial orientation",
    description:
      "移動・配置・優先順位の設計に活かせる、現実的な行動のヒントを提示します。",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-[#f7f7f5]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-[0.2em] text-zinc-900">
              JUDGE
            </span>
            <span className="text-sm font-medium tracking-wide text-zinc-500">CODE</span>
          </div>
          <span className="hidden text-xs font-medium tracking-wide text-zinc-500 sm:inline">
            統合占術AI
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(24,24,27,0.06),_transparent_55%)]"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
          <p className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
            <span className="h-px w-8 bg-zinc-300" />
            Integrated divination AI
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.12] tracking-tight text-zinc-950 md:text-5xl lg:text-[3.25rem]">
            なぜあなたの判断は
            <br />
            ズレるのか？
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-600 md:text-xl">
            複数の占術を統合することで、意思決定の精度を高める
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <a
              href="#start"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-sm font-medium tracking-wide text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              無料診断を始める
            </a>
            <p className="text-xs leading-relaxed text-zinc-500">
              入力は最小限。結果は根拠付きで要点を整理します。
            </p>
          </div>
        </div>
      </section>

      <section
        id="start"
        className="scroll-mt-16 border-b border-zinc-200/80 bg-[#f4f4f1] py-12 md:py-14"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="flex flex-col gap-6 rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Free diagnosis
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-950 md:text-xl">
                統合レポートの生成を開始
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
                生年月日などの基本情報から、五つのモジュールを横断して要点をまとめます。
              </p>
            </div>
            <a
              href="#services"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              モジュール一覧を見る
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-16 border-b border-zinc-200/80 bg-[#f7f7f5]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Methodology
            </h2>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
              五つの観点を、ひとつの判断軸へ
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 md:text-base">
              各モジュールは独立した補助情報として設計し、過剰な象徴表現を避けています。
              ビジネス文脈でも扱いやすい粒度で、統合レポートに要約されます。
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modalities.map((m) => (
              <article
                key={m.title}
                className="group flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold tracking-tight text-zinc-950">{m.title}</h3>
                  <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    {m.subtitle}
                  </span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-600">{m.description}</p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent" />
                <p className="mt-4 text-xs font-medium text-zinc-400">統合出力に反映</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-zinc-950 py-20 text-white md:py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                Judge Code
              </p>
              <h2 className="mt-3 max-w-xl text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                判断のズレを減らす、統合アプローチ
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
                まずは無料診断で全体像を把握。必要に応じて深掘りへ進めます。
              </p>
            </div>
            <a
              href="#start"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-10 text-sm font-semibold tracking-wide text-zinc-950 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:w-auto"
            >
              今すぐ無料診断
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200/80 bg-[#f7f7f5] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between md:px-10">
          <span>© {new Date().getFullYear()} Judge Code</span>
          <span className="text-zinc-400">本サービスは意思決定の補助情報を提供します。</span>
        </div>
      </footer>
    </main>
  );
}
