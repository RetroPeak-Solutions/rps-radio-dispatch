# Secure Dispatch Releases

This repo now includes a GitHub Actions workflow:

- `.github/workflows/dispatch-release.yml`

It builds Dispatch for:

- Windows (`.exe` / NSIS target)
- macOS (`.dmg` / `.pkg`)

It publishes on:

- tag push: `dispatch-v*` or `v*`
- manual run (`workflow_dispatch`) when `publish=true`

## Required GitHub Secrets

### Always recommended

- `GH_TOKEN`
  - GitHub token with permission to upload release assets.

### Windows code signing

- `CSC_LINK`
  - Base64 or URL form of your code signing certificate (PFX).
- `CSC_KEY_PASSWORD`
  - Password for the certificate.

### macOS signing + notarization

- `CSC_LINK`
- `CSC_KEY_PASSWORD`

Notarization (use one of these methods):

1. Apple ID flow:
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

2. App Store Connect API key flow:
- `APPLE_API_KEY`
- `APPLE_API_KEY_ID`
- `APPLE_API_ISSUER`

## Behavior when secrets are missing

The workflow intentionally still builds when signing/notarization secrets are not set.
It prints warnings and creates unsigned artifacts. This is useful for test builds, but production releases should be signed.

## Recommended release process

1. Bump `Dispatch/package.json` version.
2. Commit + push.
3. Create tag:

```bash
git tag dispatch-v0.0.8
git push origin dispatch-v0.0.8
```

4. Verify release artifacts in GitHub Releases.
5. Smoke test installer on clean Windows/macOS machines.

## Notes

- Unsigned apps are significantly more likely to be flagged by antivirus/SmartScreen/Gatekeeper.
- EV code signing on Windows improves SmartScreen reputation faster than standard certs.
