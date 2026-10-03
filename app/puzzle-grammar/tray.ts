import { shuffle } from "../svo/data";
import type { Card } from "../svo/types";
import type { Pattern, PuzzleCard } from "@/app/lib/lv2Cards";
import type { Role } from "./PuzzlePiece";

/* ピースの組み立て(正解 3 つ + ダミー 3 つ)。画面から切り離してテストできるようにしている */

export const ROLES: Role[] = ["subject", "verb", "object"];

export const ROLE_LABEL: Record<Role, string> = {
  subject: "だれが",
  verb: "する",
  object: "なにを",
};

export type Level = 1 | 2 | "stories";

/**
 * 第3スロットのラベル。SVC のときだけ「なにを」→「どんな」になる。
 * ピース形状・色は object のものをそのまま流用する。
 */
export function roleLabel(role: Role, pattern: Pattern): string {
  if (role === "object" && pattern === "svc") return "どんな";
  return ROLE_LABEL[role];
}

/** レベル2の文法トラップ用: 動詞の数(単数形↔複数形)の反転マップ */
export const NUMBER_FLIP: Record<string, string> = {
  eats: "eat",
  eat: "eats",
  washes: "wash",
  wash: "washes",
  has: "have",
  have: "has",
  catches: "catch",
  catch: "catches",
  is: "are",
  are: "is",
  draws: "draw",
  draw: "draws",
};

/** ゲームで扱う 1 ピース分のデータ */
export type Piece = {
  /** DnD などで使う一意キー */
  key: string;
  role: Role;
  label: string;
};

/** どのカードのどの役割が正解かを取り出す */
export function correctLabel(card: Card, role: Role): string {
  if (role === "subject") return card.subject;
  if (role === "verb") return card.verb;
  return card.object;
}

/**
 * 役割ごとのダミーラベルを 1 つ選ぶ。
 *  - レベル2の動詞: 正解動詞の「数の反転形」を必ず使う(eats↔eat, is↔are など)。
 *    反転が未定義の動詞のみ従来どおり他カードから選ぶ。
 *  - SVC の第3スロット(補語): デッキ内の svc カード群の補語から正解と異なるものを選ぶ。
 *  - それ以外(レベル1すべて・主語・svo の目的語)は従来どおり:
 *    デッキ内の他カードの同じ役割の語から正解と異なるものを選ぶ。
 */
export function pickDummy(card: PuzzleCard, allCards: PuzzleCard[], role: Role, level: Level): string {
  const answer = correctLabel(card, role);
  const reviewedDummy = card.distractors?.[role];
  if (reviewedDummy && reviewedDummy !== answer) return reviewedDummy;

  // レベル2の動詞は「数の反転形」を最優先(文法トラップ)
  if (level !== 1 && role === "verb") {
    const flipped = NUMBER_FLIP[answer];
    if (flipped) return flipped;
  }

  // SVC の補語ダミーは svc カード群の補語から選ぶ
  if (role === "object" && card.pattern === "svc") {
    const complements = shuffle(
      allCards
        .filter((c) => c.pattern === "svc")
        .map((c) => c.object)
        .filter((label) => label !== answer),
    );
    if (complements.length > 0) return complements[0];
    // 候補がない場合は下の従来ロジックにフォールバック
  }

  // 従来ロジック: 他カードの同じ役割で、正解と違うラベルを 1 つ拾う
  const candidates = shuffle(
    allCards
      .map((c) => correctLabel(c, role))
      .filter((label) => label !== answer),
  );
  // 重複ラベルを避けつつ最初の 1 つを採用(動詞は 3 種なので必ず 1 つは出せる)
  return candidates.find((label) => label !== answer) ?? answer;
}

/**
 * 現在カードの正解 3 ピース + ダミー 3 ピースを作ってシャッフルして返す。
 * ダミーの選び方は pickDummy を参照。
 */
export function buildTray(card: PuzzleCard, allCards: PuzzleCard[], level: Level): Piece[] {
  const pieces: Piece[] = [];

  for (const role of ROLES) {
    // 正解ピース
    pieces.push({ key: `correct-${role}`, role, label: correctLabel(card, role) });
    // ダミーピース
    pieces.push({ key: `dummy-${role}`, role, label: pickDummy(card, allCards, role, level) });
  }

  return shuffle(pieces);
}
