import { NextRequest, NextResponse } from "next/server";
import { getMyRelationshipLogs, saveMyRelationshipLogs } from "../../../../lib/auth/server";
import type { RelationshipLogRecord } from "../../../../lib/auth/types";

export const runtime = "nodejs";

type SaveLogsBody = {
  logs?: RelationshipLogRecord[];
};

export async function GET(req: NextRequest) {
  const logs = await getMyRelationshipLogs(req);
  if (!logs) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ logs });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as SaveLogsBody;
  if (!Array.isArray(body.logs)) {
    return NextResponse.json({ error: "logs 配列が必要です" }, { status: 400 });
  }
  const logs = await saveMyRelationshipLogs(req, body.logs);
  if (!logs) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ logs });
}
