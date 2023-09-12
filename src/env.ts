import fs from "node:fs/promises";
import type * as client from "@temporalio/client";
import type { WorkerOptions } from "@temporalio/worker";

// Common set of connection options that can be used for both the client and worker connections.
export type ConnectionOptions = Pick<
  client.ConnectionOptions,
  "tls" | "address"
>;

export function getenv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue != null) {
      return defaultValue;
    }
    throw new Error(`missing env var: ${key}`);
  }
  return value;
}

export async function getConnectionOptions(): Promise<ConnectionOptions> {
  const address = getenv("TEMPORAL_ADDRESS", "localhost:7233");

  let tls: ConnectionOptions["tls"] = undefined;
  if (process.env.TEMPORAL_TLS_CERT) {
    const crt = await fs.readFile(getenv("TEMPORAL_TLS_CERT"));
    const key = await fs.readFile(getenv("TEMPORAL_TLS_KEY"));
    tls = { clientCertPair: { crt, key } };
  }
  return {
    address,
    tls,
  };
}

export function getWorkflowOptions(): Pick<
  WorkerOptions,
  "workflowBundle" | "workflowsPath"
> {
  const workflowBundlePath = process.env.WORKFLOW_BUNDLE_PATH;
  if (workflowBundlePath) {
    return { workflowBundle: { codePath: workflowBundlePath } };
  } else {
    return { workflowsPath: require.resolve("./workflows") };
  }
}

export const namespace = getenv("TEMPORAL_NAMESPACE", "default");
export const taskQueue = getenv("TEMPORAL_TASK_QUEUE", "versioned-queue");
