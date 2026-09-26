/* 迷路の盤面づくりと答え合わせ(音の再生以外)。画面から切り離してテストできるようにしている */

import { createRng, shuffleWithRng } from "@/app/lib/random";

export const SOUND_IDS = [
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

export type SoundId = (typeof SOUND_IDS)[number];
export type Coord = {
  row: number;
  col: number;
};

export type SoundResource = {
  symbol: string;
  audio: string;
  speech: string;
  image?: string;
};

export type MazeTemplate = {
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

export type MazeLevel = MazeTemplate & {
  target: SoundId[];
  grid: SoundId[][];
  seed: number;
};

export const SOUND_RESOURCES: Record<SoundId, SoundResource> = {
  a: {
    symbol: "a",
    image: "/images/phonics/cards/a.webp",
    audio: "/audio/phonics/a.m4a",
    speech: "ah",
  },
  b: {
    symbol: "b",
    image: "/images/phonics/cards/b.webp",
    audio: "/audio/phonics/b.m4a",
    speech: "b",
  },
  c: {
    symbol: "c",
    image: "/images/phonics/cards/c.webp",
    audio: "/audio/phonics/c_k_q.m4a",
    speech: "k",
  },
  d: {
    symbol: "d",
    image: "/images/phonics/cards/d.webp",
    audio: "/audio/phonics/d.m4a",
    speech: "d",
  },
  e: {
    symbol: "e",
    image: "/images/phonics/cards/e.webp",
    audio: "/audio/phonics/e.m4a",
    speech: "e",
  },
  f: {
    symbol: "f",
    image: "/images/phonics/cards/f.webp",
    audio: "/audio/phonics/f.m4a",
    speech: "f",
  },
  g: {
    symbol: "g",
    image: "/images/phonics/cards/g.webp",
    audio: "/audio/phonics/g.m4a",
    speech: "g",
  },
  h: {
    symbol: "h",
    image: "/images/phonics/cards/h.webp",
    audio: "/audio/phonics/h.m4a",
    speech: "h",
  },
  i: {
    symbol: "i",
    image: "/images/phonics/cards/i.webp",
    audio: "/audio/phonics/i.m4a",
    speech: "i",
  },
  j: {
    symbol: "j",
    image: "/images/phonics/cards/j.webp",
    audio: "/audio/phonics/j.m4a",
    speech: "j",
  },
  k: {
    symbol: "k",
    image: "/images/phonics/cards/k.webp",
    audio: "/audio/phonics/c_k_q.m4a",
    speech: "k",
  },
  l: {
    symbol: "l",
    image: "/images/phonics/cards/l.webp",
    audio: "/audio/phonics/l.m4a",
    speech: "l",
  },
  m: {
    symbol: "m",
    image: "/images/phonics/cards/m.webp",
    audio: "/audio/phonics/m.m4a",
    speech: "m",
  },
  n: {
    symbol: "n",
    image: "/images/phonics/cards/n.webp",
    audio: "/audio/phonics/n.m4a",
    speech: "n",
  },
  o: {
    symbol: "o",
    image: "/images/phonics/cards/o.webp",
    audio: "/audio/phonics/o.m4a",
    speech: "aw",
  },
  p: {
    symbol: "p",
    image: "/images/phonics/cards/p.webp",
    audio: "/audio/phonics/p.m4a",
    speech: "p",
  },
  q: {
    symbol: "q",
    image: "/images/phonics/cards/q.webp",
    audio: "/audio/phonics/c_k_q.m4a",
    speech: "k",
  },
  r: {
    symbol: "r",
    image: "/images/phonics/cards/r.webp",
    audio: "/audio/phonics/r.m4a",
    speech: "r",
  },
  s: {
    symbol: "s",
    image: "/images/phonics/cards/s.webp",
    audio: "/audio/phonics/s.m4a",
    speech: "s",
  },
  sh: {
    symbol: "sh",
    image: "/images/phonics/cards/sh.webp",
    audio: "/audio/phonics/sh.m4a",
    speech: "sh",
  },
  t: {
    symbol: "t",
    image: "/images/phonics/cards/t.webp",
    audio: "/audio/phonics/t.m4a",
    speech: "t",
  },
  u: {
    symbol: "u",
    image: "/images/phonics/cards/u.webp",
    audio: "/audio/phonics/u.m4a",
    speech: "uh",
  },
  v: {
    symbol: "v",
    image: "/images/phonics/cards/v.webp",
    audio: "/audio/phonics/v.m4a",
    speech: "v",
  },
  w: {
    symbol: "w",
    image: "/images/phonics/cards/w.webp",
    audio: "/audio/phonics/w.m4a",
    speech: "w",
  },
  x: {
    symbol: "x",
    image: "/images/phonics/cards/x.webp",
    audio: "/audio/phonics/x.m4a",
    speech: "x",
  },
  y: {
    symbol: "y",
    image: "/images/phonics/cards/y.webp",
    audio: "/audio/phonics/y.m4a",
    speech: "y",
  },
  z: {
    symbol: "z",
    image: "/images/phonics/cards/z.webp",
    audio: "/audio/phonics/z.m4a",
    speech: "z",
  },
};

export const BASIC_EXCLUDED_SOUNDS: SoundId[] = ["j", "q", "sh", "v", "w", "x", "y", "z"];
export const BASIC_PATTERN_POOL: SoundId[] = SOUND_IDS.filter((sound) => !BASIC_EXCLUDED_SOUNDS.includes(sound));
export const RHYTHM_SHAPES = [
  [0, 1, 2, 0, 1, 2],
  [0, 0, 1, 0, 0, 1],
  [0, 1, 1, 0, 1, 1],
] as const;

export const MAZE_TEMPLATES: MazeTemplate[] = [
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

export const sameCoord = (a: Coord, b: Coord): boolean => a.row === b.row && a.col === b.col;

export const coordKey = (coord: Coord): string => `${coord.row}:${coord.col}`;

export const isNeighbor = (a: Coord, b: Coord): boolean => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

export const makeSeed = (): number => Math.floor(Date.now() + Math.random() * 100000);

export const uniqueSounds = (sounds: SoundId[]): SoundId[] => sounds.filter((sound, index) => sounds.indexOf(sound) === index);

export const pickPattern = (template: MazeTemplate, rng: () => number): SoundId[] => {
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

export const makeTarget = (template: MazeTemplate, pattern: SoundId[], rng: () => number): SoundId[] => {
  const shape = RHYTHM_SHAPES[Math.floor(rng() * RHYTHM_SHAPES.length)];

  return Array.from({ length: template.solutionPath.length }, (_, index) => {
    const shapeIndex = shape[index % shape.length];
    return pattern[shapeIndex] ?? pattern[index % pattern.length];
  });
};

export const makeMazeLevel = (template: MazeTemplate, seed: number): MazeLevel => {
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

export const pathToSounds = (level: MazeLevel, path: Coord[]): SoundId[] => path.map((coord) => level.grid[coord.row][coord.col]);

export const soundsMatch = (left: SoundId[], right: SoundId[]): boolean =>
  left.length === right.length && left.every((sound, index) => sound === right[index]);

export const rhythmText = (sounds: SoundId[]): string => sounds.map((sound) => SOUND_RESOURCES[sound].symbol).join(" ");
