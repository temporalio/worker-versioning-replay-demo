import * as workflow from "@temporalio/workflow";
import type * as activities from "./activities";

const { greet } = workflow.proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export const proceeder = workflow.defineSignal<[string]>("proceed");

export async function versioningExample(): Promise<string> {
  workflow.log.info("Workflow V1 started, waiting for signal");
  let inputs = Array<string>();
  workflow.setHandler(proceeder, (input) => void inputs.push(input));
  while (true) {
    await workflow.condition(() => inputs.length > 0);
    const input = inputs.shift()!;

    workflow.log.info("Workflow V1 got signal", { input });
    await greet("from V1 workflow!");
    await workflow.sleep("1 second");

    if (inputs.length === 0 && input === "finish") {
      return "Concluded workflow on v1";
    }
  }
}
