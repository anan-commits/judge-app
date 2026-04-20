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
あなたは恋愛コンサルタントです。

必ず過去ログを根拠にして回答してください。
ログと矛盾する推測は禁止です。

【過去の関係ログ】
${history}

【今回の相談】
${userInput}

【出力ルール】
- 抽象論は禁止
- 必ず「なぜそう判断したか」をログベースで説明
- 必ず「次に取るべき行動」を提示
- NG行動を明確にする
- 必要ならLINE文面を出す

【重要】
回答の中で以下の形式を必ず含める：

■ログからの判断
（どの発言・行動からどう判断したか）

■結論
（今の関係性）

■次の一手
（具体的行動 or LINE）
`.trim();
}

export function buildLinePrompt(userInput: string, logs: LogItem[]): string {
  const history = formatHistory(logs);
  return `
ユーザーの恋愛ログをもとに、最適なLINEを生成してください。

【ログ】
${history}

【状況】
${userInput}

【条件】
- 相手の温度感に合わせる
- 重すぎない
- 1通で関係が前進する内容
- 2パターン出す（軽め / 主導）

【出力形式（厳守）】
軽め：
「...」

主導：
「...」

理由：
...（1〜2文）
`.trim();
}
