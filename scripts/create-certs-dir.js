// Create /tmp/temporal-certs and populate it with certs from env vars.
// Used in CI flow to store the Cloud certs from GH secret into local files for testing the mTLS sample.
const fs = require("node:fs");

const targetDir = "/tmp/temporal-certs";

fs.mkdirSync(targetDir);
fs.writeFileSync(`${targetDir}/client.pem`, process.env.TEMPORAL_CLIENT_CERT);
fs.writeFileSync(`${targetDir}/client.key`, process.env.TEMPORAL_CLIENT_KEY);
