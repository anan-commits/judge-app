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
ユーザーの恋愛履歴を踏まえて、実用的で一貫性のあるアドバイスをしてください。

【過去の関係ログ】
${history}

【今回の相談】
${userInput}

【出力ルール】
- 抽象論は禁止
- 必ず「次に取るべき行動」を提示
- 必要ならLINE文面を提案
- リスク（NG行動）も明確にする

【出力形式（厳守）】
現在の関係ステータス:
次に取るべき行動:
NG行動:
補足:
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
