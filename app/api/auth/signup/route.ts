import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_MAX_AGE_SEC,
  AUTH_COOKIE_NAME,
  signupWithEmail,
} from "../../../../lib/auth/server";

export const runtime = "nodejs";

type SignupBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SignupBody;
    const email = body.email?.trim() || "";
    const password = body.password || "";
    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "メールアドレスと8文字以上のパスワードが必要です" },
        { status: 400 }
      );
    }
    const { user, token } = await signupWithEmail(email, password);
    const res = NextResponse.json({ user });
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_SEC,
    });
    return res;
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 });
    }
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
