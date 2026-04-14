const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: "your.bundle.id",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
    teamId: process.env.APPLE_TEAM_ID
  });
};
