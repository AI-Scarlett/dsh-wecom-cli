# Architecture and Risk Decisions

## Host contract

- Host fit: `adapter-required`.
- Target: DSH 0.1.0-rc.7 or newer.
- Risk: R2 because an external process can reach enterprise services and CLI-owned credentials.
- v0.1.1 outcome: retain 14 discoverable domains but expose only bounded read operations through one Host Tool.

## Architecture decision

| Option | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Keep upstream command instructions | Maximum feature parity | Shell, secret, file, formula and write boundaries cannot be centrally enforced | Rejected |
| Generic raw argv bridge | Small implementation | Equivalent to arbitrary command execution | Rejected |
| Operation-specific read-only Host bridge | Fixed argv, central budgets and redaction, testable fail-closed behavior | Writes and file operations temporarily unavailable | Chosen for v0.1.1 |
| Full read/write transaction bridge | Restores all capabilities | Requires per-operation schemas, preview/revision checks, approvals and E5 evidence | Future version only |

## Permission matrix

| Action | Owner | Allowed | Bound | Failure |
| --- | --- | --- | --- | --- |
| Version/auth status | Host bridge | yes | 15s / bounded output | generic safe error |
| Allowlisted business read | Host bridge | yes | 3 pages / 32 KiB input / 256 KiB output | stop and redact |
| Secret, URL, path, SQL, effectful formula | none | no | rejected before spawn | fail closed |
| Remote write or destructive operation | none in v0.1.1 | no | operation absent | fail closed |
| Upload/download/import/export | none in v0.1.1 | no | operation absent | fail closed |

## Evidence gates

- E2: structure, exact argv, no-spawn rejection, budgets, cancellation/error and redaction tests.
- E3: disposable install, two patch rows, cold boot without CLI, tool registration and 14-Skill discovery.
- E5: separately authorized real-account reads; not inferred from E3.
- Approved Store update: public immutable v0.1.1 source, Registry verification, merge and GUI readback.
