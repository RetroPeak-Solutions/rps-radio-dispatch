# Secure Dispatch Releases

This repo now includes a GitHub Actions workflow:

- `.github/workflows/dispatch-release.yml`

It builds Dispatch for:

- Windows (`.exe` / NSIS target)
- macOS (`.dmg` / `.zip`)

It publishes on:

- tag push: `dispatch-v*` or `v*`
- manual run (`workflow_dispatch`) when `publish=true`

Release builds are now enforced to be signed/notarized:

- Windows release job fails if signing secrets are missing.
- macOS release job fails if signing or notarization secrets are missing.

## Required GitHub Secrets

### Always recommended

- `GH_TOKEN`
  - Optional. If not set, workflow uses built-in `GITHUB_TOKEN`.

### Windows code signing

- `CSC_LINK`
  - Base64 or URL form of your code signing certificate (PFX).
- `CSC_KEY_PASSWORD`
  - Password for the certificate.

### macOS signing + notarization

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

The project includes `Dispatch/scripts/notarize.cjs` and runs it via
`electron-builder` `afterSign`.

## Behavior when secrets are missing

The workflow intentionally still builds when signing/notarization secrets are not set.
It prints warnings and creates unsigned artifacts. This is useful for test builds, but production releases should be signed.

## Recommended release process

1. Bump `Dispatch/package.json` version.
2. Commit + push.
3. Trigger CI release from local with one command:

```bash
npm --prefix Dispatch run release:ci -- dispatch-v0.0.8
```

This command creates and pushes the tag for you.

Alternative manual tagging:

```bash
git tag dispatch-v0.0.8
git push origin dispatch-v0.0.8
```

4. Verify release artifacts in GitHub Releases.
5. Smoke test installer on clean Windows/macOS machines.

After one-time secrets setup, this is fully hands-off:

- Push a release tag
- Wait for Actions to publish signed/notarized artifacts

## Notes

- Unsigned apps are significantly more likely to be flagged by antivirus/SmartScreen/Gatekeeper.
- EV code signing on Windows improves SmartScreen reputation faster than standard certs.
