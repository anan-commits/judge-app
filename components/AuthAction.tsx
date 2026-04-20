"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthAction() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <span className="text-xs text-zinc-400">認証確認中...</span>;
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
        ログイン
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await logout();
        router.push("/login");
      }}
      className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
    >
      ログアウト
    </button>
  );
}
