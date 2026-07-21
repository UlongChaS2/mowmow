import type { AnimationSpeed, TraversalMode } from "../types/contribution";

type ControlsProps = {
  isPlaying: boolean;
  speed: AnimationSpeed;
  traversalMode: TraversalMode;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: AnimationSpeed) => void;
  onTraversalModeChange: (mode: TraversalMode) => void;
};

const speedOptions: AnimationSpeed[] = ["slow", "normal", "fast"];
const traversalModeOptions: TraversalMode[] = [
  "snake",
  "top-to-bottom",
  "random",
];

const speedLabels: Record<AnimationSpeed, string> = {
  slow: "Slow",
  normal: "Normal",
  fast: "Fast",
};

const traversalModeLabels: Record<TraversalMode, string> = {
  snake: "Snake",
  "top-to-bottom": "Vertical snake",
  random: "Random",
};

export function Controls({
  isPlaying,
  speed,
  traversalMode,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
  onTraversalModeChange,
}: ControlsProps) {
  return (
    <div className="controls" aria-label="Animation controls">
      <button type="button" onClick={onStart} disabled={isPlaying}>
        Start
      </button>
      <button type="button" onClick={onPause} disabled={!isPlaying}>
        Pause
      </button>
      <button type="button" onClick={onReset}>
        Reset
      </button>
      <label className="speed-select">
        <span>Speed</span>
        <select
          value={speed}
          onChange={(event) =>
            onSpeedChange(event.currentTarget.value as AnimationSpeed)
          }
        >
          {speedOptions.map((option) => (
            <option key={option} value={option}>
              {speedLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label className="speed-select">
        <span>Path</span>
        <select
          value={traversalMode}
          onChange={(event) =>
            onTraversalModeChange(event.currentTarget.value as TraversalMode)
          }
        >
          {traversalModeOptions.map((option) => (
            <option key={option} value={option}>
              {traversalModeLabels[option]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
