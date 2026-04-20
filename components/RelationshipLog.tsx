"use client";

import { useEffect, useMemo, useState } from "react";
import type { Person, RelationshipLog } from "../lib/people/types";
import { loadPeople, loadRelationshipLogs, saveRelationshipLogs } from "../lib/people/storage";

function toTimestampLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RelationshipLog() {
  const [logs, setLogs] = useState<RelationshipLog[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<RelationshipLog["type"]>("note");

  useEffect(() => {
    const loadedPeople = loadPeople();
    setPeople(loadedPeople);
    if (loadedPeople.length > 0) {
      setPersonId(loadedPeople[0].id);
    }
    setLogs(loadRelationshipLogs());
  }, []);

  useEffect(() => {
    saveRelationshipLogs(logs);
  }, [logs]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => b.timestamp - a.timestamp),
    [logs]
  );

  const addLog = () => {
    const trimmed = content.trim();
    if (!trimmed || !personId) return;
    const item: RelationshipLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      personId,
      type,
      content: trimmed,
      timestamp: Date.now(),
    };
    setLogs((prev) => [item, ...prev]);
    setContent("");
    setType("note");
  };

  const removeLog = (id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="mb-4 rounded-lg border bg-yellow-50 p-3">
        <p className="text-sm text-gray-700">
          この記録が増えるほど、分析精度が上がります。
        </p>
      </div>

      {logs.length > 5 ? (
        <div className="mb-4 rounded border bg-green-50 p-3">
          <p className="text-sm text-green-700">
            あなたは既に十分なデータを持っています。判断精度が上がっています。
          </p>
        </div>
      ) : null}

      <div className="mb-4 rounded-lg border bg-white p-4">
        <select
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          className="mb-2 w-full rounded border p-2 text-sm outline-none focus:border-zinc-500"
        >
          <option value="">人物を選択</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="相手が言っていたことや行動を入力..."
          className="mb-2 w-full rounded border p-2 text-sm outline-none focus:border-zinc-500"
          rows={4}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as RelationshipLog["type"])}
          className="mb-2 w-full rounded border p-2 text-sm outline-none focus:border-zinc-500"
        >
          <option value="line">LINE</option>
          <option value="date">デート</option>
          <option value="call">通話</option>
          <option value="note">メモ</option>
        </select>

        <button
          type="button"
          onClick={addLog}
          className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          記録する
        </button>
      </div>

      <div className="space-y-3">
        {sortedLogs.map((log) => (
          <div key={log.id} className="rounded-lg border bg-white p-3 shadow">
            <div className="text-xs text-gray-400">{toTimestampLabel(log.timestamp)}</div>
            <div className="text-xs text-gray-500">
              {people.find((person) => person.id === log.personId)?.name || "不明な人物"}
            </div>
            <div className="text-sm font-bold">{log.type}</div>
            <div className="mt-1 text-sm">{log.content}</div>
            <button
              type="button"
              onClick={() => removeLog(log.id)}
              className="mt-2 text-xs text-red-500 hover:text-red-600"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
