import type { ContributionLevel } from "../types/contribution";

type ContributionCellProps = {
  level: ContributionLevel;
};

export function ContributionCell({ level }: ContributionCellProps) {
  return (
    <div
      className={`contribution-cell contribution-cell--level-${level}`}
      aria-label={`Contribution level ${level}`}
    />
  );
}
