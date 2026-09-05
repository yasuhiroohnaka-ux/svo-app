import type { Card } from "../svo/types";

/** レベル2カードの pattern。svo=主語+動詞+目的語、svc=主語+be動詞+補語 */
export type Pattern = "svo" | "svc";

/** 既存 Card にレベル(pattern)情報を足したもの。既存35枚は "svo" 扱い */
export type PuzzleCard = Card & { pattern: Pattern; distractors?: Pick<Card, "subject" | "verb" | "object"> };

const LV2_URL = "/data/puzzle_cards_lv2.json";

/** 生 JSON の 1 カード分。バリデーション前の想定形 */
type RawLv2Card = {
  cardId?: unknown;
  pattern?: unknown;
  subject?: unknown;
  verb?: unknown;
  object?: unknown;
  sentence?: unknown;
  subject_zh?: unknown;
  verb_zh?: unknown;
  object_zh?: unknown;
  sentence_zh?: unknown;
  imageFile?: unknown;
  enabled?: unknown;
};

function asRawArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as { cards?: unknown };
    if (Array.isArray(record.cards)) return record.cards;
  }
  return [];
}

/**
 * 1 件を検証しつつ PuzzleCard に変換する。
 * 必須項目が欠けている・型が違う場合は null を返して呼び出し側で読み飛ばす。
 */
function normalizeLv2Card(raw: unknown): PuzzleCard | null {
  if (!raw || typeof raw !== "object") return null;
  const card = raw as RawLv2Card;

  const pattern = card.pattern === "svc" ? "svc" : card.pattern === "svo" ? "svo" : null;
  if (!pattern) return null;

  const cardId = Number(card.cardId);
  const subject = typeof card.subject === "string" ? card.subject : "";
  const verb = typeof card.verb === "string" ? card.verb : "";
  const object = typeof card.object === "string" ? card.object : "";
  const sentence = typeof card.sentence === "string" ? card.sentence : "";
  const subject_zh = typeof card.subject_zh === "string" ? card.subject_zh : "";
  const verb_zh = typeof card.verb_zh === "string" ? card.verb_zh : "";
  const object_zh = typeof card.object_zh === "string" ? card.object_zh : "";
  const sentence_zh = typeof card.sentence_zh === "string" ? card.sentence_zh : "";
  const imageFile = typeof card.imageFile === "string" ? card.imageFile : "";
  const enabled = card.enabled === true;

  if (!Number.isFinite(cardId) || !subject || !verb || !object || !sentence || !imageFile) {
    return null;
  }
  // enabled でない、または画像未設定のカードはレベル2デッキ対象外
  if (!enabled) return null;

  return {
    id: cardId,
    pattern,
    subject,
    verb,
    object,
    sentence,
    subject_zh,
    verb_zh,
    object_zh,
    sentence_zh,
    image: `/images/lv2/${imageFile}`,
  };
}

/**
 * レベル2カードを読み込む。enabled: true かつ imageFile が空でないものだけを返す。
 * fetch 失敗・JSON 不正・スキーマ不正などいかなる理由でも throw せず、
 * 空配列にフォールバックする(レベル1が必ず遊べる状態を保つため)。
 */
export async function loadLv2Cards(fetchImpl: typeof fetch = fetch): Promise<PuzzleCard[]> {
  try {
    const res = await fetchImpl(`${LV2_URL}?t=${Date.now()}`);
    if (!res.ok) return [];

    const data: unknown = await res.json();
    const rawCards = asRawArray(data);

    const cards: PuzzleCard[] = [];
    for (const raw of rawCards) {
      const normalized = normalizeLv2Card(raw);
      if (normalized) cards.push(normalized);
    }

    return cards;
  } catch {
    return [];
  }
}
