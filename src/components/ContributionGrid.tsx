import { ContributionCell } from "./ContributionCell";
import type { ContributionGridData } from "../types/contribution";
import {
  CELL_GAP,
  CELL_SIZE,
  getGridHeight,
  getGridWidth,
} from "../utils/contribution";

type ContributionGridProps = {
  grid: ContributionGridData;
};

export function ContributionGrid({ grid }: ContributionGridProps) {
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;

  return (
    <div
      className="contribution-grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, ${CELL_SIZE}px)`,
        gap: CELL_GAP,
        width: getGridWidth(columns),
        height: getGridHeight(rows),
      }}
    >
      {grid.map((row, rowIndex) =>
        row.map((level, colIndex) => (
          <ContributionCell
            key={`${rowIndex}-${colIndex}`}
            level={level}
          />
        )),
      )}
    </div>
  );
}
