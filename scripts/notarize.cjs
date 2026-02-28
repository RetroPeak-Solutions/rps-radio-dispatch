/* eslint-disable no-console */
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

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
  const appleApiKey = process.env.APPLE_API_KEY;
  const appleApiKeyPath = process.env.APPLE_API_KEY_PATH;
  const appleApiKeyId = process.env.APPLE_API_KEY_ID;
  const appleApiIssuer = process.env.APPLE_API_ISSUER;

  const hasAppleIdFlow = !!(appleId && applePassword && teamId);
  const hasApiKeyFlow = !!(appleApiKeyPath && appleApiKeyId && appleApiIssuer) || !!(appleApiKey && appleApiKeyId && appleApiIssuer);

  if (!hasAppleIdFlow && !hasApiKeyFlow) {
    console.log("[notarize] Missing notarization credentials. Provide Apple ID flow or API key flow. Skipping notarization.");
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`[notarize] Submitting ${appPath} to Apple notarization service...`);
  let generatedKeyPath = null;
  const submitArgs = ["notarytool", "submit", appPath, "--wait"];

  if (hasApiKeyFlow) {
    let keyPath = appleApiKeyPath;
    if (!keyPath && appleApiKey) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "notarykey-"));
      keyPath = path.join(dir, `AuthKey_${appleApiKeyId}.p8`);
      fs.writeFileSync(keyPath, appleApiKey);
      generatedKeyPath = keyPath;
    }
    submitArgs.push("--key", keyPath, "--key-id", appleApiKeyId, "--issuer", appleApiIssuer);
  } else {
    submitArgs.push("--apple-id", appleId, "--password", applePassword, "--team-id", teamId);
  }

  await run("xcrun", submitArgs);

  console.log("[notarize] Stapling notarization ticket...");
  await run("xcrun", ["stapler", "staple", appPath]);
  console.log("[notarize] Completed.");

  if (generatedKeyPath) {
    try {
      fs.unlinkSync(generatedKeyPath);
      fs.rmdirSync(path.dirname(generatedKeyPath));
    } catch {}
  }
};
