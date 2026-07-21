import type { GridPosition, TraversalMode } from "../types/contribution";

export const createTraversalPath = (
  rows: number,
  columns: number,
  mode: TraversalMode = "snake",
  randomSeed = 0,
): GridPosition[] => {
  const path: GridPosition[] = [];

  if (mode === "top-to-bottom") {
    for (let col = 0; col < columns; col += 1) {
      const isTopToBottom = col % 2 === 0;

      for (let step = 0; step < rows; step += 1) {
        const row = isTopToBottom ? step : rows - 1 - step;
        path.push({ row, col });
      }
    }

    return path;
  }

  for (let row = 0; row < rows; row += 1) {
    const isLeftToRight = row % 2 === 0;

    for (let step = 0; step < columns; step += 1) {
      const col = isLeftToRight ? step : columns - 1 - step;
      path.push({ row, col });
    }
  }

  if (mode === "random") {
    const shuffledPath = [...path];
    let seed = randomSeed + 1;

    for (let index = shuffledPath.length - 1; index > 0; index -= 1) {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      const targetIndex = seed % (index + 1);
      const currentItem = shuffledPath[index];
      shuffledPath[index] = shuffledPath[targetIndex];
      shuffledPath[targetIndex] = currentItem;
    }

    return shuffledPath;
  }

  return path;
};
