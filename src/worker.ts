import path from "node:path";
import {
  NativeConnection,
  Worker,
  type WorkerOptions,
} from "@temporalio/worker";
import * as activities from "./activities";
import { getenv, getConnectionOptions } from "./env";

async function run() {
  const connectionOptions = await getConnectionOptions();
  const buildId = getenv("BUILD_ID");
  const namespace = getenv("TEMPORAL_NAMESPACE", "default");

  let workflowOptions: Partial<WorkerOptions>;
  const workflowBundlePath = process.env.WORKFLOW_BUNDLE_PATH;
  if (workflowBundlePath) {
    workflowOptions = {
      workflowBundle: {
        codePath: path.resolve(__dirname, "..", "workflow-bundle.js"),
      },
    };
  } else {
    workflowOptions = {
      workflowsPath: require.resolve("./workflows"),
    };
  }

  const connection = await NativeConnection.connect(connectionOptions);
  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue: "versioned-queue",
    buildId,
    useVersioning: true,
    activities,
    ...workflowOptions,
  });
  await worker.run();
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
