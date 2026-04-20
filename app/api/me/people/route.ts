import { NextRequest, NextResponse } from "next/server";
import { getMyPeople, saveMyPeople } from "../../../../lib/auth/server";
import type { PersonRecord } from "../../../../lib/auth/types";

export const runtime = "nodejs";

type SavePeopleBody = {
  people?: PersonRecord[];
};

export async function GET(req: NextRequest) {
  const people = await getMyPeople(req);
  if (!people) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ people });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as SavePeopleBody;
  if (!Array.isArray(body.people)) {
    return NextResponse.json({ error: "people 配列が必要です" }, { status: 400 });
  }
  const people = await saveMyPeople(req, body.people);
  if (!people) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ people });
}
