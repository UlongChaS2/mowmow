import type {
  ContributionGridData,
  ContributionLevel,
  GridPosition,
  TraversalMode,
} from "../types/contribution";
import { createSeededRandom, type SeededRandom } from "./random";

const getPositionKey = (position: GridPosition): string =>
  `${position.row}-${position.col}`;

const manhattanDistance = (from: GridPosition, to: GridPosition): number =>
  Math.abs(from.row - to.row) + Math.abs(from.col - to.col);

type ContributionTarget = {
  level: ContributionLevel;
  position: GridPosition;
};

const toPosition = (key: string): GridPosition => {
  const [row, col] = key.split("-").map(Number);
  return { row, col };
};

const createTargetMap = (grid: ContributionGridData): Map<string, ContributionTarget> =>
  new Map(
    grid
      .flatMap((row, rowIndex) =>
        row.map((level, colIndex) => ({
          level,
          position: { row: rowIndex, col: colIndex },
        })),
      )
      .filter((item) => item.level > 0)
      .map((item) => [getPositionKey(item.position), item]),
  );

const appendManhattanPath = (
  path: GridPosition[],
  from: GridPosition,
  to: GridPosition,
  verticalFirst = false,
): void => {
  let current = { ...from };

  const appendHorizontalSteps = () => {
    while (current.col !== to.col) {
      current = {
        row: current.row,
        col: current.col + (to.col > current.col ? 1 : -1),
      };
      path.push(current);
    }
  };

  const appendVerticalSteps = () => {
    while (current.row !== to.row) {
      current = {
        row: current.row + (to.row > current.row ? 1 : -1),
        col: current.col,
      };
      path.push(current);
    }
  };

  if (verticalFirst) {
    appendVerticalSteps();
    appendHorizontalSteps();
    return;
  }

  appendHorizontalSteps();
  appendVerticalSteps();
};

const appendPathAndClearTargets = (
  path: GridPosition[],
  segment: GridPosition[],
  remainingTargets: Map<string, ContributionTarget>,
): void => {
  for (const position of segment) {
    const key = getPositionKey(position);

    if (key !== getPositionKey(path[path.length - 1])) {
      path.push(position);
    }

    remainingTargets.delete(key);
  }
};

const chooseWeightedRandomTarget = (
  remainingTargets: Map<string, ContributionTarget>,
  current: GridPosition,
  random: SeededRandom,
): GridPosition | null => {
  const weightedTargets = [...remainingTargets.values()].map((target) => {
    const distance = manhattanDistance(current, target.position);
    const levelWeight = 1 + target.level * 0.75;
    const distanceWeight = 1 / Math.pow(distance + 1, 1.45);

    return {
      position: target.position,
      weight: levelWeight * distanceWeight,
    };
  });
  const totalWeight = weightedTargets.reduce(
    (sum, target) => sum + target.weight,
    0,
  );
  let cursor = random() * totalWeight;

  for (const target of weightedTargets) {
    cursor -= target.weight;

    if (cursor <= 0) {
      return target.position;
    }
  }

  return weightedTargets[weightedTargets.length - 1]?.position ?? null;
};

const comparePositionsByNearest = (
  current: GridPosition,
  first: GridPosition,
  second: GridPosition,
): number => {
  const distanceDelta =
    manhattanDistance(current, first) - manhattanDistance(current, second);

  if (distanceDelta !== 0) {
    return distanceDelta;
  }

  if (first.col !== second.col) {
    return first.col - second.col;
  }

  return first.row - second.row;
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

  const remainingTargets = createTargetMap(grid);
  const path: GridPosition[] = [start];
  let current = start;

  while (remainingTargets.size > 0) {
    const sortedTargets = [...remainingTargets]
      .map(([key]) => toPosition(key))
      .sort((first, second) =>
        comparePositionsByNearest(current, first, second),
      );

    const nextTarget = sortedTargets[0];

    if (!nextTarget) {
      break;
    }

    const segment: GridPosition[] = [];
    appendManhattanPath(segment, current, nextTarget);
    appendPathAndClearTargets(path, segment, remainingTargets);

    current = nextTarget;
  }

  return path;
};

const createRandomTargetPath = (
  rows: number,
  columns: number,
  randomSeed: number,
  grid?: ContributionGridData,
): GridPosition[] => {
  const start = { row: 0, col: 0 };

  if (!grid) {
    return createTraversalPath(rows, columns, "snake");
  }

  const remainingTargets = createTargetMap(grid);
  const path: GridPosition[] = [start];
  let current = start;
  const random = createSeededRandom(randomSeed);

  while (remainingTargets.size > 0) {
    const nextTarget = chooseWeightedRandomTarget(
      remainingTargets,
      current,
      random,
    );

    if (!nextTarget) {
      break;
    }

    const segment: GridPosition[] = [];
    const verticalFirst = random() > 0.5;

    appendManhattanPath(segment, current, nextTarget, verticalFirst);
    appendPathAndClearTargets(path, segment, remainingTargets);

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

  if (mode === "random") {
    return createRandomTargetPath(rows, columns, randomSeed, grid);
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

  return path;
};
