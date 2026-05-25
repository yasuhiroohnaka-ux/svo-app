"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

const SOUND_IDS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "sh",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
] as const;

type SoundId = (typeof SOUND_IDS)[number];
type Verdict = "idle" | "playing" | "correct" | "tryAgain";

type Coord = {
  row: number;
  col: number;
};

type SoundResource = {
  symbol: string;
  audio: string;
  speech: string;
  image?: string;
};

type MazeTemplate = {
  id: string;
  label: string;
  pattern: SoundId[];
  patternPool?: SoundId[];
  rows: number;
  cols: number;
  solutionPath: Coord[];
  start: Coord;
  goal: Coord;
  color: string;
};

type MazeLevel = MazeTemplate & {
  target: SoundId[];
  grid: SoundId[][];
  seed: number;
};

const SOUND_RESOURCES: Record<SoundId, SoundResource> = {
  a: {
    symbol: "a",
    image: "/images/phonics/cards/a.png",
    audio: "/audio/phonics/a.m4a",
    speech: "ah",
  },
  b: {
    symbol: "b",
    image: "/images/phonics/cards/b.png",
    audio: "/audio/phonics/b.m4a",
    speech: "b",
  },
  c: {
    symbol: "c",
    image: "/images/phonics/cards/c.png",
    audio: "/audio/phonics/c_k_q.m4a",
    speech: "k",
  },
  d: {
    symbol: "d",
    image: "/images/phonics/cards/d.png",
    audio: "/audio/phonics/d.m4a",
    speech: "d",
  },
  e: {
    symbol: "e",
    image: "/images/phonics/cards/e.png",
    audio: "/audio/phonics/e.m4a",
    speech: "e",
  },
  f: {
    symbol: "f",
    image: "/images/phonics/cards/f.png",
    audio: "/audio/phonics/f.m4a",
    speech: "f",
  },
  g: {
    symbol: "g",
    image: "/images/phonics/cards/g.png",
    audio: "/audio/phonics/g.m4a",
    speech: "g",
  },
  h: {
    symbol: "h",
    image: "/images/phonics/cards/h.png",
    audio: "/audio/phonics/h.m4a",
    speech: "h",
  },
  i: {
    symbol: "i",
    image: "/images/phonics/cards/i.png",
    audio: "/audio/phonics/i.m4a",
    speech: "i",
  },
  j: {
    symbol: "j",
    image: "/images/phonics/cards/j.png",
    audio: "/audio/phonics/j.m4a",
    speech: "j",
  },
  k: {
    symbol: "k",
    image: "/images/phonics/cards/k.png",
    audio: "/audio/phonics/c_k_q.m4a",
    speech: "k",
  },
  l: {
    symbol: "l",
    image: "/images/phonics/cards/l.png",
    audio: "/audio/phonics/l.m4a",
    speech: "l",
  },
  m: {
    symbol: "m",
    image: "/images/phonics/cards/m.png",
    audio: "/audio/phonics/m.m4a",
    speech: "m",
  },
  n: {
    symbol: "n",
    image: "/images/phonics/cards/n.png",
    audio: "/audio/phonics/n.m4a",
    speech: "n",
  },
  o: {
    symbol: "o",
    image: "/images/phonics/cards/o.png",
    audio: "/audio/phonics/o.m4a",
    speech: "aw",
  },
  p: {
    symbol: "p",
    image: "/images/phonics/cards/p.png",
    audio: "/audio/phonics/p.m4a",
    speech: "p",
  },
  q: {
    symbol: "q",
    image: "/images/phonics/cards/q.png",
    audio: "/audio/phonics/c_k_q.m4a",
    speech: "k",
  },
  r: {
    symbol: "r",
    image: "/images/phonics/cards/r.png",
    audio: "/audio/phonics/r.m4a",
    speech: "r",
  },
  s: {
    symbol: "s",
    image: "/images/phonics/cards/s.png",
    audio: "/audio/phonics/s.m4a",
    speech: "s",
  },
  sh: {
    symbol: "sh",
    image: "/images/phonics/cards/sh.png",
    audio: "/audio/phonics/sh.m4a",
    speech: "sh",
  },
  t: {
    symbol: "t",
    image: "/images/phonics/cards/t.png",
    audio: "/audio/phonics/t.m4a",
    speech: "t",
  },
  u: {
    symbol: "u",
    image: "/images/phonics/cards/u.png",
    audio: "/audio/phonics/u.m4a",
    speech: "uh",
  },
  v: {
    symbol: "v",
    image: "/images/phonics/cards/v.png",
    audio: "/audio/phonics/v.m4a",
    speech: "v",
  },
  w: {
    symbol: "w",
    image: "/images/phonics/cards/w.png",
    audio: "/audio/phonics/w.m4a",
    speech: "w",
  },
  x: {
    symbol: "x",
    image: "/images/phonics/cards/x.png",
    audio: "/audio/phonics/x.m4a",
    speech: "x",
  },
  y: {
    symbol: "y",
    image: "/images/phonics/cards/y.png",
    audio: "/audio/phonics/y.m4a",
    speech: "y",
  },
  z: {
    symbol: "z",
    image: "/images/phonics/cards/z.png",
    audio: "/audio/phonics/z.m4a",
    speech: "z",
  },
};

