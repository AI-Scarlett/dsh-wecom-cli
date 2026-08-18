# Verification Status

- Source baseline: WecomTeam/wecom-cli `1d9e74026455a85d8d10a917b4d453ed4b9a829e`.
- Adapter package: `dsh-wecom-cli@0.1.0`.
- Entry ID: `dsh-wecom-cli-skill-provider`.
- Tool card decision: not applicable; this package registers no model Tool or custom Client card.
- Real Profile: unchanged.
- External account: unverified.
- Registry PR: [#34](https://github.com/AI-Scarlett/dsh-safe-plugin-manager/pull/34), validate passed; CodeQL pending.
- Registry merge/public page: not merged/not verified.

## E2 automated evidence

- Source verifier: PASS; 14 Skills and 96 Skill resources.
- Node tests: PASS; 3/3.
- npm pack dry-run: PASS; 103 files, 305,883 packed bytes, 1,055,162 unpacked bytes.
- Lifecycle scripts: none.
- General static audit before runtime evidence: 77/80, no hard blocker.

## E3 disposable evidence

- Disposable DSH home: workspace-local `.e3-dsh-home`; never resolved to real `~/.dsh`.
- Official DSH CLI `0.1.0-rc.7` installed the adapter into disposable profile `wecom-e3` using `link:` source.
- `--dump-config`: PASS; composed row `dsh-wecom-cli-skill-provider` and provider `dsh-wecom-cli` observed.
- Cold start: process remained alive with no stderr until the 60-second harness timeout; the profile is intentionally long-running.
- Official Skill provider discovery: PASS; all 14 Skills loaded, zero warnings.
- Cleanup/rollback: disposable directory can be deleted; no real Profile or external account was changed.

## Remaining listing gates

1. Wait for Registry PR #34 CodeQL and required checks.
2. Merge the PR only when checks remain green.
3. Read back merged GitHub catalog and the public DSH-Store page.
4. External WeCom account capability remains a separate E5 surface and is not required to prove Skill mounting, but must be described as unverified.
