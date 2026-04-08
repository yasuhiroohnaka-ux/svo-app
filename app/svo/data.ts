import type { Card } from "./types";

type LoadCardsOptions = {
  onStep?: (step: string) => void;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

function asCardArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as { cards?: unknown; items?: unknown };
    if (Array.isArray(record.cards)) return record.cards;
    if (Array.isArray(record.items)) return record.items;
  }

  return [];
}

function normalizeCard(raw: unknown, index: number): Card {
  const card = (raw ?? {}) as Record<string, unknown>;

  return {
    id: Number(card.id ?? card.cardId ?? index),
    subject: String(card.subject ?? ""),
    verb: String(card.verb ?? ""),
    object: String(card.object ?? ""),
    sentence: String(card.sentence ?? card.text ?? ""),
    subject_zh: String(card.subject_zh ?? ""),
    verb_zh: String(card.verb_zh ?? ""),
    object_zh: String(card.object_zh ?? ""),
    sentence_zh: String(card.sentence_zh ?? ""),
    image: String(
      card.image ??
        card.img ??
        card.imagePath ??
        (card.imageFile ? `/images/${String(card.imageFile)}` : ""),
    ),
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

export function pickRandomIndex(length: number): number {
  return length > 0 ? Math.floor(Math.random() * length) : 0;
}

export function normalizeCards(data: unknown): Card[] {
  return asCardArray(data)
    .map((item, index) => normalizeCard(item, index))
    .filter((card) => card.sentence && card.image);
}

export async function loadCards({
  onStep,
  fetchImpl = fetch,
  now = () => Date.now(),
}: LoadCardsOptions = {}): Promise<Card[]> {
  onStep?.("step1: start init");

  const url = `/data/svo_cards.json?t=${now()}`;
  onStep?.(`step2: fetching ${url}`);

  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  onStep?.("step3: parsing json");
  const data = await res.json();

  const rawCards = asCardArray(data);
  onStep?.(`step4: normalizing ${rawCards.length} items`);

  const normalized = normalizeCards(data);
  if (normalized.length === 0) {
    throw new Error("No valid cards found in data.");
  }

  onStep?.("step5: ready");
  return shuffle(normalized);
}