const BASIC_EXCLUDED_SOUNDS: SoundId[] = ["j", "q", "sh", "v", "w", "x", "y", "z"];
const BASIC_PATTERN_POOL: SoundId[] = SOUND_IDS.filter((sound) => !BASIC_EXCLUDED_SOUNDS.includes(sound));
const RHYTHM_SHAPES = [
  [0, 1, 2, 0, 1, 2],
  [0, 0, 1, 0, 0, 1],
  [0, 1, 1, 0, 1, 1],
] as const;

const MAZE_TEMPLATES: MazeTemplate[] = [
  {
    id: "basic",
    label: "basic",
    pattern: ["m", "m", "i"],
    patternPool: BASIC_PATTERN_POOL,
    rows: 3,
    cols: 4,
    solutionPath: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
    ],
    start: { row: 0, col: 0 },
    goal: { row: 2, col: 3 },
    color: "#2bb8a8",
  },
  {
    id: "advanced",
    label: "advanced",
    pattern: ["sh", "a", "p"],
    rows: 3,
    cols: 5,
    solutionPath: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
      { row: 1, col: 4 },
    ],
    start: { row: 0, col: 0 },
    goal: { row: 1, col: 4 },
    color: "#ff9f43",
  },
  {
    id: "super",
    label: "super!",
    pattern: ["f", "a", "j"],
    rows: 5,
    cols: 5,
    solutionPath: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 2 },
    color: "#e95f8b",
  },
];

const RHYTHM_PLAYBACK_RATE = 1.18;
const RHYTHM_SOUND_WINDOW_MS = 1320;
const RHYTHM_SOUND_GAP_MS = 35;
const RHYTHM_FIRST_SOUND_LEAD_IN_MS = 140;
const RHYTHM_FIRST_SOUND_WINDOW_MS = 1520;
const RHYTHM_AUDIO_READY_TIMEOUT_MS = 260;
const AUDIO_READY_STATE_CURRENT_DATA = 2;

const sameCoord = (a: Coord, b: Coord): boolean => a.row === b.row && a.col === b.col;

const coordKey = (coord: Coord): string => `${coord.row}:${coord.col}`;

const isNeighbor = (a: Coord, b: Coord): boolean => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

const makeSeed = (): number => Math.floor(Date.now() + Math.random() * 100000);

const createRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const shuffleWithRng = <T,>(items: T[], rng: () => number): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const uniqueSounds = (sounds: SoundId[]): SoundId[] => sounds.filter((sound, index) => sounds.indexOf(sound) === index);

const pickPattern = (template: MazeTemplate, rng: () => number): SoundId[] => {
  const patternSize = template.pattern.length;

  if (!template.patternPool) {
    return shuffleWithRng(template.pattern, rng);
  }

  const shuffledPool = shuffleWithRng(uniqueSounds(template.patternPool), rng);

  if (shuffledPool.length >= patternSize) {
    return shuffledPool.slice(0, patternSize);
  }

  return Array.from({ length: patternSize }, (_, index) => shuffledPool[index % shuffledPool.length] ?? template.pattern[index]);
};

