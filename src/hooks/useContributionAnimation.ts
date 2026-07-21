import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mockContributions } from "../data/mockContributions";
import type {
  AnimationPhase,
  AnimationSpeed,
  CharacterDirection,
  CharacterState,
  ContributionGridData,
  GridPosition,
  TraversalMode,
} from "../types/contribution";
import { createTraversalPath } from "../utils/createTraversalPath";
import {
  cloneContributionGrid,
  GRID_COLUMNS,
  GRID_ROWS,
  SPEED_DELAYS,
} from "../utils/contribution";

type UseContributionAnimationResult = {
  grid: ContributionGridData;
  characterPosition: GridPosition;
  characterState: CharacterState;
  characterDirection: CharacterDirection;
  speed: AnimationSpeed;
  traversalMode: TraversalMode;
  isPlaying: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: AnimationSpeed) => void;
  setTraversalMode: (mode: TraversalMode) => void;
};

const getWalkingState = (
  current: GridPosition,
  next: GridPosition,
): CharacterState => {
  if (next.row < current.row) {
    return "walking-up";
  }

  if (next.row > current.row) {
    return "walking-down";
  }

  if (next.col < current.col) {
    return "walking-left";
  }

  return "walking-right";
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

export const useContributionAnimation = (): UseContributionAnimationResult => {
  const [traversalMode, setTraversalModeState] =
    useState<TraversalMode>("snake");
  const [randomPathVersion, setRandomPathVersion] = useState(0);
  const traversalPath = useMemo(
    () =>
      createTraversalPath(
        GRID_ROWS,
        GRID_COLUMNS,
        traversalMode,
        randomPathVersion,
        mockContributions,
      ),
    [randomPathVersion, traversalMode],
  );
  const timeoutRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const [grid, setGrid] = useState<ContributionGridData>(() =>
    cloneContributionGrid(mockContributions),
  );
  const [pathIndex, setPathIndex] = useState(0);
  const [visualPosition, setVisualPosition] = useState<GridPosition>(
    traversalPath[0],
  );
  const [phase, setPhase] = useState<AnimationPhase>("move");
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  const [characterDirection, setCharacterDirection] =
    useState<CharacterDirection>("front");
  const [speed, setSpeed] = useState<AnimationSpeed>("normal");
  const [isPlaying, setIsPlaying] = useState(false);

  const clearAnimationTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearAnimationTimer();
    if (traversalMode === "random") {
      setRandomPathVersion((currentVersion) => currentVersion + 1);
    }
    setGrid(cloneContributionGrid(mockContributions));
    setPathIndex(0);
    setVisualPosition(traversalPath[0]);
    setPhase("move");
    setCharacterState("idle");
    setCharacterDirection("front");
    setIsPlaying(false);
  }, [clearAnimationTimer, traversalMode, traversalPath]);

  const setTraversalMode = useCallback(
    (mode: TraversalMode) => {
      clearAnimationTimer();
      setTraversalModeState(mode);
      if (mode === "random") {
        setRandomPathVersion((currentVersion) => currentVersion + 1);
      }
      setGrid(cloneContributionGrid(mockContributions));
      setPathIndex(0);
      setPhase("move");
      setCharacterState("idle");
      setCharacterDirection("front");
      setIsPlaying(false);
    },
    [clearAnimationTimer],
  );

  useEffect(() => {
    setVisualPosition(traversalPath[0]);
  }, [traversalPath]);

  const start = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    clearAnimationTimer();
    setIsPlaying(false);
    setCharacterState("idle");
  }, [clearAnimationTimer]);

  useEffect(() => {
    if (!isPlaying) {
      clearAnimationTimer();
      return;
    }

    clearAnimationTimer();

    const currentPosition = traversalPath[pathIndex];
    const currentLevel = grid[currentPosition.row][currentPosition.col];

    if (phase === "eat") {
      timeoutRef.current = window.setTimeout(() => {
        setPhase("move");
      }, SPEED_DELAYS[speed].eat);
      return clearAnimationTimer;
    }

    if (currentLevel > 0) {
      setCharacterState("eating");
      setGrid((currentGrid) => {
        const nextGrid = cloneContributionGrid(currentGrid);
        nextGrid[currentPosition.row][currentPosition.col] = 0;
        return nextGrid;
      });
      setVisualPosition(currentPosition);
      setPhase("eat");
      return clearAnimationTimer;
    }

    const nextIndex = pathIndex + 1;

    if (nextIndex >= traversalPath.length) {
      setCharacterState("finished");
      timeoutRef.current = window.setTimeout(() => {
        if (traversalMode === "random") {
          setRandomPathVersion((currentVersion) => currentVersion + 1);
        }
        setGrid(cloneContributionGrid(mockContributions));
        setPathIndex(0);
        setVisualPosition(traversalPath[0]);
        setCharacterDirection("front");
        setPhase("move");
      }, SPEED_DELAYS[speed].eat);
      return clearAnimationTimer;
    }

    const nextPosition = traversalPath[nextIndex];
    const startedAt = performance.now();
    const duration = SPEED_DELAYS[speed].move;

    setCharacterState(getWalkingState(currentPosition, nextPosition));
    setCharacterDirection(getDirection(currentPosition, nextPosition));

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setVisualPosition({
        row:
          currentPosition.row +
          (nextPosition.row - currentPosition.row) * progress,
        col:
          currentPosition.col +
          (nextPosition.col - currentPosition.col) * progress,
      });

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      frameRef.current = null;
      setPathIndex(nextIndex);
      setVisualPosition(nextPosition);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return clearAnimationTimer;
  }, [
    clearAnimationTimer,
    grid,
    isPlaying,
    pathIndex,
    phase,
    speed,
    traversalMode,
    traversalPath,
  ]);

  useEffect(() => clearAnimationTimer, [clearAnimationTimer]);

  return {
    grid,
    characterPosition: visualPosition,
    characterState,
    characterDirection,
    speed,
    traversalMode,
    isPlaying,
    start,
    pause,
    reset,
    setSpeed,
    setTraversalMode,
  };
};
