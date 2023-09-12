// Create /tmp/temporal-certs and populate it with certs from env vars.
// Used in CI flow to store the Cloud certs from GH secret into local files for testing the mTLS sample.
import * as fs from "node:fs/promises";

const targetDir = "/tmp/temporal-certs";

await fs.mkdir(targetDir);
await fs.writeFile(`${targetDir}/client.pem`, process.env.TEMPORAL_CLIENT_CERT);
await fs.writeFile(`${targetDir}/client.key`, process.env.TEMPORAL_CLIENT_KEY);
