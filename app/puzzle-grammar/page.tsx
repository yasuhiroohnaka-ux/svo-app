"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { loadCards, shuffle } from "../svo/data";
import type { Card } from "../svo/types";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";
import { speak, cancelSpeech, unlockSpeech } from "@/utils/speak";
import HanamaruMark from "@/app/components/HanamaruMark";

import PuzzlePiece, { pieceWidth, type Role } from "./PuzzlePiece";
import { loadLv2Cards, type Pattern, type PuzzleCard } from "./lv2Data";
import styles from "./page.module.css";

const ROLES: Role[] = ["subject", "verb", "object"];

const ROLE_LABEL: Record<Role, string> = {
  subject: "だれが",
  verb: "する",
  object: "なにを",
};

type Level = 1 | 2;

/**
 * 第3スロットのラベル。SVC のときだけ「なにを」→「どんな」になる。
 * ピース形状・色は object のものをそのまま流用する。
 */
function roleLabel(role: Role, pattern: Pattern): string {
  if (role === "object" && pattern === "svc") return "どんな";
  return ROLE_LABEL[role];
}

/** レベル2の文法トラップ用: 動詞の数(単数形↔複数形)の反転マップ */
const NUMBER_FLIP: Record<string, string> = {
  eats: "eat",
  eat: "eats",
  washes: "wash",
  wash: "washes",
  has: "have",
  have: "has",
  is: "are",
  are: "is",
};

/** ゲームで扱う 1 ピース分のデータ */
type Piece = {
  /** DnD などで使う一意キー */
  key: string;
  role: Role;
  label: string;
};

