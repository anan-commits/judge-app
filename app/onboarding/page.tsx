"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { fetchProfile, saveProfile } from "../../lib/auth/client";
import type { Gender } from "../../lib/auth/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isAuthenticated) return;
    void (async () => {
      const profile = await fetchProfile();
      if (!profile) return;
      setName(profile.name || "");
      setBirthDate(profile.birthDate || "");
      setBirthTime(profile.birthTime || "");
      setGender(profile.gender);
      if (profile.name) {
        router.replace("/diagnosis");
      }
    })();
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveProfile({
        name: name.trim(),
        birthDate: birthDate || "",
        birthTime: birthTime || "",
        gender,
      });
      await refreshUser();
      router.push("/diagnosis");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">プロフィール初期設定</h1>
        <p className="mt-2 text-sm text-zinc-600">あなた専用の保存領域にプロフィールを登録します。</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前"
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">性別</p>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`rounded-full px-3 py-1 ${
                  gender === "male" ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                男性
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`rounded-full px-3 py-1 ${
                  gender === "female" ? "bg-pink-100 text-pink-600" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                女性
              </button>
              <button
                type="button"
                onClick={() => setGender("other")}
                className={`rounded-full px-3 py-1 ${
                  gender === "other" ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                その他
              </button>
            </div>
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full rounded-full bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "保存中..." : "プロフィールを保存"}
          </button>
        </form>
      </div>
    </main>
  );
}
