import test from "node:test";
import assert from "node:assert/strict";
import { calcNineStarKi } from "../../lib/fortune/nineStarKi";

function calc(date: string, time = "12:00") {
  return calcNineStarKi({ birthDate: date, birthTime: time });
}

test("立春の前日/当日/翌日で本命星が切り替わる", () => {
  const before = calc("2024-02-03");
  const on = calc("2024-02-04");
  const after = calc("2024-02-05");

  const changed = before.honmei !== on.honmei || on.honmei !== after.honmei;
  assert.equal(changed, true);
});

test("節入りの前日/当日/翌日で月命星が切り替わる", () => {
  const before = calc("2024-03-04");
  const on = calc("2024-03-05");
  const after = calc("2024-03-06");

  const changed = before.getsumei !== on.getsumei || on.getsumei !== after.getsumei;
  assert.equal(changed, true);
});

test("節入り当日の時刻前後でも同一入力系で結果がブレない", () => {
  const morning = calc("2024-03-05", "09:00");
  const evening = calc("2024-03-05", "21:00");

  assert.equal(morning.getsumei, evening.getsumei);
});

test("同一入力は常に同一結果", () => {
  const a = calc("1971-01-29", "22:28");
  const b = calc("1971-01-29", "22:28");

  assert.deepEqual(a, b);
});
