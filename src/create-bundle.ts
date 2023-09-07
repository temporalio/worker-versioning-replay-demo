import fs from "node:fs/promises";
import path from "node:path";
import { bundleWorkflowCode } from "@temporalio/worker";

async function run() {
  const bundle = await bundleWorkflowCode({
    workflowsPath: require.resolve("./workflows"),
  });
  await fs.writeFile(
    path.resolve(__dirname, "..", "workflow-bundle.js"),
    bundle.code
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
