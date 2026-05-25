"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

type SoundId = "m" | "i" | "sh" | "a" | "p" | "f" | "j";
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

type MazeLevel = {
  id: string;
  label: string;
  target: SoundId[];
  grid: SoundId[][];
  start: Coord;
  goal: Coord;
  color: string;
};

const SOUND_RESOURCES: Record<SoundId, SoundResource> = {
  m: {
    symbol: "m",
    image: "/images/phonics/cards/m.png",
    audio: "/audio/phonics/m.m4a",
    speech: "m",
  },
  i: {
    symbol: "i",
    image: "/images/phonics/cards/i.png",
    audio: "/audio/phonics/i.m4a",
    speech: "i",
  },
  sh: {
    symbol: "sh",
    audio: "/audio/phonics/sh.m4a",
    speech: "sh",
  },
  a: {
    symbol: "a",
    image: "/images/phonics/cards/a.png",
    audio: "/audio/phonics/a.m4a",
    speech: "ah",
  },
  p: {
    symbol: "p",
    image: "/images/phonics/cards/p.png",
    audio: "/audio/phonics/p.m4a",
    speech: "p",
  },
  f: {
    symbol: "f",
    image: "/images/phonics/cards/f.png",
    audio: "/audio/phonics/f.m4a",
    speech: "f",
  },
  j: {
    symbol: "j",
    image: "/images/phonics/cards/j.png",
    audio: "/audio/phonics/j.m4a",
    speech: "j",
  },
};

const MAZE_LEVELS: MazeLevel[] = [
  {
    id: "mmi",
    label: "m m i",
    target: ["m", "m", "i", "m", "m", "i"],
    grid: [
      ["m", "m", "i", "m"],
      ["i", "m", "i", "m"],
      ["m", "i", "m", "i"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 2, col: 3 },
    color: "#2bb8a8",
  },
  {
    id: "shap",
    label: "sh a p",
    target: ["sh", "a", "p", "sh", "a", "p"],
    grid: [
      ["sh", "a", "p", "sh", "a"],
      ["a", "p", "sh", "a", "p"],
      ["p", "sh", "p", "a", "p"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 1, col: 4 },
    color: "#ff9f43",
  },
  {
    id: "faj",
    label: "f a j",
    target: ["f", "a", "j", "f", "a", "j"],
    grid: [
      ["f", "a", "j", "f", "f"],
      ["a", "f", "f", "j", "a"],
      ["j", "a", "a", "f", "a"],
      ["f", "a", "j", "a", "j"],
      ["f", "f", "f", "a", "j"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 2 },
    color: "#e95f8b",
  },
];

const sameCoord = (a: Coord, b: Coord): boolean => a.row === b.row && a.col === b.col;

const coordKey = (coord: Coord): string => `${coord.row}:${coord.col}`;

const isNeighbor = (a: Coord, b: Coord): boolean => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

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

const playSound = (sound: SoundId): Promise<void> => {
  const resource = SOUND_RESOURCES[sound];

  return new Promise((resolve) => {
    const audio = new Audio(resource.audio);
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
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

    audio.play().catch(() => {
      void speakFallback(resource.speech).then(finish);
    });

    setTimeout(finish, 1700);
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
  const [path, setPath] = useState<Coord[]>([MAZE_LEVELS[0].start]);
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [spokenIndex, setSpokenIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("Start のとなりをタップ");

  const level = MAZE_LEVELS[levelIndex];
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

  const resetLevel = (nextIndex = levelIndex) => {
    const nextLevel = MAZE_LEVELS[nextIndex];
    setLevelIndex(nextIndex);
    setPath([nextLevel.start]);
    setVerdict("idle");
    setSpokenIndex(null);
    setMessage("Start のとなりをタップ");
  };

  const finishPath = async (nextPath: Coord[]) => {
    const sounds = pathToSounds(level, nextPath);
    setVerdict("playing");
    setSpokenIndex(null);
    setMessage("いま通ったリズムをきいてみよう");
    window.speechSynthesis?.cancel();

    for (let index = 0; index < sounds.length; index += 1) {
      setSpokenIndex(index);
      await playSound(sounds[index]);
      await wait(90);
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
      resetLevel();
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
    resetLevel((levelIndex + 1) % MAZE_LEVELS.length);
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
        {MAZE_LEVELS.map((mazeLevel, index) => (
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
            <button className={styles.textButton} onClick={() => resetLevel()} disabled={isResolving} type="button">
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
