import { useEffect, useMemo, useState } from "react";
import { characterAssets } from "./config/characterAssets";
import { mockContributions } from "./data/mockContributions";
import { generateContributionPetSvg } from "./renderers/svgRenderer";
import type {
  AnimationSpeed,
  CharacterDirection,
  TraversalMode,
} from "./types/contribution";
import { hashStringToSeed } from "./utils/random";

const previewSpeedDelays: Record<
  AnimationSpeed,
  { frameDelayMs: number; eatDelayMs: number }
> = {
  slow: { frameDelayMs: 900, eatDelayMs: 760 },
  normal: { frameDelayMs: 620, eatDelayMs: 620 },
  fast: { frameDelayMs: 360, eatDelayMs: 420 },
};

const createPreviewSeed = (): number => {
  const values = new Uint32Array(1);

  window.crypto.getRandomValues(values);

  return values[0] ?? hashStringToSeed(window.location.href);
};

function App() {
  const [traversalMode, setTraversalMode] = useState<TraversalMode>("nearest");
  const [speed, setSpeed] = useState<AnimationSpeed>("normal");
  const [randomSeed, setRandomSeed] = useState(createPreviewSeed);
  const [svgMarkup, setSvgMarkup] = useState<string>("");

  const assetUrls = useMemo<Record<CharacterDirection, string>>(
    () => ({
      front: characterAssets.front,
      left: characterAssets.left,
      right: characterAssets.right,
      back: characterAssets.back,
    }),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const blobToDataUri = async (url: string): Promise<string> => {
      const response = await fetch(url);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }

          reject(new Error(`Unable to read asset: ${url}`));
        });
        reader.addEventListener("error", () => reject(reader.error));
        reader.readAsDataURL(blob);
      });
    };

    const loadSvg = async () => {
      const entries = await Promise.all(
        (Object.entries(assetUrls) as [CharacterDirection, string][]).map(
          async ([direction, url]) => [direction, await blobToDataUri(url)] as const,
        ),
      );

      if (!isMounted) {
        return;
      }

      setSvgMarkup(
        generateContributionPetSvg({
          grid: mockContributions,
          characterDataUris: Object.fromEntries(entries) as Record<
            CharacterDirection,
            string
          >,
          traversalMode,
          randomSeed,
          ...previewSpeedDelays[speed],
        }),
      );
    };

    void loadSvg();

    return () => {
      isMounted = false;
    };
  }, [assetUrls, randomSeed, speed, traversalMode]);

  const svgDataUri = useMemo(
    () =>
      svgMarkup
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
        : "",
    [svgMarkup],
  );

  return (
    <main className="app-shell">
      <section className="widget" aria-label="MowMow widget">
        <div className="widget-header">
          <div>
            <h1>MowMow</h1>
            <p>Local preview renders the same SVG used in the GitHub README.</p>
          </div>
          <div className="preview-controls">
            <label className="speed-select">
              <span>Speed</span>
              <select
                value={speed}
                onChange={(event) =>
                  setSpeed(event.currentTarget.value as AnimationSpeed)
                }
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
            <label className="speed-select">
              <span>Path</span>
              <select
                value={traversalMode}
                onChange={(event) =>
                  setTraversalMode(event.currentTarget.value as TraversalMode)
                }
              >
                <option value="nearest">Nearest</option>
                <option value="snake">Snake</option>
                <option value="top-to-bottom">Vertical snake</option>
              <option value="random">Random</option>
            </select>
          </label>
            <button
              type="button"
              className="reroll-button"
              onClick={() => setRandomSeed(createPreviewSeed())}
            >
              Reroll
            </button>
          </div>
        </div>

        <div className="svg-preview">
          {svgDataUri ? (
            <img src={svgDataUri} alt="MowMow contribution graph preview" />
          ) : (
            <span>Loading preview...</span>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
