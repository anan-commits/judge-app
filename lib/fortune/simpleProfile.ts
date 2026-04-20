import { getFortuneProfile } from "./getFortuneProfile";

export type SimpleFortuneInput = {
  birthDate: string;
  birthTime?: string;
};

export type SimpleFortuneProfile = {
  kanshi: string;
  yinYangGogyo: string;
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

export function getSimpleFortuneProfile(input: SimpleFortuneInput): SimpleFortuneProfile | null {
  const core = getFortuneProfile({ birthDate: input.birthDate, birthTime: input.birthTime });
  if (!core) {
    return null;
  }
  const gogyo = core.yinYangGogyo.charAt(0) as keyof typeof directionByGogyo;
  return {
    ...core,
    luckyDirection: directionByGogyo[gogyo] ?? "東",
  };
}
