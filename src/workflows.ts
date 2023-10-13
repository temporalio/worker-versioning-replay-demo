import * as workflow from "@temporalio/workflow";
import type * as activities from "./activities";

const { greet } = workflow.proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export const proceeder = workflow.defineSignal<[string]>("proceed");

export async function versioningExample(): Promise<string> {
  workflow.log.info("Workflow V2 started, waiting for signal");
  let inputs = Array<string>();
  workflow.setHandler(proceeder, (input) => void inputs.push(input));
  while (true) {
    await workflow.condition(() => inputs.length > 0);
    const input = inputs.shift()!;

    workflow.log.info("Workflow V2 got signal", { input });
    await workflow.sleep("1 second");
    await greet("from V2 workflow!");
    await greet("from V2 workflow!");

    if (inputs.length === 0 && input === "finish") {
      return "Concluded workflow on v2";
    }
  }
}
