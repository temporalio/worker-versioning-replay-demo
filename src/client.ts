import { Connection, Client } from "@temporalio/client";
import { getConnectionOptions, namespace } from "./env";

async function run() {
  const signalInput = process.argv[2];
  if (!signalInput) {
    throw new Error(`usage: ${process.argv[1]} <signalInput>`);
  }
  const connection = await Connection.connect(await getConnectionOptions());
  const client = new Client({
    connection,
    namespace,
  });

  const wfs = client.workflow.list({
    query: 'WorkflowType="versioningExample" AND ExecutionStatus="Running"',
  });
  for await (const wf of wfs) {
    console.log("signalling", wf.workflowId, { signalInput });
    const handle = client.workflow.getHandle(wf.workflowId, wf.runId);
    await handle.signal("proceed", signalInput);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
