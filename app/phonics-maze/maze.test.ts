import { describe, expect, it } from "vitest";

import { isNeighbor, MAZE_TEMPLATES, makeMazeLevel, pathToSounds, sameCoord, soundsMatch, SOUND_RESOURCES } from "./maze";

describe("Phonics Maze", () => {
  for (const template of MAZE_TEMPLATES) {
    describe(template.label, () => {
      it("has a connected solution path from start to goal inside the grid", () => {
        const path = template.solutionPath;
        expect(sameCoord(path[0], template.start)).toBe(true);
        expect(sameCoord(path[path.length - 1], template.goal)).toBe(true);
        for (let i = 1; i < path.length; i += 1) expect(isNeighbor(path[i - 1], path[i])).toBe(true);
        for (const c of path) {
          expect(c.row).toBeGreaterThanOrEqual(0);
          expect(c.row).toBeLessThan(template.rows);
          expect(c.col).toBeGreaterThanOrEqual(0);
          expect(c.col).toBeLessThan(template.cols);
        }
        expect(new Set(path.map((c) => `${c.row}:${c.col}`)).size).toBe(path.length);
      });

      it("always spells the target along the solution path", () => {
        for (let seed = 1; seed <= 50; seed += 1) {
          const level = makeMazeLevel(template, seed);
          expect(soundsMatch(pathToSounds(level, template.solutionPath), level.target)).toBe(true);
          for (const row of level.grid) for (const sound of row) expect(SOUND_RESOURCES[sound]).toBeDefined();
        }
      });

      it("is deterministic for a seed", () => {
        expect(makeMazeLevel(template, 7)).toEqual(makeMazeLevel(template, 7));
      });
    });
  }
});
