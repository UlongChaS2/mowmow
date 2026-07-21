import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mockContributions } from "../src/data/mockContributions";
import { fetchContributionGrid } from "../src/github/fetchContributions";
import { generateContributionPetSvg } from "../src/renderers/svgRenderer";
import type { TraversalMode } from "../src/types/contribution";

type CliOptions = {
  username?: string;
  output: string;
  traversalMode: TraversalMode;
  rows: number;
  columns: number;
};

const traversalModes: TraversalMode[] = ["snake", "top-to-bottom", "random"];

const parseCliOptions = (args: string[]): CliOptions => {
  const options: CliOptions = {
    output: "dist/mowmow.svg",
    traversalMode: "snake",
    rows: 5,
    columns: 10,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === "--username" && value) {
      options.username = value;
      index += 1;
      continue;
    }

    if (arg === "--output" && value) {
      options.output = value;
      index += 1;
      continue;
    }

    if (arg === "--traversal" && value) {
      if (!traversalModes.includes(value as TraversalMode)) {
        throw new Error(`Invalid traversal mode: ${value}`);
      }

      options.traversalMode = value as TraversalMode;
      index += 1;
      continue;
    }

    if (arg === "--rows" && value) {
      options.rows = Number(value);
      index += 1;
      continue;
    }

    if (arg === "--columns" && value) {
      options.columns = Number(value);
      index += 1;
      continue;
    }
  }

  if (!Number.isInteger(options.rows) || options.rows < 1) {
    throw new Error("--rows must be a positive integer");
  }

  if (!Number.isInteger(options.columns) || options.columns < 1) {
    throw new Error("--columns must be a positive integer");
  }

  return options;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const options = parseCliOptions(process.argv.slice(2));
const characterDirections = ["front", "left", "right", "back"] as const;
const outputPath = path.resolve(rootDir, options.output);
const outputDir = path.dirname(outputPath);
const githubToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const grid =
  options.username !== undefined
    ? await fetchContributionGrid({
        username: options.username,
        token:
          githubToken ??
          (() => {
            throw new Error(
              "GITHUB_TOKEN or GH_TOKEN is required when --username is provided",
            );
          })(),
        rows: options.rows,
        columns: options.columns,
      })
    : mockContributions;

const characterDataUriEntries = await Promise.all(
  characterDirections.map(async (direction) => {
    const characterBuffer = await readFile(
      path.join(rootDir, "public", "assets", "lemon", `${direction}.png`),
    );

    return [
      direction,
      `data:image/png;base64,${characterBuffer.toString("base64")}`,
    ] as const;
  }),
);
const svg = generateContributionPetSvg({
  grid,
  characterDataUris: Object.fromEntries(characterDataUriEntries) as Record<
    (typeof characterDirections)[number],
    string
  >,
  traversalMode: options.traversalMode,
});

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, svg, "utf8");

console.log(`Generated ${path.relative(rootDir, outputPath)}`);
