import fs from "node:fs/promises";
import type * as client from "@temporalio/client";

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
  if (process.env.TEMPORAL_TLS_CERT_PATH) {
    const crt = await fs.readFile(getenv("TEMPORAL_TLS_CERT_PATH"));
    const key = await fs.readFile(getenv("TEMPORAL_TLS_KEY_PATH"));
    tls = { clientCertPair: { crt, key } };
  }
  return {
    address,
    tls,
  };
}
