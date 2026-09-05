import rawBook from "../data/book.json";
import type { SotaBook, SotaImageVariant, SotaSpread } from "../types";

export const sotaBook = rawBook as SotaBook;
export const sotaSpreads = sotaBook.spreads;
export const sotaCoverImagePath = "/images/sota/color/art-p01.webp";

const spreadById = new Map(sotaSpreads.map((spread) => [spread.id, spread]));

export function getSotaImagePath(
  spread: SotaSpread,
  variant: SotaImageVariant = "color",
): string {
  const page = String(spread.artPage).padStart(2, "0");
  return `/images/sota/${variant}/art-p${page}.${variant === "color" ? "webp" : "png"}`;
}

export function getChoiceSpreads(spread: SotaSpread): SotaSpread[] {
  const distractors = spread.distractors
    .slice(0, 2)
    .map((id) => spreadById.get(id))
    .filter((item): item is SotaSpread => Boolean(item));
  const sceneNumber = Number.parseInt(spread.id.replace("s", ""), 10);
  const correctPosition = Number.isFinite(sceneNumber) ? (sceneNumber * 2) % 3 : 0;
  const choices = [...distractors];
  choices.splice(correctPosition, 0, spread);
  return choices;
}