/** どのカードのどの役割が正解かを取り出す */
function correctLabel(card: Card, role: Role): string {
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
function pickDummy(card: PuzzleCard, allCards: PuzzleCard[], role: Role, level: Level): string {
  const answer = correctLabel(card, role);

  // レベル2の動詞は「数の反転形」を最優先(文法トラップ)
  if (level === 2 && role === "verb") {
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
function buildTray(card: PuzzleCard, allCards: PuzzleCard[], level: Level): Piece[] {
  const pieces: Piece[] = [];

  for (const role of ROLES) {
    // 正解ピース
    pieces.push({ key: `correct-${role}`, role, label: correctLabel(card, role) });
    // ダミーピース
    pieces.push({ key: `dummy-${role}`, role, label: pickDummy(card, allCards, role, level) });
  }

  return shuffle(pieces);
}

type LoadState = "loading" | "ready" | "error";

export default function Page() {
  /** レベル1デッキ(既存35枚。pattern: "svo" 扱い) */
  const [baseCards, setBaseCards] = useState<PuzzleCard[]>([]);
  /** レベル2追加カード(enabled: true のもののみ。0枚ならレベル2は選べない) */
  const [lv2Cards, setLv2Cards] = useState<PuzzleCard[]>([]);
  /** 現在プレイ中のデッキ */
  const [cards, setCards] = useState<PuzzleCard[]>([]);
  const [level, setLevel] = useState<Level>(1);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const [tray, setTray] = useState<Piece[]>([]);
  /** role -> はまったラベル(未充填は undefined) */
  const [slots, setSlots] = useState<Partial<Record<Role, string>>>({});
  /** トレイから消えたピースの key 集合 */
  const [placedKeys, setPlacedKeys] = useState<Set<string>>(new Set());

  const [completed, setCompleted] = useState(false);
  const [allCleared, setAllCleared] = useState(false);

  // タップ操作: 選択中ピース key
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // 拒否アニメ中のピース key(ぷるぷる)
  const [rejectKey, setRejectKey] = useState<string | null>(null);
  // 一瞬赤く光るスロット role
  const [flashSlot, setFlashSlot] = useState<Role | null>(null);

  const current = cards[index];
  const audioUnlocked = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAdvanceTimer = useCallback(() => {
    if (!advanceTimer.current) return;
    clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
  }, []);

  // 最初のポインタ操作で自動再生制限を解除する
  const unlockOnce = useCallback(() => {
    if (audioUnlocked.current) return;
    audioUnlocked.current = true;
    unlockAudio();
    unlockSpeech();
  }, []);

  // カード読み込み
  // lv2 は loadLv2Cards が内部で空配列フォールバックするので、レベル1の可用性に影響しない
  const load = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");
    try {
      const [loaded, lv2] = await Promise.all([loadCards(), loadLv2Cards()]);
      const base: PuzzleCard[] = loaded.map((card) => ({ ...card, pattern: "svo" as const }));
      setBaseCards(base);
      setLv2Cards(lv2);
      setLevel(1);
      setCards(base);
      setIndex(0);
      setScore(0);
      setStreak(0);
      setAllCleared(false);
      setLoadState("ready");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // カードが変わるたびにトレイ/スロットを組み直す
  useEffect(() => {
    if (!current || cards.length === 0) return;
    setTray(buildTray(current, cards, level));
    setSlots({});
    setPlacedKeys(new Set());
    setCompleted(false);
    setSelectedKey(null);
    setRejectKey(null);
    setFlashSlot(null);
  }, [current, cards, level]);

  // アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (rejectTimer.current) clearTimeout(rejectTimer.current);
      cancelSpeech();
    };
  }, []);

  /** 拒否時の共通処理: ぷるぷる + ブザー + スロット赤光 + streak リセット */
  const reject = useCallback((pieceKey: string, slotRole: Role | null) => {
    playBuzz();
    setStreak(0);
    setRejectKey(pieceKey);
    if (slotRole) setFlashSlot(slotRole);
    if (rejectTimer.current) clearTimeout(rejectTimer.current);
    rejectTimer.current = setTimeout(() => {
      setRejectKey(null);
      setFlashSlot(null);
    }, 500);
  }, []);

  /** 次のカードへ進む(全部終わっていればクリア画面) */
  const goNext = useCallback(() => {
    clearAdvanceTimer();
    cancelSpeech();
    if (index + 1 >= cards.length) {
      setAllCleared(true);
      return;
    }
    setIndex((i) => i + 1);
  }, [cards.length, clearAdvanceTimer, index]);

  /**
   * ピースをスロットに置こうとしたときの判定。
   * @returns 受理されたら true
   */
  const tryPlace = useCallback(
    (piece: Piece, slotRole: Role): boolean => {
      if (!current) return false;
      // 既に埋まっているスロットには置けない
      if (slots[slotRole]) return false;

      // 役割違い(形が合わない) → 拒否
      if (piece.role !== slotRole) {
        reject(piece.key, slotRole);
        return false;
      }
      // 役割は合うがラベルが正解と違う → 拒否
      if (piece.label !== correctLabel(current, slotRole)) {
        reject(piece.key, slotRole);
        return false;
      }

      // 正解: スナップして固定、トレイから消す
      playChime();
      setStreak((s) => s + 1);
      setSlots((prev) => ({ ...prev, [slotRole]: piece.label }));
      setPlacedKeys((prev) => {
        const next = new Set(prev);
        next.add(piece.key);
        return next;
      });
      setSelectedKey(null);
      return true;
    },
    [current, slots, reject],
  );

  // 3 スロットすべて埋まったら完成
  useEffect(() => {
    if (!current || completed) return;
    const allFilled = ROLES.every((role) => slots[role]);
    if (!allFilled) return;

    setCompleted(true);
    setScore((s) => s + 1);
    playChime();
    speak(current.sentence, "en-US");

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      goNext();
    }, 2200);
  }, [slots, current, completed, goNext]);

  // -------- ドラッグ操作(Pointer Events) --------
  const boardRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Partial<Record<Role, HTMLDivElement | null>>>({});
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const hoverSlot = useRef<Role | null>(null);
  const [hoverSlotState, setHoverSlotState] = useState<Role | null>(null);

  const findSlotAtPoint = useCallback((clientX: number, clientY: number): Role | null => {
    for (const role of ROLES) {
      const el = slotRefs.current[role];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return role;
      }
    }
    return null;
  }, []);

  const onPiecePointerDown = useCallback(
    (e: React.PointerEvent, piece: Piece) => {
      if (completed || allCleared) return;
      unlockOnce();
      // ドラッグ開始
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDragKey(piece.key);
      dragStart.current = { x: e.clientX, y: e.clientY };
      setDragOffset({ x: 0, y: 0 });
      dragMoved.current = false;
      hoverSlot.current = null;
      setHoverSlotState(null);
    },
    [completed, allCleared, unlockOnce],
  );

  const onPiecePointerMove = useCallback(
    (e: React.PointerEvent, piece: Piece) => {
      if (dragKey !== piece.key) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved.current = true;
      setDragOffset({ x: dx, y: dy });
      const slot = findSlotAtPoint(e.clientX, e.clientY);
      hoverSlot.current = slot;
      setHoverSlotState(slot);
    },
    [dragKey, findSlotAtPoint],
  );

  const onPiecePointerUp = useCallback(
    (e: React.PointerEvent, piece: Piece) => {
      if (dragKey !== piece.key) return;
      (e.target as Element).releasePointerCapture?.(e.pointerId);

      const slot = findSlotAtPoint(e.clientX, e.clientY);
      const wasDrag = dragMoved.current;

      // 状態リセット(共通)
      setDragKey(null);
      setDragOffset({ x: 0, y: 0 });
      hoverSlot.current = null;
      setHoverSlotState(null);

      if (!wasDrag) {
        // ほぼ動いていない → タップ扱い(選択トグル + 読み上げ)
        handleTapPiece(piece);
        return;
      }

      if (slot) {
        // ドラッグ判定。拒否時はスプリングバック(dragOffset を 0 に戻すだけ)
        tryPlace(piece, slot);
      }
      // どのスロットにも重なっていない → 静かにトレイへ戻る(音なし・上で offset 0 済み)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragKey, findSlotAtPoint, tryPlace],
  );

  // -------- タップ操作 --------
  const handleTapPiece = useCallback(
    (piece: Piece) => {
      unlockOnce();
      if (selectedKey === piece.key) {
        // 選択解除
        setSelectedKey(null);
        cancelSpeech();
        return;
      }
      setSelectedKey(piece.key);
      speak(piece.label, "en-US");
    },
    [selectedKey, unlockOnce],
  );

  const handleTapSlot = useCallback(
    (slotRole: Role) => {
      unlockOnce();
      if (!selectedKey) return;
      const piece = tray.find((p) => p.key === selectedKey);
      if (!piece) return;
      tryPlace(piece, slotRole);
    },
    [selectedKey, tray, tryPlace, unlockOnce],
  );

  // -------- コントロール --------
  const skip = useCallback(() => {
    unlockOnce();
    clearAdvanceTimer();
    goNext();
  }, [clearAdvanceTimer, goNext, unlockOnce]);

  const restart = useCallback(() => {
    unlockOnce();
    clearAdvanceTimer();
    cancelSpeech();
    setCards((prev) => shuffle(prev));
    setIndex(0);
    setScore(0);
    setStreak(0);
    setAllCleared(false);
  }, [clearAdvanceTimer, unlockOnce]);

  /**
   * レベル切り替え。ゲームをリセットして新しいデッキで最初から。
   *  - レベル1: 既存35枚のみ
   *  - レベル2: 既存35枚 + enabled な lv2 カード(シャッフル)
   */
  const switchLevel = useCallback(
    (next: Level) => {
      if (next === level) return;
      if (next === 2 && lv2Cards.length === 0) return;
      unlockOnce();
      cancelSpeech();
      clearAdvanceTimer();
      const deck = next === 1 ? shuffle(baseCards) : shuffle([...baseCards, ...lv2Cards]);
      setLevel(next);
      setCards(deck);
      setIndex(0);
      setScore(0);
      setStreak(0);
      setAllCleared(false);
    },
    [level, baseCards, lv2Cards, clearAdvanceTimer, unlockOnce],
  );

  // 表示待ちのトレイピース(まだ置かれていないもの)
  const visibleTray = useMemo(
    () => tray.filter((p) => !placedKeys.has(p.key)),
    [tray, placedKeys],
  );

  // ---------------- 表示 ----------------

  const header = (
    <header className={styles.headerBar}>
      <h1 className={styles.title}>Puzzle Grammar</h1>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>
          トップ
        </Link>
        <Link href="/svo" className={styles.navLink}>
          SVOカルタ
        </Link>
      </nav>
    </header>
  );

  // enabled な lv2 カードが 1 枚もない間はレベル2を選べない
  const lv2Ready = lv2Cards.length > 0;

  const levelSwitcher = (
    <div className={styles.levelRow} role="group" aria-label="レベルせんたく">
      <button
        type="button"
        className={[styles.levelButton, level === 1 ? styles.levelButtonActive : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => switchLevel(1)}
        aria-pressed={level === 1}
      >
        レベル1
      </button>
      <button
        type="button"
        className={[styles.levelButton, level === 2 ? styles.levelButtonActive : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => switchLevel(2)}
        disabled={!lv2Ready}
        aria-pressed={level === 2}
      >
        {lv2Ready ? "レベル2" : "レベル2(じゅんびちゅう)"}
      </button>
    </div>
  );

  if (loadState === "loading") {
    return (
      <main className={styles.container}>
        {header}
        <div className={styles.statusPanel}>
          <div className={styles.statusEmoji}>🧩</div>
          <p className={styles.statusText}>じゅんびちゅう...</p>
        </div>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className={styles.container}>
        {header}
        <div className={styles.statusPanel}>
          <div className={styles.statusEmoji}>😢</div>
          <p className={styles.statusText}>よみこみに しっぱいしました</p>
          <p className={styles.errorDetail}>{errorMessage}</p>
          <button type="button" className={styles.primaryButton} onClick={() => void load()}>
            もういちど よみこむ
          </button>
        </div>
      </main>
    );
  }

  if (allCleared) {
    return (
      <main className={styles.container}>
        {header}
        {levelSwitcher}
        <div className={styles.clearPanel}>
          <div className={styles.clearHanamaru}>
            <HanamaruMark className={styles.clearHanamaruSvg} />
          </div>
          <h2 className={styles.clearTitle}>ぜんぶ クリア!</h2>
          <p className={styles.clearScore}>スコア: {score} / {cards.length}</p>
          <button type="button" className={styles.primaryButton} onClick={restart}>
            もういちど
          </button>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main className={styles.container}>
        {header}
        <div className={styles.statusPanel}>
          <p className={styles.statusText}>じゅんびちゅう...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {header}
      {levelSwitcher}

      <div className={styles.statusRow}>
        <span>スコア: {score}</span>
        <span>れんぞく: {streak}</span>
        <span>カード: {index + 1} / {cards.length}</span>
      </div>

      <p className={styles.instruction}>えに あう ぶんを つくろう!</p>

      {/* 絵 */}
      <div className={styles.pictureWrap}>
        <div className={styles.pictureFrame}>
          <Image
            src={current.image}
            alt="このえに あう ぶんを つくろう"
            className={styles.picture}
            width={544}
            height={387}
            sizes="(max-width: 480px) 90vw, 420px"
            priority
          />
          {completed && (
            <div className={styles.completeMark}>
              <HanamaruMark className={styles.completeMarkSvg} />
            </div>
          )}
        </div>
      </div>

      {/* ボード: 3 スロット */}
      <div className={styles.board} ref={boardRef}>
        {ROLES.map((role) => {
          const filled = slots[role];
          const isHover = hoverSlotState === role;
          const isFlash = flashSlot === role;
          // SVC のときは第3スロットが「どんな」になる(形・色は object を流用)
          const slotLabel = roleLabel(role, current.pattern);
          const w = pieceWidth(filled ?? slotLabel);
          return (
            <div
              key={role}
              ref={(el) => {
                slotRefs.current[role] = el;
              }}
              className={[
                styles.slot,
                filled ? styles.slotFilled : "",
                isHover ? styles.slotHover : "",
                isFlash ? styles.slotReject : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ width: w + 32 }}
              onClick={() => handleTapSlot(role)}
              role="button"
              tabIndex={0}
              aria-label={`${slotLabel} のスロット`}
            >
              {filled ? (
                <PuzzlePiece role={role} label={filled} />
              ) : (
                <PuzzlePiece role={role} label={slotLabel} ghost />
              )}
            </div>
          );
        })}
      </div>

      {/* トレイ */}
      <div className={styles.tray}>
        {visibleTray.map((piece) => {
          const isDragging = dragKey === piece.key;
          const isSelected = selectedKey === piece.key;
          const isReject = rejectKey === piece.key;
          const w = pieceWidth(piece.label);
          return (
            <div
              key={piece.key}
              className={[
                styles.piece,
                isDragging ? styles.pieceDragging : "",
                isSelected ? styles.pieceSelected : "",
                isReject ? styles.pieceReject : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                width: w + 32,
                transform: isDragging
                  ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
                  : undefined,
              }}
              onPointerDown={(e) => onPiecePointerDown(e, piece)}
              onPointerMove={(e) => onPiecePointerMove(e, piece)}
              onPointerUp={(e) => onPiecePointerUp(e, piece)}
              onPointerCancel={(e) => onPiecePointerUp(e, piece)}
            >
              <PuzzlePiece role={piece.role} label={piece.label} />
            </div>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.secondaryButton} onClick={skip}>
          スキップ
        </button>
      </div>

      <p className={styles.hint}>
        ピースを ドラッグして スロットに いれてね。タップで えらんでも いいよ。
      </p>
    </main>
  );
}
