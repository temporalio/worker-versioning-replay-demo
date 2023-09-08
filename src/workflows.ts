import * as workflow from "@temporalio/workflow";
import type * as activities from "./activities";

const { greet } = workflow.proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export const proceeder = workflow.defineSignal<[string]>("proceed");

export async function versioningExample(): Promise<string> {
  workflow.log.info("Workflow V1 started");
  let shouldFinish = false;
  workflow.setHandler(proceeder, async (input: string) => {
    await greet("from V1 worker!");
    await workflow.sleep("1 second");
    if (input == "finish") {
      shouldFinish = true;
    }
  });
  await workflow.condition(() => shouldFinish);
  return "Concluded workflow on v1";
}