const makeTarget = (template: MazeTemplate, pattern: SoundId[], rng: () => number): SoundId[] => {
  const shape = RHYTHM_SHAPES[Math.floor(rng() * RHYTHM_SHAPES.length)];

  return Array.from({ length: template.solutionPath.length }, (_, index) => {
    const shapeIndex = shape[index % shape.length];
    return pattern[shapeIndex] ?? pattern[index % pattern.length];
  });
};

const makeMazeLevel = (template: MazeTemplate, seed: number): MazeLevel => {
  const rng = createRng(seed);
  const pattern = pickPattern(template, rng);
  const target = makeTarget(template, pattern, rng);
  const soundPool = uniqueSounds(target);
  const grid = Array.from({ length: template.rows }, () =>
    Array.from({ length: template.cols }, () => soundPool[Math.floor(rng() * soundPool.length)]),
  );

  template.solutionPath.forEach((coord, index) => {
    grid[coord.row][coord.col] = target[index];
  });

  return {
    ...template,
    pattern,
    target,
    grid,
    seed,
  };
};

const wait = (duration: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, duration));

const pathToSounds = (level: MazeLevel, path: Coord[]): SoundId[] => path.map((coord) => level.grid[coord.row][coord.col]);

const soundsMatch = (left: SoundId[], right: SoundId[]): boolean =>
  left.length === right.length && left.every((sound, index) => sound === right[index]);

const rhythmText = (sounds: SoundId[]): string => sounds.map((sound) => SOUND_RESOURCES[sound].symbol).join(" ");

const speakFallback = (text: string): Promise<void> =>
  new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      setTimeout(resolve, 360);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.7;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
    setTimeout(resolve, 1100);
  });

const waitForAudioReady = (audio: HTMLAudioElement): Promise<void> =>
  new Promise((resolve) => {
    if (audio.readyState >= AUDIO_READY_STATE_CURRENT_DATA) {
      resolve();
      return;
    }

    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    audio.addEventListener("loadeddata", finish, { once: true });
    audio.addEventListener("canplaythrough", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    audio.load();
    setTimeout(finish, RHYTHM_AUDIO_READY_TIMEOUT_MS);
  });

type PlaySoundOptions = {
  maxDuration?: number;
  waitUntilReady?: boolean;
};

const playSound = async (sound: SoundId, options: PlaySoundOptions = {}): Promise<void> => {
  const resource = SOUND_RESOURCES[sound];
  const audio = new Audio(resource.audio);
  audio.preload = "auto";
  audio.playbackRate = RHYTHM_PLAYBACK_RATE;

  if (options.waitUntilReady) {
    await waitForAudioReady(audio);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      audio.pause();
      audio.currentTime = 0;
      resolve();
    };

    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener(
      "error",
      () => {
        void speakFallback(resource.speech).then(finish);
      },
      { once: true },
    );

    audio.currentTime = 0;
    audio.play().catch(() => {
      void speakFallback(resource.speech).then(finish);
    });

    setTimeout(finish, options.maxDuration ?? RHYTHM_SOUND_WINDOW_MS);
  });
};

const PatternTile = ({ sound }: { sound: SoundId }) => {
  const resource = SOUND_RESOURCES[sound];

  return (
    <span className={styles.patternTile}>
      {resource.image ? (
        <Image src={resource.image} alt="" width={120} height={88} className={styles.patternImage} />
      ) : (
        <span className={styles.patternText}>{resource.symbol}</span>
      )}
    </span>
  );
};

