"use client";

import Image from "next/image";
import AppHeader from "@/app/components/AppHeader";
import ResultDialog from "@/app/components/ResultDialog";
import RewardSummary from "@/app/components/RewardSummary";
import { recordStars, starsFromMistakes, type RecordResult } from "@/app/lib/rewards";
import { useMemo, useState } from "react";
import { applySpeechSpeed } from "@/utils/speak";
import styles from "./page.module.css";
import {
  type SoundId,
  type Coord,
  type MazeLevel,
  SOUND_RESOURCES,
  MAZE_TEMPLATES,
  sameCoord,
  coordKey,
  isNeighbor,
  makeSeed,
  makeMazeLevel,
  pathToSounds,
  soundsMatch,
  rhythmText,
} from "./maze";

type Verdict = "idle" | "playing" | "correct" | "tryAgain";

const RHYTHM_PLAYBACK_RATE = 1.18;
const RHYTHM_SOUND_WINDOW_MS = 1320;
const RHYTHM_SOUND_GAP_MS = 35;
const RHYTHM_FIRST_SOUND_LEAD_IN_MS = 140;
const RHYTHM_FIRST_SOUND_WINDOW_MS = 1520;
const RHYTHM_AUDIO_READY_TIMEOUT_MS = 260;
const AUDIO_READY_STATE_CURRENT_DATA = 2;

const wait = (duration: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, duration));

const speakFallback = (text: string): Promise<void> =>
  new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      setTimeout(resolve, 360);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = applySpeechSpeed(0.7);
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
  /** この迷路で ゴールに ついたけど リズムが ちがった回数 */
  const [missedTries, setMissedTries] = useState(0);
  const [reward, setReward] = useState<RecordResult | null>(null);

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
    setMissedTries(0);
    setReward(null);
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
      // 1 回目で ぴったりなら ⭐3。めいろの しゅるいごとに ベストを のこす
      setReward(recordStars("maze", level.id, starsFromMistakes(missedTries, 1)));
      return;
    }

    setMissedTries((count) => count + 1);
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
      <AppHeader title="フォニックスめいろ" accent="var(--accent-maze)" />

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
      {verdict === "correct" && reward && (
        <ResultDialog
          title="ゴール!"
          actions={[
            { label: "つぎの めいろ", onClick: nextLevel },
            {
              label: "もういちど",
              variant: "secondary",
              onClick: () => {
                resetPath();
                setReward(null);
              },
            },
          ]}
        >
          <RewardSummary result={reward} />
        </ResultDialog>
      )}
    </main>
  );
}
