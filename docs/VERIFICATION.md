# Verification Status

- Version under test: `dsh-wecom-cli@0.1.2`.
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

- Root: workspace-local `.e3-v011` only.
- Official DSH rc.7 CLI installed the adapter into disposable `web` and `headless` Profiles.
- Both dump-config outputs include `dsh-wecom-cli-host` and `dsh-wecom-cli-skill-provider`.
- Web/headless help cold boots exit 0 while `wecom-cli` is absent.
- Official rc.7 Skill provider discovers and fully loads all 14 Skills with zero warnings.

## Security scope

v0.1.2 is deliberately read-only. Sends, creates, updates, deletes, cancels, overwrites, imports, uploads, downloads, Webhooks, SQL and effectful formulas remain unavailable. They must not be restored without operation-specific schemas, DSH one-shot approvals, bounded artifacts, stale-target checks and separate E5 evidence.

## Remaining gates

1. Commit and publish the exact v0.1.2 source.
2. Recreate the catalog candidate from the public 40-character Commit.
3. Run Registry validation/source verification and update the blocked entry.
4. Only restore `approved` if current audits and public readback support the reduced read-only contract.
