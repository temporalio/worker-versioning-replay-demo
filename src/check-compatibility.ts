import { Connection, Client } from "@temporalio/client";
import { Worker } from "@temporalio/worker";
import {
  getConnectionOptions,
  getWorkflowOptions,
  namespace,
  taskQueue,
} from "./env";

async function run() {
  const prTitle = process.argv[2];
  if (!prTitle) {
    throw new Error(`usage: ${process.argv[1]} <prTitle>`);
  }
  const matches = prTitle.match(/^\[compatible-([^\]]+)\]/);
  if (matches == null) {
    throw new Error(`invalid PR title ${prTitle}`);
  }
  const buildId = matches[1];

  const connection = await Connection.connect(await getConnectionOptions());
  const client = new Client({
    connection,
    namespace,
  });

  const compatibility =
    await client.taskQueue.getBuildIdCompatability(taskQueue);
  const set = compatibility?.versionSets.find((s) =>
    s.buildIds.includes(buildId)
  );
  if (set == null) {
    throw new Error(`Could not find set that contains build ID: ${buildId}`);
  }
  const joinedBuildIds = set.buildIds.map((b) => `"versioned:${b}"`).join(", ");

  // Based on your use case, you may want to construct a series of more complex queries to validate workflows from
  // different time ranges and different builds to diversify the coverage.
  const histories = client.workflow
    .list({
      query: `TaskQueue="${taskQueue}" AND BuildIds IN (${joinedBuildIds})`,
    })
    .intoHistories();
  const replayResults = Worker.runReplayHistories(
    getWorkflowOptions(),
    histories
  );
  let i = 0;
  for await (const result of replayResults) {
    // Fail fast
    if (result.error) {
      throw result.error;
    }
    // Limit the number of workflows to check as the query could potentially return a large number of results.
    if (++i > 10_000) break;
    if (i % 1000 === 0) {
      console.log(`${i} compatible`);
    }
  }
  console.log("✅ all compatible");
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
