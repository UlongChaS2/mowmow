import type { AnimationSpeed, ContributionGridData } from "../types/contribution";

export const GRID_COLUMNS = 10;
export const GRID_ROWS = 5;
export const CELL_SIZE = 22;
export const CELL_GAP = 7;
export const CHARACTER_SIZE = 64;

export const SPEED_DELAYS: Record<AnimationSpeed, { move: number; eat: number }> = {
  slow: { move: 680, eat: 650 },
  normal: { move: 460, eat: 420 },
  fast: { move: 280, eat: 260 },
};

export const cloneContributionGrid = (
  grid: ContributionGridData,
): ContributionGridData => grid.map((row) => [...row]);

export const getGridWidth = (columns: number): number =>
  columns * CELL_SIZE + (columns - 1) * CELL_GAP;

export const getGridHeight = (rows: number): number =>
  rows * CELL_SIZE + (rows - 1) * CELL_GAP;
