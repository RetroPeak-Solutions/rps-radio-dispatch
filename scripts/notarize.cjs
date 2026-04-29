/* eslint-disable no-console */
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
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
  const applePassword =
    process.env.APPLE_APP_SPECIFIC_PASSWORD || process.env.APPLE_APP_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID || process.env.CSC_TEAM_ID;
  const appleApiKey = process.env.APPLE_API_KEY;
  const appleApiKeyPath = process.env.APPLE_API_KEY_PATH;
  const appleApiKeyId = process.env.APPLE_API_KEY_ID || process.env.APPLE_KEY_ID;
  const appleApiIssuer = process.env.APPLE_API_ISSUER || process.env.APPLE_ISSUER_ID;

  const hasAppleIdFlow = !!(appleId && applePassword && teamId);
  const hasApiKeyFlow = !!(appleApiKeyPath && appleApiKeyId && appleApiIssuer) || !!(appleApiKey && appleApiKeyId && appleApiIssuer);
  const skipNotarize = process.env.SKIP_NOTARIZE === "1";

  if (!hasAppleIdFlow && !hasApiKeyFlow && !skipNotarize) {
    throw new Error(
      "[notarize] Missing notarization credentials. Set Apple ID flow " +
      "(APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID) or API key flow " +
      "(APPLE_API_KEY_PATH or APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER).",
    );
  }

  if (skipNotarize) {
    console.log("[notarize] SKIP_NOTARIZE=1 set. Skipping notarization by explicit request.");
    return;
  }

  const appName = packager.appInfo.productFilename;
  let appPath = path.join(appOutDir, `${appName}.app`);
  if (!fs.existsSync(appPath)) {
    const candidates = fs
      .readdirSync(appOutDir)
      .filter((entry) => entry.endsWith(".app"))
      .map((entry) => path.join(appOutDir, entry));
    if (candidates.length === 1) {
      appPath = candidates[0];
    }
  }
  if (!fs.existsSync(appPath)) {
    throw new Error(`[notarize] Could not find app bundle to notarize in: ${appOutDir}`);
  }
  const zipPath = path.join(appOutDir, `${appName}-notarize.zip`);

  // Ensure signature is present and usable before notarization.
  console.log("[notarize] Verifying code signature before submit...");
  await run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);

  console.log(`[notarize] Creating notarization archive: ${zipPath}`);
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  await run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appPath, zipPath]);

  console.log(`[notarize] Submitting ${zipPath} to Apple notarization service...`);
  let generatedKeyPath = null;
  const submitArgs = ["notarytool", "submit", zipPath, "--wait"];

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
  console.log("[notarize] Validating stapled ticket...");
  await run("xcrun", ["stapler", "validate", appPath]);
  console.log("[notarize] Verifying Gatekeeper assessment...");
  await run("spctl", ["-a", "-vv", appPath]);
  console.log("[notarize] Completed.");

  if (generatedKeyPath) {
    try {
      fs.unlinkSync(generatedKeyPath);
      fs.rmdirSync(path.dirname(generatedKeyPath));
    } catch {}
  }
  try {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  } catch {}
};
