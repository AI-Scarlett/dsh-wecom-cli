# Architecture and Risk Decisions

## Host contract

- Requested outcome: expose the official WeCom CLI Agent Skills in DSH and prepare a DSH-Store listing.
- Target host: DeepSeek Harness 0.1.0-rc.7 or newer.
- Upstream host: standalone Rust/npm CLI plus generic Agent Skills.
- Extension seam: `@deepseek-ai/dsh-skill-filesystem` custom Skill directory provider.
- Host-fit conclusion: `adapter-required`, implemented here as a standard Bundle.
- Risk class: R2 because capability crosses external process, network, enterprise account, credentials, files, and remote business state boundaries.
- Prohibited surfaces: DSH core edits, official inventory replacement, Loader/Fiber mutation, automatic CLI installation, automatic authorization, credential reads, arbitrary shell fallback, real Profile mutation without a separate plan.

## Architecture comparison

| Option | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Add Bundle fields to `@wecom/cli` root | One repository | Git root is not a self-contained published binary package; root prepare script adds install-time behavior | Rejected |
| Host plugin wrapping every CLI method | Strong typed tools and cards | Dynamic discovery surface is large; duplicates upstream command model and greatly expands maintenance | Deferred |
| Skill adapter | Reuses upstream Skills, no Browser/Host API, no install scripts | External CLI remains separately installed and compatible | Chosen |

## Permission matrix

| Action/data | User outcome | Owner | Allowed caller | Redaction | Limits | Failure | Test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Read CLI version/auth status | Determine readiness | external CLI | shared Skill | no token/secret output | fixed argv, short output | stop | static Skill contract |
| Call WeCom business methods | Complete explicit enterprise task | external CLI | matching business Skill | hide internal IDs/credentials | schema and Skill bounds | stop; no bypass | command-boundary scan |
| Read/write selected local files | upload/download/import/export | external CLI | file-capable Skills | do not echo private contents/path unnecessarily | explicit path/type/size | stop on missing bounds | permission review |
| Access WeCom services | perform business operation | external CLI | matching Skill | no credentials in args/output | specified services only | surface non-sensitive error | external E5 pending |

## Evidence gates

- E2: package, patch, Skill count, safety scans, audits and pack contents pass.
- E3: isolated DSH install, dump-config, cold start, Skill discovery and cleanup pass.
- E5 external account: separately authorized WeCom account test; not inferred from E3.
- DSH-Store listing: immutable public source, Registry CI, merged catalog, and public page readback.
