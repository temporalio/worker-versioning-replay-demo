import * as workflow from "@temporalio/workflow";
import type * as activities from "./activities";

const { greet } = workflow.proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export const proceeder = workflow.defineSignal<[string]>("proceed");

export async function versioningExample(): Promise<string> {
  workflow.log.info("Workflow V2.1 started, waiting for signal");
  let inputs = Array<string>();
  workflow.setHandler(proceeder, (input) => void inputs.push(input));
  while (true) {
    await workflow.condition(() => inputs.length > 0);
    const input = inputs.shift()!;

    workflow.log.info("Workflow V2.1 got signal", { input });
    await workflow.sleep("1 second");
    // Changing activity parameters is safe!
    await greet("from V2.1 workflow!");
    await greet("from V2.1 workflow!");
    // Adding a new command (timer) isn't safe and must use a patch
    if (workflow.patched("sleep-before-finish")) {
      await workflow.sleep("1 second");
    }

    if (inputs.length === 0 && input === "finish") {
      return "Concluded workflow on v2.1";
    }
  }
}
