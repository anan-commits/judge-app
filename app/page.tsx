export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#1f1f1f]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full bg-[#efe7d6] px-4 py-1 text-sm font-medium text-[#8b6b2e]">
              五行 × 四柱推命 × 九星気学 × 個性学 × 吉方位
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
              なぜあなたの判断は
              <br />
              ズレるのか？
            </h1>

            <p className="mb-4 text-lg leading-8 text-gray-700">
              原因は「1つの占いだけ」で見ているからです。
            </p>

            <p className="mb-8 text-xl font-semibold leading-8 text-[#8b6b2e]">
              5つの占術を統合すると、
              <br />
              答えはズレなくなります。
            </p>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="mb-3 text-sm text-gray-500">生年月日を入力してください</p>
              <div className="grid grid-cols-3 gap-3">
                <select className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                  <option>1993</option>
                </select>
                <select className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                  <option>4</option>
                </select>
                <select className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                  <option>10</option>
                </select>
              </div>
              <button className="mt-4 w-full rounded-xl bg-[#b2873b] px-4 py-3 font-semibold text-white hover:opacity-90">
                無料で診断する
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-500">統合占術AIの考え方</p>
              <h2 className="mt-2 text-2xl font-bold">複数の占術を1つの答えに統合</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-[#f8f5ee] p-4">
                <div className="mb-1 font-semibold">五行</div>
                <div className="text-sm text-gray-600">思考バランスと強み・弱みの土台</div>
              </div>
              <div className="rounded-2xl bg-[#f8f5ee] p-4">
                <div className="mb-1 font-semibold">四柱推命</div>
                <div className="text-sm text-gray-600">生まれ持った本質と人生のベース</div>
              </div>
              <div className="rounded-2xl bg-[#f8f5ee] p-4">
                <div className="mb-1 font-semibold">九星気学</div>
                <div className="text-sm text-gray-600">今の運気とタイミングの流れ</div>
              </div>
              <div className="rounded-2xl bg-[#f8f5ee] p-4">
                <div className="mb-1 font-semibold">個性学</div>
                <div className="text-sm text-gray-600">行動パターンと対人傾向の補正</div>
              </div>
              <div className="rounded-2xl bg-[#f8f5ee] p-4">
                <div className="mb-1 font-semibold">吉方位</div>
                <div className="text-sm text-gray-600">現実でどう動くべきかの行動指針</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
          <h3 className="mb-8 text-center text-3xl font-bold">単体占いと統合占術の違い</h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
              <p className="mb-4 text-sm font-semibold text-red-500">単体占い</p>
              <ul className="space-y-3 text-gray-700">
                <li>・見える角度が1つだけ</li>
                <li>・当たる時とズレる時がある</li>
                <li>・解釈が曖昧になりやすい</li>
                <li>・行動まで落とし込みにくい</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#e8dcc4] bg-[#f8f5ee] p-6">
              <p className="mb-4 text-sm font-semibold text-[#8b6b2e]">統合占術AI</p>
              <ul className="space-y-3 text-gray-700">
                <li>・5つの占術で多角的に分析</li>
                <li>・判断のズレを減らせる</li>
                <li>・なぜそうなるか根拠が分かる</li>
                <li>・具体的な行動に落とし込める</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <h3 className="mb-10 text-center text-3xl font-bold">5つの占術の役割</h3>

        <div className="grid gap-4 md:grid-cols-5">
          {[
            ["五行", "思考の癖"],
            ["四柱推命", "本質"],
            ["九星気学", "運気"],
            ["個性学", "行動特性"],
            ["吉方位", "行動最適化"],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5"
            >
              <div className="mb-3 text-lg font-bold text-[#8b6b2e]">{title}</div>
              <div className="text-sm text-gray-600">{desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
            <div className="text-sm text-gray-500">累計診断数</div>
            <div className="mt-2 text-4xl font-bold">120,000件</div>
          </div>
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
            <div className="text-sm text-gray-500">満足度</div>
            <div className="mt-2 text-4xl font-bold">92%</div>
          </div>
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
            <div className="text-sm text-gray-500">ユーザーの声</div>
            <div className="mt-2 text-base text-gray-700">「理由が分かってスッキリした」</div>
          </div>
        </div>
      </section>
    </main>
  );
}
