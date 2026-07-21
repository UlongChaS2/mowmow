import type {
  ContributionGridData,
  ContributionLevel,
  GridPosition,
  TraversalMode,
} from "../types/contribution";
import { createTraversalPath } from "../utils/createTraversalPath";
import { CELL_GAP, CELL_SIZE, CHARACTER_SIZE } from "../utils/contribution";

type GenerateContributionPetSvgOptions = {
  grid: ContributionGridData;
  characterDataUri: string;
  title?: string;
  frameDelayMs?: number;
  eatDelayMs?: number;
  traversalMode?: TraversalMode;
};

type TimelineFrame = {
  elapsedMs: number;
  headIndex: number;
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
  const frames: TimelineFrame[] = [{ elapsedMs: 0, headIndex: 0 }];
  let elapsed = 0;

  path.forEach((position, index) => {
    if (grid[position.row][position.col] > 0) {
      elapsed += eatDelayMs;
      frames.push({ elapsedMs: elapsed, headIndex: index });
    }

    if (index < path.length - 1) {
      elapsed += frameDelayMs;
      frames.push({
        elapsedMs: elapsed,
        headIndex: index + 1,
      });
    }
  });

  return frames;
};

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
  characterDataUri,
  title = "MowMow",
  frameDelayMs = 240,
  eatDelayMs = 380,
  traversalMode = "snake",
}: GenerateContributionPetSvgOptions): string => {
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;
  const path = createTraversalPath(rows, columns, traversalMode);
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">MowMow mows across a GitHub contribution grid and clears active cells.</desc>
  <rect width="${width}" height="${height}" rx="10" fill="#f8fbf5" />
  <g transform="translate(24 36)">
    ${cells}
    <image href="${characterDataUri}" width="${CHARACTER_SIZE}" height="${CHARACTER_SIZE}" x="${-CHARACTER_SIZE / 2}" y="${-CHARACTER_SIZE / 2}" preserveAspectRatio="xMidYMid meet">
      <animate attributeName="opacity" values="1;1;0.92;1" dur="0.9s" repeatCount="indefinite" />
      <animateMotion dur="${durationSeconds}" repeatCount="indefinite" calcMode="linear" keyTimes="${motionTimeline.keyTimes}" values="${motionTimeline.points}" />
    </image>
  </g>
</svg>
`;
};
