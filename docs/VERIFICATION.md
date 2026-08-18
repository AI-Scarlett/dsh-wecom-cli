# Verification Status

- Version under test: `dsh-wecom-cli@0.3.0`.
- Host fit: adapter-required, now implemented as Host Tool + Skill provider.
- Risk: R2 / high.
- Real Profile: unchanged.
- Enterprise WeCom account: unverified. Official CLI install/detection: verified only in a disposable npm prefix.

## E2

- Source verifier: PASS; two unique Bundle rows, 14 Skill entrypoints, zero legacy references/assets/scripts.
- Node tests: PASS; structural contract plus Host bridge security/fault cases.
- Fixed argv: hostile shell text remains one JSON argv element.
- Unknown/write operations, secrets, paths, URLs, SQL and effectful formulas: rejected before spawn.
- Managed process: official DSH subprocess spec, no env forwarding, no spill files, bounded stdout/stderr.
- Output: internal IDs, local paths, secrets and URLs redacted; nonzero stderr withheld.
- npm pack dry-run: PASS; 26 files, no lifecycle scripts.

## E3 disposable

- Root: disposable `/tmp/dsh-wecom-e3.*` only.
- Official DSH rc.7 CLI installed the adapter into a disposable `web` Profile and composed both Bundle entries.
- A real cold boot on isolated port 3082 stayed running while system `wecom-cli` was absent; `/`, the setup API and the plugin Client module returned HTTP 200.
- With `NPM_CONFIG_PREFIX` bound to the disposable root, the setup API moved from `installed:false` through `installing` to `installed:true`, version `1.1.0`, after one confirmed fixed-argv install. The binary existed only under the temporary prefix and Host fallback discovery found it without a system PATH entry.
- Official rc.7 Skill provider discovered and fully loaded all 14 Skills with zero warnings.

## Security scope

v0.3.0 keeps business operations deliberately read-only. Setup mutations are separately confirmed: `INSTALL WECOM CLI` invokes one pinned npm install argv, while `AUTHORIZE WECOM` invokes the official noninteractive QR flow. Sends, creates, updates, deletes, imports, uploads and downloads remain unavailable.

## Remaining gates

1. Commit and publish the E3-verified v0.3.0 source.
2. Recreate the catalog candidate from the public 40-character Commit.
3. Run Registry validation/source verification and update the approved entry.
4. Verify the merged Registry and public marketplace readback separately from real Profile installation.
