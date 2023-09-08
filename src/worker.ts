import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";
import {
  getenv,
  namespace,
  taskQueue,
  getConnectionOptions,
  getWorkflowOptions,
} from "./env";

async function run() {
  const connectionOptions = await getConnectionOptions();
  const buildId = getenv("BUILD_ID");

  const connection = await NativeConnection.connect(connectionOptions);
  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    buildId,
    useVersioning: true,
    activities,
    ...getWorkflowOptions(),
  });
  await worker.run();
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
