import type {
  ContributionGridData,
  GridPosition,
  TraversalMode,
} from "../types/contribution";

const getPositionKey = (position: GridPosition): string =>
  `${position.row}-${position.col}`;

const manhattanDistance = (from: GridPosition, to: GridPosition): number =>
  Math.abs(from.row - to.row) + Math.abs(from.col - to.col);

const appendManhattanPath = (
  path: GridPosition[],
  from: GridPosition,
  to: GridPosition,
): void => {
  let current = { ...from };

  while (current.col !== to.col) {
    current = {
      row: current.row,
      col: current.col + (to.col > current.col ? 1 : -1),
    };
    path.push(current);
  }

  while (current.row !== to.row) {
    current = {
      row: current.row + (to.row > current.row ? 1 : -1),
      col: current.col,
    };
    path.push(current);
  }
};

const createNearestPath = (
  rows: number,
  columns: number,
  grid?: ContributionGridData,
): GridPosition[] => {
  const start = { row: 0, col: 0 };

  if (!grid) {
    return createTraversalPath(rows, columns, "snake");
  }

  const remainingTargets = grid
    .flatMap((row, rowIndex) =>
      row.map((level, colIndex) => ({
        level,
        position: { row: rowIndex, col: colIndex },
      })),
    )
    .filter((item) => item.level > 0)
    .map((item) => item.position);

  const path: GridPosition[] = [start];
  let current = start;

  while (remainingTargets.length > 0) {
    remainingTargets.sort((first, second) => {
      const distanceDelta =
        manhattanDistance(current, first) - manhattanDistance(current, second);

      if (distanceDelta !== 0) {
        return distanceDelta;
      }

      if (first.col !== second.col) {
        return first.col - second.col;
      }

      return first.row - second.row;
    });

    const nextTarget = remainingTargets.shift();

    if (!nextTarget) {
      break;
    }

    const segment: GridPosition[] = [];
    appendManhattanPath(segment, current, nextTarget);

    for (const position of segment) {
      const key = getPositionKey(position);

      if (key !== getPositionKey(path[path.length - 1])) {
        path.push(position);
      }
    }

    current = nextTarget;
  }

  return path;
};

export const createTraversalPath = (
  rows: number,
  columns: number,
  mode: TraversalMode = "snake",
  randomSeed = 0,
  grid?: ContributionGridData,
): GridPosition[] => {
  const path: GridPosition[] = [];

  if (mode === "nearest") {
    return createNearestPath(rows, columns, grid);
  }

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