export default function PhonicsMazePage() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [level, setLevel] = useState<MazeLevel>(() => makeMazeLevel(MAZE_TEMPLATES[0], 1));
  const [path, setPath] = useState<Coord[]>([MAZE_TEMPLATES[0].start]);
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [spokenIndex, setSpokenIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("Start のとなりをタップ");

  const rows = level.grid.length;
  const cols = level.grid[0].length;
  const pathKeys = useMemo(() => new Set(path.map(coordKey)), [path]);
  const activeCoord = path[path.length - 1];
  const chosenSounds = pathToSounds(level, path);
  const chosenText = rhythmText(chosenSounds);
  const targetText = rhythmText(level.target);
  const isResolving = verdict === "playing";

  const baseEdges = useMemo(() => {
    const edges: { from: Coord; to: Coord; key: string }[] = [];

    level.grid.forEach((row, rowIndex) => {
      row.forEach((_, colIndex) => {
        if (colIndex < row.length - 1) {
          edges.push({
            from: { row: rowIndex, col: colIndex },
            to: { row: rowIndex, col: colIndex + 1 },
            key: `${rowIndex}:${colIndex}-right`,
          });
        }
        if (rowIndex < level.grid.length - 1) {
          edges.push({
            from: { row: rowIndex, col: colIndex },
            to: { row: rowIndex + 1, col: colIndex },
            key: `${rowIndex}:${colIndex}-down`,
          });
        }
      });
    });

    return edges;
  }, [level]);

  const activeEdges = useMemo(
    () =>
      path.slice(1).map((coord, index) => ({
        from: path[index],
        to: coord,
        key: `${coordKey(path[index])}-${coordKey(coord)}`,
      })),
    [path],
  );

  const resetPath = (nextLevel = level) => {
    setPath([nextLevel.start]);
    setVerdict("idle");
    setSpokenIndex(null);
    setMessage("Start のとなりをタップ");
  };

  const resetLevel = (nextIndex = levelIndex, seed = makeSeed()) => {
    const nextLevel = makeMazeLevel(MAZE_TEMPLATES[nextIndex], seed);
    setLevelIndex(nextIndex);
    setLevel(nextLevel);
    resetPath(nextLevel);
  };

  const finishPath = async (nextPath: Coord[]) => {
    const sounds = pathToSounds(level, nextPath);
    setVerdict("playing");
    setSpokenIndex(null);
    setMessage("いま通ったリズムをきいてみよう");
    window.speechSynthesis?.cancel();

    for (let index = 0; index < sounds.length; index += 1) {
      setSpokenIndex(index);
      if (index === 0) {
        await wait(RHYTHM_FIRST_SOUND_LEAD_IN_MS);
      }
      await playSound(sounds[index], {
        maxDuration: index === 0 ? RHYTHM_FIRST_SOUND_WINDOW_MS : RHYTHM_SOUND_WINDOW_MS,
        waitUntilReady: index === 0,
      });
      await wait(RHYTHM_SOUND_GAP_MS);
    }

    setSpokenIndex(null);

    if (soundsMatch(sounds, level.target)) {
      setVerdict("correct");
      setMessage("ぴったり。ゴールまで光ったね");
      return;
    }

    setVerdict("tryAgain");
    setMessage("いまのリズムもおもしろい。もう一回いけるよ");
  };

  const handleNodeTap = (coord: Coord) => {
    if (isResolving) return;

    if (verdict === "correct" || verdict === "tryAgain") {
      resetPath();
      return;
    }

    if (!activeCoord) {
      setPath([coord]);
      return;
    }

    if (pathKeys.has(coordKey(coord))) {
      if (sameCoord(coord, activeCoord)) return;

      const rewindIndex = path.findIndex((item) => sameCoord(item, coord));
      setPath(path.slice(0, rewindIndex + 1));
      setMessage("そこまで戻ったよ");
      return;
    }

    if (!isNeighbor(activeCoord, coord)) {
      setMessage("となりの丸をつなごう");
      return;
    }

    const nextPath = [...path, coord];
    setPath(nextPath);
    setMessage(`${SOUND_RESOURCES[level.grid[coord.row][coord.col]].symbol} につながった`);

    if (sameCoord(coord, level.goal)) {
      void finishPath(nextPath);
    }
  };

  const undoPath = () => {
    if (isResolving || path.length <= 1) return;
    setPath((current) => current.slice(0, -1));
    setVerdict("idle");
    setSpokenIndex(null);
    setMessage("ひとつ戻したよ");
  };

  const nextLevel = () => {
    resetLevel(levelIndex);
  };

  return (
    <main className={styles.page} style={{ "--level-color": level.color } as React.CSSProperties}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Phonics Maze</p>
          <h1>フォニックスめいろ</h1>
        </div>
        <Link className={styles.portalLink} href="/">
          Portal
        </Link>
      </header>

      <section className={styles.levelTabs} aria-label="めいろ">
        {MAZE_TEMPLATES.map((mazeLevel, index) => (
          <button
            key={mazeLevel.id}
            className={index === levelIndex ? styles.levelTabActive : styles.levelTab}
            onClick={() => resetLevel(index)}
            type="button"
          >
            {mazeLevel.label}
          </button>
        ))}
      </section>

      <section className={styles.rhythmBand} aria-label="おてほん">
        <div className={styles.patternRow}>
          {level.target.map((sound, index) => (
            <span key={`${sound}-${index}`} className={styles.patternStep}>
              <PatternTile sound={sound} />
              {index < level.target.length - 1 && <span className={styles.patternArrow}>→</span>}
            </span>
          ))}
        </div>
        <div className={styles.sayBurst}>
          {"Let's say "}
          <span>{`"${targetText}!"`}</span>
        </div>
      </section>

      <section className={styles.playArea}>
        <div className={styles.statusPanel}>
          <div>
            <p className={styles.statusLabel}>いまの道</p>
            <p className={styles.rhythmText}>{chosenText}</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.iconButton} onClick={undoPath} disabled={isResolving || path.length <= 1} type="button">
              ↶
            </button>
            <button className={styles.textButton} onClick={() => resetPath()} disabled={isResolving} type="button">
              けす
            </button>
            <button className={styles.textButton} onClick={nextLevel} disabled={isResolving} type="button">
              つぎ
            </button>
          </div>
        </div>

        <div
          className={styles.mazeBoard}
          style={
            {
              "--rows": rows,
              "--cols": cols,
              "--maze-ratio": `${cols} / ${rows}`,
            } as React.CSSProperties
          }
        >
          <svg className={styles.edgeLayer} viewBox={`-0.5 -0.5 ${cols} ${rows}`} preserveAspectRatio="none" aria-hidden="true">
            {baseEdges.map((edge) => (
              <line
                key={edge.key}
                className={styles.baseEdge}
                x1={edge.from.col}
                y1={edge.from.row}
                x2={edge.to.col}
                y2={edge.to.row}
              />
            ))}
            {activeEdges.map((edge) => (
              <line
                key={edge.key}
                className={styles.activeEdge}
                x1={edge.from.col}
                y1={edge.from.row}
                x2={edge.to.col}
                y2={edge.to.row}
              />
            ))}
          </svg>

          <div className={styles.nodeLayer}>
            {level.grid.map((row, rowIndex) =>
              row.map((sound, colIndex) => {
                const coord = { row: rowIndex, col: colIndex };
                const key = coordKey(coord);
                const visitedIndex = path.findIndex((item) => sameCoord(item, coord));
                const visited = visitedIndex >= 0;
                const isCurrent = activeCoord && sameCoord(activeCoord, coord);
                const isStart = sameCoord(level.start, coord);
                const isGoal = sameCoord(level.goal, coord);
                const isSpeaking = spokenIndex === visitedIndex;

                return (
                  <button
                    key={key}
                    className={[
                      styles.mazeNode,
                      visited ? styles.mazeNodeVisited : "",
                      isCurrent ? styles.mazeNodeCurrent : "",
                      isStart ? styles.mazeNodeStart : "",
                      isGoal ? styles.mazeNodeGoal : "",
                      isSpeaking ? styles.mazeNodeSpeaking : "",
                    ].join(" ")}
                    onClick={() => handleNodeTap(coord)}
                    style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 1 }}
                    type="button"
                    data-testid={`maze-node-${rowIndex}-${colIndex}`}
                    aria-label={`${SOUND_RESOURCES[sound].symbol} ${isStart ? "Start" : ""} ${isGoal ? "Goal" : ""}`}
                  >
                    {SOUND_RESOURCES[sound].symbol}
                  </button>
                );
              }),
            )}
          </div>

          <span
            className={styles.startFlag}
            style={{ gridRow: level.start.row + 1, gridColumn: level.start.col + 1 }}
            aria-hidden="true"
          >
            Start
          </span>
          <span className={styles.goalFlag} style={{ gridRow: level.goal.row + 1, gridColumn: level.goal.col + 1 }} aria-hidden="true">
            ⚑ Goal
          </span>
        </div>

        <div className={`${styles.feedback} ${styles[verdict]}`}>
          <span>{message}</span>
          {verdict === "playing" && <strong>♪ {spokenIndex !== null ? SOUND_RESOURCES[chosenSounds[spokenIndex]].symbol : ""}</strong>}
          {verdict === "correct" && <strong>◎</strong>}
          {verdict === "tryAgain" && <strong>?</strong>}
        </div>
      </section>
    </main>
  );
}
