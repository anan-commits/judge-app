"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getFortuneProfile } from "../../lib/fortune/getFortuneProfile";
import { normalizeBirthDate } from "../../lib/fortune/normalizeBirthDate";
import type { Person, Relationship } from "../../lib/people/types";
import {
  isAuthenticated,
  loadMeProfile,
  loadPeopleByUser,
  saveMeProfile,
  savePeopleByUser,
} from "../../lib/people/storage";
import type { Gender } from "../../lib/auth/types";
import { getGenderColor, getGenderLabel } from "../../lib/ui/gender";
import AuthAction from "../../components/AuthAction";

const LATEST_INPUT_KEY = "judge_latest_input";
const relationshipLabelMap: Record<Relationship["type"], string> = {
  love: "恋愛",
  work: "仕事",
  friend: "友人",
  family: "家族",
};

export default function DiagnosisPage() {
  const router = useRouter();
  const [selfName, setSelfName] = useState("あなた");
  const [selfBirthdate, setSelfBirthdate] = useState("");
  const [selfBirthtime, setSelfBirthtime] = useState("");
  const [selfGender, setSelfGender] = useState<Gender | undefined>(undefined);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<Relationship["type"]>("love");
  const [didCompleteStep1, setDidCompleteStep1] = useState(false);
  const [showPartnerStep, setShowPartnerStep] = useState(false);
  const [canSaveData, setCanSaveData] = useState(false);
  const myBirthDate = selfBirthdate;
  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId) ?? null,
    [people, selectedPersonId]
  );
  const partnerBirthDate = selectedPerson?.birthDate ?? "";
  const partnerBirthTime = selectedPerson?.birthTime ?? "";
  const normalizedMyBirthDate = normalizeBirthDate(myBirthDate);
  const normalizedPartnerBirthDate = normalizeBirthDate(partnerBirthDate);

  const myProfile = didCompleteStep1 && selfBirthdate
    ? getFortuneProfile({
        birthDate: selfBirthdate,
        birthTime: selfBirthtime || undefined,
      })
    : null;
  const partnerProfile = partnerBirthDate
    ? getFortuneProfile({
        birthDate: partnerBirthDate,
        birthTime: partnerBirthTime || undefined,
      })
    : null;

  useEffect(() => {
    void (async () => {
      const me = await loadMeProfile();
      if (me) {
        setSelfName(me.name || "あなた");
        setSelfBirthdate(me.birthDate || "");
        setSelfBirthtime(me.birthTime || "");
        setSelfGender(me.gender);
        if (me.birthDate) setDidCompleteStep1(true);
      }
      const auth = await isAuthenticated();
      setCanSaveData(auth);
      const storedPeople = await loadPeopleByUser();
      setPeople(storedPeople);
      if (storedPeople.length > 0) {
        setSelectedPersonId(storedPeople[0].id);
      }
    })();
  }, []);

  console.log("birthDate raw", myBirthDate);
  console.log("birthDate normalized", normalizedMyBirthDate);
  console.log("profile", myProfile);
  console.log("birthDate raw", partnerBirthDate);
  console.log("birthDate normalized", normalizedPartnerBirthDate);
  console.log("profile", partnerProfile);
  const tendencyComment = myProfile
    ? `干支「${myProfile.kanshi}」と陰陽五行「${myProfile.yinYangGogyo}」の傾向から、${myProfile.koseigaku}として関係を作るタイプです。`
    : "";
  const selfCardTitle = `${selfName || "あなた"}（あなた）`;
  const partnerCardTitle = `${selectedPerson?.name || "お相手"}（${
    relationshipLabelMap[relationshipType]
  }）`;

  const addPerson = () => {
    if (!canSaveData) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newPerson: Person = {
      id,
      name: `新しい相手 ${people.length + 1}`,
      birthDate: "",
      birthTime: "",
      memo: "",
    };
    const nextPeople = [newPerson, ...people];
    setPeople(nextPeople);
    setSelectedPersonId(id);
    void savePeopleByUser(nextPeople);
  };

  const updateSelectedPerson = (patch: Partial<Person>) => {
    if (!selectedPersonId) return;
    if (!canSaveData) return;
    const nextPeople = people.map((person) =>
      person.id === selectedPersonId ? { ...person, ...patch } : person
    );
    setPeople(nextPeople);
    void savePeopleByUser(nextPeople);
  };

  const scrollToPartnerInput = () => {
    setShowPartnerStep(true);
    setTimeout(() => {
      const target = document.getElementById("partner-section");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleStep1Submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selfBirthdate) return;
    if (canSaveData) {
      void saveMeProfile({
        id: "self",
        name: selfName || "あなた",
        birthDate: selfBirthdate,
        birthTime: selfBirthtime || "",
        gender: selfGender,
      });
    }
    setDidCompleteStep1(true);
  };

  const handleFinalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPerson?.birthDate) return;

    const selfBirthDate = selfBirthdate;
    const selfBirthTime = selfBirthtime || undefined;
    try {
      const res = await fetch("/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          self: {
            birthDate: selfBirthDate,
            birthTime: selfBirthTime,
          },
          partner: {
            birthDate: selectedPerson.birthDate,
            birthTime: selectedPerson.birthTime || undefined,
          },
        }),
      });

      if (!res.ok) throw new Error("diagnosis api failed");
      const diagnosis = await res.json();
      sessionStorage.setItem("judge-code:latest-diagnosis", JSON.stringify(diagnosis));
    } catch {
      // API失敗時も既存導線を止めない
      sessionStorage.removeItem("judge-code:latest-diagnosis");
    }

    localStorage.setItem(
      LATEST_INPUT_KEY,
      JSON.stringify({
        myBirthDate: selfBirthDate,
        myBirthTime: selfBirthtime || "",
        partnerBirthDate: selectedPerson.birthDate,
        partnerBirthTime: selectedPerson.birthTime || "",
        personId: selectedPerson.id,
        relationshipType,
      })
    );
    sessionStorage.setItem(
      LATEST_INPUT_KEY,
      JSON.stringify({
        myBirthDate: selfBirthDate,
        myBirthTime: selfBirthtime || "",
        partnerBirthDate: selectedPerson.birthDate,
        partnerBirthTime: selectedPerson.birthTime || "",
        personId: selectedPerson.id,
        relationshipType,
      })
    );
    router.push("/result");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-[#f7f7f5]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <a href="/" className="text-xs font-semibold tracking-[0.18em] text-zinc-900">
            JUDGE CODE
          </a>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium tracking-wide text-zinc-500">人間関係診断</span>
            <AuthAction />
          </div>
        </div>
      </header>

      <section className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            Step input
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            まずはあなたの情報だけで、今すぐ傾向を見ます
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            最初の入力は最小限。先にあなたの傾向を表示し、そのあと相手入力へ進めます。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-6 pb-10">
        <article className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            STEP1
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950">あなたの生年月日を入力</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            出生時間は任意です（あとからでもOK）
          </p>

          <form onSubmit={handleStep1Submit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="self-name" className="text-sm font-medium text-zinc-700">
                あなたの名前
              </label>
              <input
                id="self-name"
                type="text"
                value={selfName}
                onChange={(e) => setSelfName(e.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">性別</label>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setSelfGender("male")}
                  className={`rounded-full px-3 py-1 ${
                    selfGender === "male" ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  男性
                </button>
                <button
                  type="button"
                  onClick={() => setSelfGender("female")}
                  className={`rounded-full px-3 py-1 ${
                    selfGender === "female" ? "bg-pink-100 text-pink-600" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  女性
                </button>
                <button
                  type="button"
                  onClick={() => setSelfGender("other")}
                  className={`rounded-full px-3 py-1 ${
                    selfGender === "other" ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  その他
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="self-birthdate" className="text-sm font-medium text-zinc-700">
                生年月日
              </label>
              <input
                id="self-birthdate"
                type="date"
                required
                value={selfBirthdate}
                onChange={(e) => setSelfBirthdate(e.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="self-birthtime" className="text-sm font-medium text-zinc-700">
                出生時間（任意）
              </label>
              <input
                id="self-birthtime"
                type="time"
                value={selfBirthtime}
                onChange={(e) => setSelfBirthtime(e.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              まず自分の傾向を見る
            </button>
          </form>
        </article>

        {didCompleteStep1 ? (
          <article className="mt-5 rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              STEP2
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950">
              あなたは「{myProfile ? myProfile.koseigaku : "—"}」です
            </h3>
            {myProfile ? (
              <div className="mt-2 text-xs text-gray-500">
                {myProfile.kanshi}（{myProfile.yinYangGogyo}）｜{myProfile.honmei}（本命）｜
                {myProfile.getsumei}（月命）｜{myProfile.koseigaku}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium text-zinc-600">あなたの傾向</p>
                {tendencyComment ? (
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{tendencyComment}</p>
                ) : null}
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-700">
              人との関係は相性だけでは決まりません。運気・タイミング・行動で結果は大きく変わります。
            </p>
            {!showPartnerStep ? (
              <button
                type="button"
                onClick={scrollToPartnerInput}
                className="mt-4 inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                相手との関係を見る
              </button>
            ) : null}
          </article>
        ) : null}

        {didCompleteStep1 && showPartnerStep ? (
          <article id="partner-section" className="mt-5 rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-sm">
            {!canSaveData ? (
              <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                この内容を保存するにはログインしてください。
              </p>
            ) : null}
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              STEP3
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950">相手の情報を入力</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              生年月日だけでも進めます。出生時間は任意です。
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${getGenderColor(
                      selfGender
                    )}`}
                  >
                    👤
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900">{selfCardTitle}</h4>
                    <p className="text-xs text-zinc-500">{getGenderLabel(selfGender)}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  {myProfile ? (
                    <>
                      <div>陰陽五行: {myProfile.kanshi}（{myProfile.yinYangGogyo}）</div>
                      <div>九星気学: {myProfile.honmei}（本命）｜{myProfile.getsumei}（月命）</div>
                      <div>個性学: {myProfile.koseigaku}</div>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h4 className="text-base font-bold text-zinc-900">{partnerCardTitle}</h4>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  {partnerProfile ? (
                    <>
                      <div>陰陽五行: {partnerProfile.kanshi}（{partnerProfile.yinYangGogyo}）</div>
                      <div>九星気学: {partnerProfile.honmei}（本命）｜{partnerProfile.getsumei}（月命）</div>
                      <div>個性学: {partnerProfile.koseigaku}</div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              ※本サービスは標準的な暦法に基づいて算出しています
            </p>

            <form onSubmit={handleFinalSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-700">人物一覧</p>
                  <button
                    type="button"
                    onClick={addPerson}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700"
                  >
                    ＋追加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedPersonId(person.id)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        person.id === selectedPersonId
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white text-zinc-700"
                      }`}
                    >
                      {person.name || "未命名"}
                    </button>
                  ))}
                </div>
              </div>
              {selectedPerson ? (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="person-name" className="text-sm font-medium text-zinc-700">
                      選択中の人物名
                    </label>
                    <input
                      id="person-name"
                      type="text"
                      value={selectedPerson.name}
                      onChange={(e) => updateSelectedPerson({ name: e.target.value })}
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="partner-birthdate" className="text-sm font-medium text-zinc-700">
                      生年月日
                    </label>
                    <input
                      id="partner-birthdate"
                      type="date"
                      required
                      value={selectedPerson.birthDate || ""}
                      onChange={(e) => updateSelectedPerson({ birthDate: e.target.value })}
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="partner-birthtime" className="text-sm font-medium text-zinc-700">
                      出生時間（任意）
                    </label>
                    <input
                      id="partner-birthtime"
                      type="time"
                      value={selectedPerson.birthTime || ""}
                      onChange={(e) => updateSelectedPerson({ birthTime: e.target.value })}
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="person-memo" className="text-sm font-medium text-zinc-700">
                      メモ（任意）
                    </label>
                    <textarea
                      id="person-memo"
                      rows={3}
                      value={selectedPerson.memo || ""}
                      onChange={(e) => updateSelectedPerson({ memo: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="relationship-type" className="text-sm font-medium text-zinc-700">
                      関係タイプ
                    </label>
                    <select
                      id="relationship-type"
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value as Relationship["type"])}
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
                    >
                      <option value="love">恋愛</option>
                      <option value="work">仕事</option>
                      <option value="friend">友人</option>
                      <option value="family">家族</option>
                    </select>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-600">「＋追加」で人物を作成してください。</p>
              )}
              <button
                type="submit"
                disabled={!selectedPerson?.birthDate}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                STEP4: 診断結果を見る
              </button>
            </form>
          </article>
        ) : null}
      </section>
    </main>
  );
}
