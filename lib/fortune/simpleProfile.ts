import { getFortuneProfile } from "./getFortuneProfile";

export type SimpleFortuneInput = {
  birthDate: string;
  birthTime?: string;
};

export type SimpleFortuneProfile = {
  dayStem: string;
  gogyo: string;
  kyusei: string;
  koseigaku: string;
  luckyDirection: string;
};

const directionByGogyo: Record<"木" | "火" | "土" | "金" | "水", string> = {
  木: "東",
  火: "南",
  土: "南西",
  金: "西",
  水: "北",
};

export function getSimpleFortuneProfile(input: SimpleFortuneInput): SimpleFortuneProfile {
  const core = getFortuneProfile({ birthDate: input.birthDate, birthTime: input.birthTime });
  return {
    ...core,
    luckyDirection: directionByGogyo[core.gogyo as keyof typeof directionByGogyo] ?? "東",
  };
}
