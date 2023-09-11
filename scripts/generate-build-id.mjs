import * as fs from "node:fs/promises";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";

const githubRunId = process.argv[2];
const githubRunAttempt = process.argv[3];

const envFile = process.env.GITHUB_ENV;
if (!envFile) {
  throw new Error("GITHUB_ENV env var unset");
}

if (!(githubRunId && githubRunAttempt)) {
  throw new Error(
    `usage: ${process.argv[1]} <github-run-id> <github-run-attempt>`
  );
}

const buildIdPrefix = uniqueNamesGenerator({
  dictionaries: [adjectives, animals],
  separator: "-",
  // Deterministic generation
  seed: `${githubRunId}-${githubRunAttempt}`,
});
const buildIdSuffix = githubRunAttempt === "1" ? "" : `-${githubRunAttempt}`;

await fs.appendFile(
  envFile,
  `BUILD_ID=${buildIdPrefix}-${githubRunId}${buildIdSuffix}\n`
);
