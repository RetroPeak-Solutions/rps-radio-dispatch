/* eslint-disable no-console */
const { spawnSync } = require("child_process");

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function usage() {
  console.log("Usage: npm run release:ci -- <tag>");
  console.log("Examples:");
  console.log("  npm run release:ci -- v0.0.8");
  console.log("  npm run release:ci -- dispatch-v0.0.8");
}

const tag = process.argv[2];
if (!tag) {
  usage();
  process.exit(1);
}

if (!/^(dispatch-)?v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(tag)) {
  console.error(
    `Invalid tag "${tag}". Expected format: v<major>.<minor>.<patch> (or dispatch-v<major>.<minor>.<patch>)`,
  );
  process.exit(1);
}

console.log(`[release:ci] Creating tag ${tag}...`);
run("git", ["tag", tag]);

console.log(`[release:ci] Pushing tag ${tag} to origin...`);
run("git", ["push", "origin", tag]);

console.log(
  "[release:ci] Tag pushed. GitHub Actions will build/sign/notarize/publish using repo secrets.",
);
