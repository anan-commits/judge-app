export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <a href="/" className="text-sm font-semibold tracking-[0.2em] text-zinc-900">
            JUDGE CODE
          </a>
          <span className="text-xs text-zinc-500">Judge Codeとは</span>
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Judge Codeとは</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">
          Judge Codeは、五行・九星気学・個性学など複数の占術視点を組み合わせ、
          恋愛コミュニケーションの判断を継続支援する相談サービスです。
          単発の診断で終わらせず、履歴と文脈を使って次の行動に落とし込むことを目的としています。
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          ホームへ戻る
        </a>
      </section>
    </main>
  );
}
