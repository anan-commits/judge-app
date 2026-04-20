"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "../../lib/auth/client";
import { useAuth } from "../../components/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(email, password);
      await refreshUser();
      router.push("/onboarding");
    } catch (e) {
      setError(e instanceof Error ? e.message : "新規登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">新規登録</h1>
        <p className="mt-2 text-sm text-zinc-600">メールアドレスとパスワードでアカウントを作成します。</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（8文字以上）"
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "作成中..." : "アカウントを作成"}
          </button>
        </form>
        <p className="mt-4 text-xs text-zinc-600">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="underline underline-offset-2">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
