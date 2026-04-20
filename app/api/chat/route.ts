import { NextResponse } from "next/server";
import { buildLinePrompt, buildPrompt, type LogItem } from "../../../lib/buildPrompt";

type ChatMode = "reply" | "position" | "future" | "line";

type ChatRequestBody = {
  userInput?: string;
  mode?: ChatMode;
  logs?: LogItem[];
  context?: {
    person?: {
      id?: string;
      name?: string;
      birthDate?: string;
      birthTime?: string;
      memo?: string;
    } | null;
    latestInput?: {
      myBirthDate?: string;
      myBirthTime?: string;
      partnerBirthDate?: string;
      partnerBirthTime?: string;
      personId?: string;
      relationshipType?: string;
    } | null;
  };
};

function parseLineOutput(content: string) {
  const sectionMatch = content.match(/■(?:LINE（補助）|今送るならこのLINE)\s*([\s\S]*?)$/);
  const lineBlock = sectionMatch?.[1] ?? content;
  const lightMatch = lineBlock.match(/軽め：\s*「?([\s\S]*?)」?(?:\n|$)/);
  const standardMatch = lineBlock.match(/標準：\s*「?([\s\S]*?)」?(?:\n|$)/);
  const leadMatch = lineBlock.match(/(?:少し)?主導：\s*「?([\s\S]*?)」?(?:\n|$)/);
  const reasonMatch = content.match(/理由：\s*([\s\S]*)$/);

  const light = lightMatch?.[1]?.trim() || "今日はありがとう。落ち着いたらまた話せると嬉しい。";
  const standard =
    standardMatch?.[1]?.trim() || "今日はありがとう。今週どこかで少し話せると嬉しい。";
  const lead = leadMatch?.[1]?.trim() || "今週どこかで少し話せる？タイミング合わせたい。";
  const reason = reasonMatch?.[1]?.trim() || "相手の温度を下げず、前進しやすい短文です。";

  return { light, standard, lead, reason };
}

function parseGenericOutput(content: string) {
  const overviewMatch = content.match(/■状況整理\s*([\s\S]*?)(?:\n■関係フェーズ|$)/);
  const phaseMatch = content.match(/■関係フェーズ\s*([\s\S]*?)(?:\n■(?:NG行動|今の最適行動)|$)/);
  const actionMatch = content.match(/■今の最適行動\s*([\s\S]*?)(?:\n■理由|$)/);
  const reasonMatch = content.match(/■理由\s*([\s\S]*?)(?:\n■分岐|$)/);
  const branchMatch = content.match(/■分岐\s*([\s\S]*?)(?:\n■(?:LINE（補助）|今送るならこのLINE)|$)/);
  const lineMatch = content.match(/■(?:LINE（補助）|今送るならこのLINE)\s*([\s\S]*)$/);
  const ngMatch = content.match(/■NG行動\s*([\s\S]*?)(?:\n■今の最適行動|$)/);

  return {
    status: phaseMatch?.[1]?.trim() || "様子見フェーズ",
    action: actionMatch?.[1]?.trim() || "次の1通は要点1つに絞って送る。",
    ng: ngMatch?.[1]?.trim() || "感情の連投、返信催促、結論の強要。",
    note:
      overviewMatch?.[1]?.trim() ||
      reasonMatch?.[1]?.trim() ||
      branchMatch?.[1]?.trim() ||
      lineMatch?.[1]?.trim() ||
      "短文で相手の返しやすさを優先してください。",
    overview: overviewMatch?.[1]?.trim() || "",
    reason: reasonMatch?.[1]?.trim() || "",
    branch: branchMatch?.[1]?.trim() || "",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const userInput = (body.userInput || "").trim();
    const mode: ChatMode = body.mode || "reply";
    const logs = Array.isArray(body.logs) ? body.logs : [];
    const context = body.context;

    if (!userInput) {
      return NextResponse.json({ error: "userInput is required" }, { status: 400 });
    }

    const contextText =
      context?.person || context?.latestInput
        ? `\n\n【相談コンテキスト】\n${JSON.stringify(
            {
              person: context?.person ?? null,
              latestInput: context?.latestInput ?? null,
            },
            null,
            2
          )}`
        : "";
    const contextualInput = `${userInput}${contextText}`;
    const prompt = mode === "line"
      ? buildLinePrompt(contextualInput, logs)
      : buildPrompt(contextualInput, logs);
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
            standard: "今日はありがとう。今週どこかで少し話せると嬉しい。",
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
