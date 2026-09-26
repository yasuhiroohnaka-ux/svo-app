import { APPS, type AppId } from "./apps";
import { createPersistentStore } from "./persistentStore";

/**
 * ⭐ と たからもの(全アプリ共通のごほうび)。
 *
 * - 各アプリは「ステージ」(おはなし 1 話、迷路 1 つ、タイムトライアルの枚数など)を
 *   クリアしたときに recordStars で ⭐1〜3 を記録する。ステージごとにベストだけを残す。
 * - ⭐ の合計や部屋ごとの ⭐ で「たからもの」が手に入る。
 * - 新しいたからものを手に入れたら TREASURE_EVENT を投げ、TreasureToast が知らせる。
 */

export type Stars = 1 | 2 | 3;

export type RewardsState = {
  /** `${appId}:${stageId}` → そのステージのベスト ⭐ */
  stars: Record<string, Stars>;
  treasures: string[];
};

const EMPTY: RewardsState = { stars: {}, treasures: [] };

export function parseRewards(value: unknown): RewardsState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY;
  const raw = value as Partial<RewardsState>;
  const stars: Record<string, Stars> = {};
  if (raw.stars && typeof raw.stars === "object") {
    for (const [key, count] of Object.entries(raw.stars)) {
      if (count === 1 || count === 2 || count === 3) stars[key] = count;
    }
  }
  const treasures = Array.isArray(raw.treasures) ? raw.treasures.filter((id): id is string => typeof id === "string") : [];
  return { stars, treasures };
}

export const rewardsStore = createPersistentStore<RewardsState>({
  key: "kotoba.rewards.v1",
  fallback: EMPTY,
  parse: parseRewards,
});

export function totalStars(state: RewardsState): number {
  return Object.values(state.stars).reduce<number>((sum, count) => sum + count, 0);
}

export function appStars(state: RewardsState, appId: AppId): number {
  const prefix = `${appId}:`;
  return Object.entries(state.stars).reduce((sum, [key, count]) => (key.startsWith(prefix) ? sum + count : sum), 0);
}

function perfectCount(state: RewardsState): number {
  return Object.values(state.stars).filter((count) => count === 3).length;
}

export type Treasure = {
  id: string;
  icon: string;
  name: string;
  /** まだ持っていないときに見せる手がかり */
  hint: string;
  unlocked: (state: RewardsState) => boolean;
};

const ROOM_TREASURES: Record<AppId, { icon: string; name: string }> = {
  phonics: { icon: "🔔", name: "おとの すず" },
  maze: { icon: "🧭", name: "まよわない コンパス" },
  puzzle: { icon: "🧩", name: "きんの パズルピース" },
  svo: { icon: "🎴", name: "はやとりの ふだ" },
  quiz: { icon: "🃏", name: "ひみつの カード" },
  story: { icon: "📖", name: "まほうの えほん" },
  sota: { icon: "🎨", name: "にじいろの ふで" },
  rhyme: { icon: "🎵", name: "うたう まきもの" },
  guess: { icon: "🔍", name: "たんていの むしめがね" },
};

export const TREASURES: Treasure[] = [
  ...APPS.map((app) => ({
    id: `room-${app.id}`,
    icon: ROOM_TREASURES[app.id].icon,
    name: ROOM_TREASURES[app.id].name,
    hint: `「${app.title}」で ⭐を 3つ あつめよう`,
    unlocked: (state: RewardsState) => appStars(state, app.id) >= 3,
  })),
  { id: "stars-10", icon: "💎", name: "ちいさな ほうせき", hint: "⭐を ぜんぶで 10こ あつめよう", unlocked: (s) => totalStars(s) >= 10 },
  { id: "stars-30", icon: "👑", name: "ことばの かんむり", hint: "⭐を ぜんぶで 30こ あつめよう", unlocked: (s) => totalStars(s) >= 30 },
  { id: "stars-60", icon: "🐉", name: "ダンジョンの ドラゴン", hint: "⭐を ぜんぶで 60こ あつめよう", unlocked: (s) => totalStars(s) >= 60 },
  { id: "perfect-10", icon: "🌟", name: "きらきら スター", hint: "⭐⭐⭐ を 10かい とろう", unlocked: (s) => perfectCount(s) >= 10 },
  {
    id: "all-rooms",
    icon: "🗝️",
    name: "マスターキー",
    hint: "ぜんぶの へやで ⭐を 1つずつ あつめよう",
    unlocked: (s) => APPS.every((app) => appStars(s, app.id) >= 1),
  },
];

export function getTreasure(id: string): Treasure | undefined {
  return TREASURES.find((treasure) => treasure.id === id);
}

export type RecordResult = {
  stars: Stars;
  /** これまでのベスト(はじめてなら 0) */
  previousBest: number;
  /** この記録で増えた ⭐ の数(ベスト更新分) */
  gained: number;
  newTreasures: Treasure[];
};

export const TREASURE_EVENT = "kotoba:treasure";

/** 状態に ⭐ を反映した結果を返す(保存はしない。テスト用に分けている) */
export function applyStars(state: RewardsState, appId: AppId, stageId: string, stars: Stars): { next: RewardsState; result: RecordResult } {
  const key = `${appId}:${stageId}`;
  const previousBest = state.stars[key] ?? 0;
  const best = Math.max(previousBest, stars) as Stars;
  const withStars: RewardsState = { ...state, stars: { ...state.stars, [key]: best } };
  const newTreasures = TREASURES.filter((treasure) => !state.treasures.includes(treasure.id) && treasure.unlocked(withStars));
  const next: RewardsState = { ...withStars, treasures: [...state.treasures, ...newTreasures.map((treasure) => treasure.id)] };
  return { next, result: { stars, previousBest, gained: best - previousBest, newTreasures } };
}

/** ステージの ⭐ を記録する。新しいたからものがあれば知らせる */
export function recordStars(appId: AppId, stageId: string, stars: Stars): RecordResult {
  const { next, result } = applyStars(rewardsStore.get(), appId, stageId, stars);
  if (result.gained > 0 || result.newTreasures.length > 0) rewardsStore.set(next);
  if (result.newTreasures.length > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TREASURE_EVENT, { detail: result.newTreasures.map((treasure) => treasure.id) }));
  }
  return result;
}

/** 正答率から ⭐ を決める(ミスなし=3、8割以上=2、それ以外=1) */
export function starsFromAccuracy(correct: number, total: number): Stars {
  if (total <= 0) return 1;
  const ratio = correct / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.8) return 2;
  return 1;
}

/** タイムトライアル: 1 まい あたりの秒数で ⭐ を決める(2.5 秒以内=3、4 秒以内=2) */
export function starsFromTime(seconds: number, cards: number): Stars {
  const perCard = seconds / Math.max(1, cards);
  if (perCard <= 2.5) return 3;
  if (perCard <= 4) return 2;
  return 1;
}

/** VS AI: かち=3、ひきわけ=2、まけ=1(さいごまで あそんだ ごほうび) */
export function starsFromVs(player: number, ai: number): Stars {
  if (player > ai) return 3;
  if (player === ai) return 2;
  return 1;
}

/** ミスの回数から ⭐ を決める(0 回=3、limit 回まで=2、それ以上=1) */
export function starsFromMistakes(mistakes: number, limit = 2): Stars {
  if (mistakes <= 0) return 3;
  if (mistakes <= limit) return 2;
  return 1;
}
