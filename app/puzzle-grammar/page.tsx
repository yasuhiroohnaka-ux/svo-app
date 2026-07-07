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
import styles from "./page.module.css";

const ROLES: Role[] = ["subject", "verb", "object"];

const ROLE_LABEL: Record<Role, string> = {
  subject: "だれが",
  verb: "する",
  object: "なにを",
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
 * 現在カードの正解 3 ピース + ダミー 3 ピース(他カードから同じ役割の語を
 * 1 つずつ。ラベルは正解と重複しない)を作ってシャッフルして返す。
 */
function buildTray(card: Card, allCards: Card[]): Piece[] {
  const pieces: Piece[] = [];

  for (const role of ROLES) {
    const answer = correctLabel(card, role);

    // 正解ピース
    pieces.push({ key: `correct-${role}`, role, label: answer });

    // ダミー: 他カードの同じ役割で、正解と違うラベルを 1 つ拾う
    const candidates = shuffle(
      allCards
        .map((c) => correctLabel(c, role))
        .filter((label) => label !== answer),
    );
    // 重複ラベルを避けつつ最初の 1 つを採用(動詞は 3 種なので必ず 1 つは出せる)
    const dummy = candidates.find((label) => label !== answer) ?? answer;
    pieces.push({ key: `dummy-${role}`, role, label: dummy });
  }

  return shuffle(pieces);
}

type LoadState = "loading" | "ready" | "error";

export default function Page() {
  const [cards, setCards] = useState<Card[]>([]);
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

  // 最初のポインタ操作で自動再生制限を解除する
  const unlockOnce = useCallback(() => {
    if (audioUnlocked.current) return;
    audioUnlocked.current = true;
    unlockAudio();
    unlockSpeech();
  }, []);

  // カード読み込み
  const load = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");
    try {
      const loaded = await loadCards();
      setCards(loaded);
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
    setTray(buildTray(current, cards));
    setSlots({});
    setPlacedKeys(new Set());
    setCompleted(false);
    setSelectedKey(null);
    setRejectKey(null);
    setFlashSlot(null);
  }, [current, cards]);

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
    cancelSpeech();
    if (index + 1 >= cards.length) {
      setAllCleared(true);
      return;
    }
    setIndex((i) => i + 1);
  }, [cards.length, index]);

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
    goNext();
  }, [goNext, unlockOnce]);

  const restart = useCallback(() => {
    unlockOnce();
    cancelSpeech();
    setCards((prev) => shuffle(prev));
    setIndex(0);
    setScore(0);
    setStreak(0);
    setAllCleared(false);
  }, [unlockOnce]);

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
          <button className={styles.primaryButton} onClick={() => void load()}>
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
        <div className={styles.clearPanel}>
          <div className={styles.clearHanamaru}>
            <HanamaruMark className={styles.clearHanamaruSvg} />
          </div>
          <h2 className={styles.clearTitle}>ぜんぶ クリア!</h2>
          <p className={styles.clearScore}>スコア: {score} / {cards.length}</p>
          <button className={styles.primaryButton} onClick={restart}>
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
          const w = pieceWidth(filled ?? ROLE_LABEL[role]);
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
              aria-label={`${ROLE_LABEL[role]} のスロット`}
            >
              {filled ? (
                <PuzzlePiece role={role} label={filled} />
              ) : (
                <PuzzlePiece role={role} label={ROLE_LABEL[role]} ghost />
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
        <button className={styles.secondaryButton} onClick={skip}>
          スキップ
        </button>
      </div>

      <p className={styles.hint}>
        ピースを ドラッグして スロットに いれてね。タップで えらんでも いいよ。
      </p>
    </main>
  );
}
