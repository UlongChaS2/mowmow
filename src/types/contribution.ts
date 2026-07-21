export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type ContributionGridData = ContributionLevel[][];

export type GridPosition = {
  row: number;
  col: number;
};

export type CharacterState =
  | "idle"
  | "walking-left"
  | "walking-right"
  | "walking-up"
  | "walking-down"
  | "eating"
  | "finished";

export type CharacterDirection = "front" | "left" | "right" | "back";

export type AnimationSpeed = "slow" | "normal" | "fast";

export type AnimationPhase = "move" | "eat";

export type TraversalMode = "snake" | "top-to-bottom" | "random";
