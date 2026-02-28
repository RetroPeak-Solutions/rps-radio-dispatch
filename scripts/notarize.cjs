/* eslint-disable no-console */
const { spawn } = require("child_process");
const path = require("path");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

module.exports = async function notarize(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== "darwin") return;

  const appleId = process.env.APPLE_ID;
  const applePassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !applePassword || !teamId) {
    console.log("[notarize] Missing APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID. Skipping notarization.");
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`[notarize] Submitting ${appPath} to Apple notarization service...`);
  await run("xcrun", [
    "notarytool",
    "submit",
    appPath,
    "--apple-id",
    appleId,
    "--password",
    applePassword,
    "--team-id",
    teamId,
    "--wait",
  ]);

  console.log("[notarize] Stapling notarization ticket...");
  await run("xcrun", ["stapler", "staple", appPath]);
  console.log("[notarize] Completed.");
};
