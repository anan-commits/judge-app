export type LogItem = {
  id: string;
  date: string;
  type: "LINE" | "デート" | "気づき";
  content: string;
};

export function formatHistory(logs: LogItem[]): string {
  if (!logs.length) return "（ログなし）";
  return logs
    .slice(-10)
    .map((log) => `【${log.type}｜${log.date}】${log.content}`)
    .join("\n");
}

export function buildPrompt(userInput: string, logs: LogItem[]): string {
  const history = formatHistory(logs);
  return `
あなたは占術判断を実務提案に変換する恋愛戦略AIです。

必ず過去ログを根拠にして回答してください。
ログと矛盾する推測は禁止です。

【過去の関係ログ】
${history}

【今回の相談】
${userInput}

【出力ルール】
- 占術は「説明」ではなく「判断材料」として使う
- 長い占術解説は禁止（用語説明はしない）
- 一般論禁止。今回のログと相談文に接続する
- 「だから今こう動くべき」に必ず着地させる
- 送らない方が良いなら、その判断を明示する
- LINE3パターンは必ず文体を変える（似た文面を禁止）
- 相手が慎重型なら短文・軽め・余白重視
- 温度差が大きい場合は関係維持優先
- 各見出しは2〜3文以内で簡潔に
- 占術語として「相性の傾向」「運気の流れ」「五行バランス」のいずれかを自然に使う

【重要】
必ずこの順番で出力：

■占術から見た傾向
（あなたの傾向 / 相手の傾向 / 温度差・関係の特徴を1つの短文にまとめる）
■関係フェーズ
（接近フェーズ / 様子見フェーズ / 距離注意フェーズ のいずれか1つ）
■NG行動
（2〜3項目、箇条書き）
■次の一手
（今やることを1つだけ）
■今送るならこのLINE
軽め：
「...」
標準：
「...」
少し主導：
「...」

見出し名は完全一致で出力すること。
`.trim();
}

export function buildLinePrompt(userInput: string, logs: LogItem[]): string {
  const history = formatHistory(logs);
  return `
ユーザーの恋愛ログをもとに、占術を判断材料として最適なLINEを生成してください。

【ログ】
${history}

【状況】
${userInput}

【条件】
- 占術の長い解説は禁止
- 占術根拠は短く1文で十分
- 相手の温度感に合わせる
- 重すぎない
- 1通で関係が前進する内容
- 3パターン出す（軽め / 標準 / 少し主導）
- 3パターンは文体を変える

【出力形式（厳守）】
■占術から見た傾向
...

■関係フェーズ
...

■NG行動
・...
・...

■次の一手
...

■今送るならこのLINE
軽め：
「...」

標準：
「...」

少し主導：
「...」

理由：
...（1〜2文）
`.trim();
}
