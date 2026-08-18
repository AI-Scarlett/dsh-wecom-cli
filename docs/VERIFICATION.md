# Verification Status

- Outcome: **LISTED in the DSH GUI marketplace**.
- Adapter repository: https://github.com/AI-Scarlett/dsh-wecom-cli
- Release tag: `v0.1.0`.
- Immutable install source: `7f2f75c0ffebfcf556bc802276b1b675279c124d`.
- Adapter package: `dsh-wecom-cli@0.1.0`.
- Entry ID: `dsh-wecom-cli-skill-provider`.
- Registry PR: https://github.com/AI-Scarlett/dsh-safe-plugin-manager/pull/34
- Registry merge Commit: `d0db8f081dc46a3a16a504e00debcba007888da7`.
- Tool card decision: not applicable; this package registers no model Tool or custom Client card.
- Real Profile: unchanged.
- External enterprise WeCom account: unverified.

## E2 automated evidence

- Source verifier: PASS; 14 Skills and 96 Skill resources.
- Node tests: PASS; 3/3.
- npm pack dry-run: PASS; 103 files, 305,883 packed bytes, 1,055,162 unpacked bytes.
- Lifecycle scripts: none.
- General plugin audit with current evidence: 90/100, no hard blocker.

## E3 disposable evidence

- Workspace-local disposable DSH homes were used; no test resolved to real `~/.dsh`.
- Official DSH CLI `0.1.0-rc.7` installed the adapter into disposable `web` and `headless` Profiles.
- Both Profiles produced composed configs containing `dsh-wecom-cli-skill-provider` and provider `dsh-wecom-cli`.
- Headless startup help exited 0.
- Official `@deepseek-ai/dsh-skill-filesystem` discovery loaded all 14 Skills with zero warnings.
- Cleanup/rollback: disposable directories can be deleted; no real Profile or external account was changed.

## Registry and marketplace evidence

- Registry `npm run check`: PASS, 69/69 tests.
- Registry source verification: `SOURCE_OK dsh-wecom-cli 7f2f75c...`.
- PR checks: validate, CodeQL, Actions and JavaScript/TypeScript analysis all PASS.
- Merged remote `registry/catalog.json`: exact ID/version/Commit/status read back successfully.
- GitHub Pages deployment origin: exact approved entry read back successfully.
- Current DSH GUI market API at `127.0.0.1:3080`: GitHub catalog source, `listed: true`, `allowedActions: ["install"]`.
- Separate `https://dsh.store/registry/catalog.json` nginx mirror was still serving its earlier snapshot at the final check; this does not affect the current GUI, which reads the authoritative raw GitHub catalog, but the mirror remains a pending propagation surface.

## Remaining independent surfaces

- Real Profile installation was not requested and remains unchanged.
- Enterprise account authorization and real business reads/writes remain unverified E5 external behavior.
- Optional final follow-up: recheck the separately hosted dsh.store nginx mirror after its next synchronization.
