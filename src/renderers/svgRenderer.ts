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
  randomSeed?: number;
};

type TimelineFrame = {
  elapsedMs: number;
  headIndex: number;
  direction: CharacterDirection;
  isEating: boolean;
};

const CHARACTER_RENDER_BOX: Record<
  CharacterDirection,
  { size: number; offsetX: number; offsetY: number }
> = {
  front: { size: CHARACTER_SIZE, offsetX: 0, offsetY: 0 },
  left: { size: CHARACTER_SIZE * 1.18, offsetX: -2, offsetY: -4 },
  right: { size: CHARACTER_SIZE * 1.18, offsetX: 2, offsetY: -4 },
  back: { size: CHARACTER_SIZE * 1.14, offsetX: 0, offsetY: -3 },
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

const getCellClearAnimation = (
  path: GridPosition[],
  grid: ContributionGridData,
  frameDelayMs: number,
  eatDelayMs: number,
  totalDuration: number,
  position: GridPosition,
  level: ContributionLevel,
): string => {
  let elapsed = 0;

  for (let index = 0; index < path.length; index += 1) {
    const currentPosition = path[index];

    if (
      currentPosition.row === position.row &&
      currentPosition.col === position.col
    ) {
      const clearStartMs = elapsed + eatDelayMs * 0.72;
      const clearEndMs = clearStartMs + 1;
      const keyTimes = [
        "0",
        toKeyTime(clearStartMs, totalDuration),
        toKeyTime(clearEndMs, totalDuration),
        "1",
      ].join(";");
      const values = [
        CONTRIBUTION_COLORS[level],
        CONTRIBUTION_COLORS[level],
        CONTRIBUTION_COLORS[0],
        CONTRIBUTION_COLORS[0],
      ].join(";");

      return `<animate attributeName="fill" values="${values}" keyTimes="${keyTimes}" dur="${(totalDuration / 1000).toFixed(2)}s" repeatCount="indefinite" />`;
    }

    if (grid[currentPosition.row][currentPosition.col] > 0) {
      elapsed += eatDelayMs;
    }

    if (index < path.length - 1) {
      elapsed += frameDelayMs;
    }
  }

  return "";
};

export const generateContributionPetSvg = ({
  grid,
  characterDataUris,
  title = "MowMow",
  frameDelayMs = 620,
  eatDelayMs = 620,
  traversalMode = "snake",
  randomSeed = 0,
}: GenerateContributionPetSvgOptions): string => {
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;
  const path = createTraversalPath(rows, columns, traversalMode, randomSeed, grid);
  const frames = createTimelineFrames(path, grid, frameDelayMs, eatDelayMs);
  const totalDuration = frames[frames.length - 1]?.elapsedMs ?? 1;
  const width = columns * CELL_SIZE + Math.max(0, columns - 1) * CELL_GAP + 48;
  const gridHeight = rows * CELL_SIZE + Math.max(0, rows - 1) * CELL_GAP;
  const topPadding = 70;
  const bottomPadding = 42;
  const height = gridHeight + topPadding + bottomPadding;
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
            ? getCellClearAnimation(
                path,
                grid,
                frameDelayMs,
                eatDelayMs,
                totalDuration,
                position,
                level,
              )
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
      const renderBox = CHARACTER_RENDER_BOX[direction];
      const imageX = -renderBox.size / 2 + renderBox.offsetX;
      const imageY = -renderBox.size / 2 + renderBox.offsetY;

      return `<image href="${characterDataUris[direction]}" width="${renderBox.size}" height="${renderBox.size}" x="${imageX}" y="${imageY}" preserveAspectRatio="xMidYMid meet" opacity="0" style="image-rendering:pixelated"><animate attributeName="opacity" values="${opacityTimeline.values}" keyTimes="${opacityTimeline.keyTimes}" dur="${durationSeconds}" repeatCount="indefinite" calcMode="discrete" /></image>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">MowMow mows across a GitHub contribution grid and clears active cells.</desc>
  <g transform="translate(24 ${topPadding})">
    ${cells}
    <g>
      <animateMotion dur="${durationSeconds}" repeatCount="indefinite" calcMode="linear" keyTimes="${motionTimeline.keyTimes}" values="${motionTimeline.points}" />
      <g>
        ${characterImages}
      </g>
    </g>
  </g>
</svg>
`;
};
