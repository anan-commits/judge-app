import { NextRequest, NextResponse } from "next/server";
import { getMyProfile, saveMyProfile } from "../../../../lib/auth/server";
import type { Gender } from "../../../../lib/auth/types";

export const runtime = "nodejs";

type SaveProfileBody = {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: Gender;
};

export async function GET(req: NextRequest) {
  const profile = await getMyProfile(req);
  if (!profile) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as SaveProfileBody;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }
  const profile = await saveMyProfile(req, {
    name: body.name.trim(),
    birthDate: body.birthDate || "",
    birthTime: body.birthTime || "",
    gender: body.gender,
  });
  if (!profile) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({ profile });
}
