import { characterAssets } from "../config/characterAssets";
import type { CSSProperties } from "react";
import type {
  AnimationSpeed,
  CharacterDirection,
  CharacterState,
  GridPosition,
} from "../types/contribution";
import {
  CELL_GAP,
  CELL_SIZE,
  CHARACTER_SIZE,
  SPEED_DELAYS,
} from "../utils/contribution";

type CharacterProps = {
  position: GridPosition;
  state: CharacterState;
  direction: CharacterDirection;
  speed: AnimationSpeed;
};

const assetByDirection: Record<CharacterDirection, string> = {
  front: characterAssets.front,
  left: characterAssets.left,
  back: characterAssets.back,
  right: characterAssets.right,
};

const mowOffsetByDirection: Record<CharacterDirection, { x: number; y: number }> = {
  front: { x: 0, y: 3 },
  left: { x: -4, y: 0 },
  back: { x: 0, y: -3 },
  right: { x: 4, y: 0 },
};

type CharacterStyle = CSSProperties & {
  "--pet-x": string;
  "--pet-y": string;
  "--mow-x": string;
  "--mow-y": string;
  "--mow-mid-x": string;
  "--mow-mid-y": string;
  "--mow-back-x": string;
  "--mow-back-y": string;
  "--walk-duration": string;
};

export function Character({ position, state, direction, speed }: CharacterProps) {
  const x = position.col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const y = position.row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const mowOffset = mowOffsetByDirection[direction];
  const walkDuration = Math.max(SPEED_DELAYS[speed].move - 24, 120);
  const characterStyle: CharacterStyle = {
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
    "--pet-x": `${x - CHARACTER_SIZE / 2}px`,
    "--pet-y": `${y - CHARACTER_SIZE + 8}px`,
    "--mow-x": `${mowOffset.x}px`,
    "--mow-y": `${mowOffset.y}px`,
    "--mow-mid-x": `${mowOffset.x * 0.55}px`,
    "--mow-mid-y": `${mowOffset.y * 0.55}px`,
    "--mow-back-x": `${mowOffset.x * -0.35}px`,
    "--mow-back-y": `${mowOffset.y * -0.35}px`,
    "--walk-duration": `${walkDuration}ms`,
  };

  return (
    <div
      className={`character character--${state}`}
      role="img"
      aria-label="Contribution pet"
      style={characterStyle}
    >
      <img
        className="character-image"
        src={assetByDirection[direction]}
        alt=""
        aria-hidden="true"
      />
      <span className="mow-clippings" aria-hidden="true" />
    </div>
  );
}
