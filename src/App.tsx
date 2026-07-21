import { Character } from "./components/Character";
import { ContributionGrid } from "./components/ContributionGrid";
import { Controls } from "./components/Controls";
import { useContributionAnimation } from "./hooks/useContributionAnimation";
import { GRID_COLUMNS, GRID_ROWS, getGridHeight, getGridWidth } from "./utils/contribution";

function App() {
  const {
    grid,
    characterPosition,
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
  } = useContributionAnimation();

  return (
    <main className="app-shell">
      <section className="widget" aria-label="MowMow widget">
        <div className="widget-header">
          <div>
            <h1>MowMow</h1>
            <p>A tiny README companion that walks the contribution graph.</p>
          </div>
          <Controls
            isPlaying={isPlaying}
            speed={speed}
            traversalMode={traversalMode}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onSpeedChange={setSpeed}
            onTraversalModeChange={setTraversalMode}
          />
        </div>

        <div
          className="stage"
          style={{
            width: getGridWidth(GRID_COLUMNS),
            height: getGridHeight(GRID_ROWS) + 88,
          }}
        >
          <div className="grid-layer">
            <ContributionGrid grid={grid} />
          </div>
          <Character
            position={characterPosition}
            state={characterState}
            direction={characterDirection}
            speed={speed}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
