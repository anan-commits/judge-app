import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, logoutCurrentSession } from "../../../../lib/auth/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await logoutCurrentSession(req);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
