import type {
  ContributionGridData,
  ContributionLevel,
  CharacterDirection,
  GridPosition,
  TraversalMode,
} from "../types/contribution";
import { createTraversalPath } from "../utils/createTraversalPath";
import { CELL_GAP, CELL_SIZE, CHARACTER_SIZE } from "../utils/contribution";

type GenerateContributionPetSvgOptions = {
  grid: ContributionGridData;
  characterDataUris: Record<CharacterDirection, string>;
  title?: string;
  frameDelayMs?: number;
  eatDelayMs?: number;
  traversalMode?: TraversalMode;
};

type TimelineFrame = {
  elapsedMs: number;
  headIndex: number;
  direction: CharacterDirection;
  isEating: boolean;
};

const CONTRIBUTION_COLORS: Record<ContributionLevel, string> = {
  0: "#ebedf0",
  1: "#9be9a8",
  2: "#40c463",
  3: "#30a14e",
  4: "#216e39",
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getCellCenter = (position: GridPosition): { x: number; y: number } => ({
  x: position.col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
  y: position.row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
});

const getAnimationPoint = (position: GridPosition): string => {
  const center = getCellCenter(position);
  return `${center.x},${center.y - CHARACTER_SIZE / 2 + 10}`;
};

const getDirection = (
  current: GridPosition,
  next: GridPosition,
): CharacterDirection => {
  if (next.row < current.row) {
    return "back";
  }

  if (next.row > current.row) {
    return "front";
  }

  if (next.col < current.col) {
    return "left";
  }

  return "right";
};

const toKeyTime = (elapsedMs: number, totalDurationMs: number): string => {
  if (totalDurationMs === 0) {
    return "0";
  }

  return (elapsedMs / totalDurationMs).toFixed(4);
};

const createTimelineFrames = (
  path: GridPosition[],
  grid: ContributionGridData,
  frameDelayMs: number,
  eatDelayMs: number,
): TimelineFrame[] => {
  const initialDirection =
    path.length > 1 ? getDirection(path[0], path[1]) : "front";
  const frames: TimelineFrame[] = [
    {
      elapsedMs: 0,
      headIndex: 0,
      direction: initialDirection,
      isEating: false,
    },
  ];
  let elapsed = 0;
  let currentDirection = initialDirection;

  path.forEach((position, index) => {
    if (grid[position.row][position.col] > 0) {
      elapsed += eatDelayMs;
      frames.push({
        elapsedMs: elapsed,
        headIndex: index,
        direction: currentDirection,
        isEating: true,
      });
    }

    if (index < path.length - 1) {
      currentDirection = getDirection(position, path[index + 1]);
      elapsed += frameDelayMs;
      frames.push({
        elapsedMs: elapsed,
        headIndex: index + 1,
        direction: currentDirection,
        isEating: false,
      });
    }
  });

  return frames;
};

const createDirectionOpacityTimeline = (
  frames: TimelineFrame[],
  totalDuration: number,
  direction: CharacterDirection,
): { values: string; keyTimes: string } => ({
  values: frames
    .map((frame) => (frame.direction === direction ? "1" : "0"))
    .join(";"),
  keyTimes: frames
    .map((frame) => toKeyTime(frame.elapsedMs, totalDuration))
    .join(";"),
});

const createEatingOpacityTimeline = (
  frames: TimelineFrame[],
  totalDuration: number,
): { values: string; keyTimes: string } => ({
  values: frames.map((frame) => (frame.isEating ? "1" : "0")).join(";"),
  keyTimes: frames
    .map((frame) => toKeyTime(frame.elapsedMs, totalDuration))
    .join(";"),
});

const createMotionTimeline = (
  path: GridPosition[],
  frames: TimelineFrame[],
  totalDuration: number,
): { points: string; keyTimes: string } => {
  return {
    points: frames
      .map((frame) => getAnimationPoint(path[frame.headIndex]))
      .join(";"),
    keyTimes: frames
      .map((frame) => toKeyTime(frame.elapsedMs, totalDuration))
      .join(";"),
  };
};

const getEatKeyTimes = (
  path: GridPosition[],
  grid: ContributionGridData,
  frameDelayMs: number,
  eatDelayMs: number,
  totalDuration: number,
  position: GridPosition,
): string => {
  let elapsed = 0;

  for (const currentPosition of path) {
    if (
      currentPosition.row === position.row &&
      currentPosition.col === position.col
    ) {
      elapsed += eatDelayMs;
      return `0;${toKeyTime(elapsed, totalDuration)};1`;
    }

    if (grid[currentPosition.row][currentPosition.col] > 0) {
      elapsed += eatDelayMs;
    }

    elapsed += frameDelayMs;
  }

  return "0;1";
};

export const generateContributionPetSvg = ({
  grid,
  characterDataUris,
  title = "MowMow",
  frameDelayMs = 240,
  eatDelayMs = 380,
  traversalMode = "snake",
}: GenerateContributionPetSvgOptions): string => {
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;
  const path = createTraversalPath(rows, columns, traversalMode, 0, grid);
  const frames = createTimelineFrames(path, grid, frameDelayMs, eatDelayMs);
  const totalDuration = frames[frames.length - 1]?.elapsedMs ?? 1;
  const width = columns * CELL_SIZE + Math.max(0, columns - 1) * CELL_GAP + 48;
  const gridHeight = rows * CELL_SIZE + Math.max(0, rows - 1) * CELL_GAP;
  const height = gridHeight + 74;
  const motionTimeline = createMotionTimeline(
    path,
    frames,
    totalDuration,
  );
  const eatingTimeline = createEatingOpacityTimeline(frames, totalDuration);
  const durationSeconds = `${(totalDuration / 1000).toFixed(2)}s`;

  const cells = grid
    .flatMap((row, rowIndex) =>
      row.map((level, colIndex) => {
        const position = { row: rowIndex, col: colIndex };
        const x = colIndex * (CELL_SIZE + CELL_GAP);
        const y = rowIndex * (CELL_SIZE + CELL_GAP);
        const eatAnimation =
          level > 0
            ? `<animate attributeName="fill" values="${CONTRIBUTION_COLORS[level]};${CONTRIBUTION_COLORS[0]};${CONTRIBUTION_COLORS[0]}" keyTimes="${getEatKeyTimes(path, grid, frameDelayMs, eatDelayMs, totalDuration, position)}" dur="${durationSeconds}" repeatCount="indefinite" />`
            : "";

        return `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="5" fill="${CONTRIBUTION_COLORS[level]}">${eatAnimation}</rect>`;
      }),
    )
    .join("");
  const characterImages = (["front", "left", "right", "back"] as const)
    .map((direction) => {
      const opacityTimeline = createDirectionOpacityTimeline(
        frames,
        totalDuration,
        direction,
      );

      return `<image href="${characterDataUris[direction]}" width="${CHARACTER_SIZE}" height="${CHARACTER_SIZE}" x="${-CHARACTER_SIZE / 2}" y="${-CHARACTER_SIZE / 2}" preserveAspectRatio="xMidYMid meet" opacity="0" style="image-rendering:pixelated"><animate attributeName="opacity" values="${opacityTimeline.values}" keyTimes="${opacityTimeline.keyTimes}" dur="${durationSeconds}" repeatCount="indefinite" /></image>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">MowMow mows across a GitHub contribution grid and clears active cells.</desc>
  <rect width="${width}" height="${height}" rx="10" fill="#f8fbf5" />
  <g transform="translate(24 36)">
    ${cells}
    <g>
      <animateMotion dur="${durationSeconds}" repeatCount="indefinite" calcMode="linear" keyTimes="${motionTimeline.keyTimes}" values="${motionTimeline.points}" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;2 -1;-1 1;0 0" dur="0.52s" repeatCount="indefinite" additive="sum" />
        <animateTransform attributeName="transform" type="rotate" values="0;-1.2;0.8;0" dur="0.52s" repeatCount="indefinite" additive="sum" />
        ${characterImages}
        <g opacity="0">
          <animate attributeName="opacity" values="${eatingTimeline.values}" keyTimes="${eatingTimeline.keyTimes}" dur="${durationSeconds}" repeatCount="indefinite" />
          <circle cx="18" cy="15" r="2" fill="#2f8f45">
            <animateTransform attributeName="transform" type="translate" values="0 0;8 -3;16 -6" dur="0.52s" repeatCount="indefinite" />
          </circle>
          <circle cx="22" cy="22" r="1.6" fill="#56bd58">
            <animateTransform attributeName="transform" type="translate" values="0 0;10 1;18 -2" dur="0.52s" repeatCount="indefinite" />
          </circle>
          <circle cx="14" cy="24" r="1.8" fill="#176734">
            <animateTransform attributeName="transform" type="translate" values="0 0;7 3;15 1" dur="0.52s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </g>
  </g>
</svg>
`;
};
