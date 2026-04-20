import { NextResponse } from "next/server";
import { buildLinePrompt, buildPrompt, type LogItem } from "../../../lib/buildPrompt";

type ChatMode = "reply" | "position" | "future" | "line";

type ChatRequestBody = {
  userInput?: string;
  mode?: ChatMode;
  logs?: LogItem[];
};

function parseLineOutput(content: string) {
  const lightMatch = content.match(/軽め：\s*「?([\s\S]*?)」?(?:\n|$)/);
  const leadMatch = content.match(/主導：\s*「?([\s\S]*?)」?(?:\n|$)/);
  const reasonMatch = content.match(/理由：\s*([\s\S]*)$/);

  const light = lightMatch?.[1]?.trim() || "今日はありがとう。落ち着いたらまた話せると嬉しい。";
  const lead = leadMatch?.[1]?.trim() || "今週どこかで少し話せる？タイミング合わせたい。";
  const reason = reasonMatch?.[1]?.trim() || "相手の温度を下げず、前進しやすい短文です。";

  return { light, lead, reason };
}

function parseGenericOutput(content: string) {
  const statusMatch = content.match(/■結論\s*([\s\S]*?)(?:\n■理由|$)/);
  const reasonMatch = content.match(/■理由\s*([\s\S]*?)(?:\n■NG行動|$)/);
  const ngMatch = content.match(/■NG行動\s*([\s\S]*?)(?:\n■次の一手|$)/);
  const actionMatch = content.match(/■次の一手\s*([\s\S]*?)(?:\n■LINE|$)/);
  const lineMatch = content.match(/■LINE\s*([\s\S]*)$/);

  return {
    status: statusMatch?.[1]?.trim() || "慎重フェーズ。温度差の調整が必要です。",
    action: actionMatch?.[1]?.trim() || "次の1通は要点1つに絞って送る。",
    ng: ngMatch?.[1]?.trim() || "感情の連投、返信催促、結論の強要。",
    note:
      reasonMatch?.[1]?.trim() ||
      lineMatch?.[1]?.trim() ||
      "短文で相手の返しやすさを優先してください。",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const userInput = (body.userInput || "").trim();
    const mode: ChatMode = body.mode || "reply";
    const logs = Array.isArray(body.logs) ? body.logs : [];

    if (!userInput) {
      return NextResponse.json({ error: "userInput is required" }, { status: 400 });
    }

    const prompt = mode === "line" ? buildLinePrompt(userInput, logs) : buildPrompt(userInput, logs);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          usedHistory: logs.length > 0,
          fallback: true,
          mode,
          message: "OPENAI_API_KEY が未設定のため、フォールバック回答を返します。",
          generic: {
            status: "慎重フェーズ。関係は維持されています。",
            action: "次の1通は短く、返信の余白を残す。",
            ng: "感情の連投、返答催促、詰問。",
            note: "ログを重ねるほど精度が上がります。",
          },
          line: {
            light: "今日はありがとう。落ち着いたらまた話せると嬉しい。",
            lead: "今週どこかで少し話せる？タイミング合わせたい。",
            reason: "相手が返しやすい温度で、次の接点を作る文面です。",
          },
        },
        { status: 200 }
      );
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return NextResponse.json({ error: "OpenAI request failed", detail: err }, { status: 502 });
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    const generic = parseGenericOutput(content);
    const line = parseLineOutput(content);

    return NextResponse.json({
      usedHistory: logs.length > 0,
      mode,
      content,
      generic,
      line,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
