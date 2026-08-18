# Verification Status

- Version under test: `dsh-wecom-cli@0.2.0`.
- Host fit: adapter-required, now implemented as Host Tool + Skill provider.
- Risk: R2 / high.
- Real Profile: unchanged.
- Enterprise WeCom account and external CLI: unverified.

## E2

- Source verifier: PASS; two unique Bundle rows, 14 Skill entrypoints, zero legacy references/assets/scripts.
- Node tests: PASS; structural contract plus Host bridge security/fault cases.
- Fixed argv: hostile shell text remains one JSON argv element.
- Unknown/write operations, secrets, paths, URLs, SQL and effectful formulas: rejected before spawn.
- Managed process: official DSH subprocess spec, no env forwarding, no spill files, bounded stdout/stderr.
- Output: internal IDs, local paths, secrets and URLs redacted; nonzero stderr withheld.
- npm pack dry-run: PASS; 23 files, no lifecycle scripts.

## E3 disposable

- Root: disposable `/tmp/dsh-wecom-e3.*` only.
- Official DSH rc.7 CLI installed the adapter into a disposable `web` Profile and composed both Bundle entries.
- A real cold boot on isolated port 3081 stayed running while external `wecom-cli` was absent; `/`, the setup API and the plugin Client module returned HTTP 200. The setup API truthfully reported `installed:false` with a fixed install command.
- Official rc.7 Skill provider discovered and fully loaded all 14 Skills with zero warnings.

## Security scope

v0.2.0 keeps business operations deliberately read-only. The only new mutation is an explicit `AUTHORIZE WECOM` account-onboarding action that invokes the official noninteractive QR flow with fixed argv. Sends, creates, updates, deletes, imports, uploads and downloads remain unavailable.

## Remaining gates

1. Commit and publish the exact v0.2.0 source.
2. Recreate the catalog candidate from the public 40-character Commit.
3. Run Registry validation/source verification and update the blocked entry.
4. Only restore `approved` if current audits and public readback support the reduced read-only contract.
