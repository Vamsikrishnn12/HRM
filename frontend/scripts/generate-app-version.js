const fs = require("fs");
const path = require("path");

const packageJson = require(path.join(__dirname, "..", "package.json"));
const deploymentId = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.VERCEL_DEPLOYMENT_ID
  || Date.now().toString(36);
const version = `${packageJson.version}-${deploymentId.slice(0, 12)}`;
const target = path.join(__dirname, "..", "public", "app-version.json");

fs.writeFileSync(target, `${JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2)}\n`);
console.log(`Connect HR app version: ${version}`);
