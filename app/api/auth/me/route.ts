import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
