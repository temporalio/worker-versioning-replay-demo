import { Connection, Client } from "@temporalio/client";
import { getConnectionOptions, namespace } from "./env";

async function run() {
  const connection = await Connection.connect(await getConnectionOptions());
  const client = new Client({
    connection,
    namespace,
  });

  const wfs = client.workflow.list({
    query: 'WorkflowType="versioningExample"',
  });
  for await (const wf of wfs) {
    const handle = client.workflow.getHandle(wf.workflowId, wf.runId);
    await handle.signal("proceed", "finish");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
