# Third-Party Notices

## WeCom CLI Skills

- Upstream: https://github.com/WecomTeam/wecom-cli
- Baseline Commit: `1d9e74026455a85d8d10a917b4d453ed4b9a829e`
- Upstream package version: `@wecom/cli@1.1.0`
- License: MIT
- Copyright: Copyright (c) 2026 WeCom

This adapter redistributes the upstream `skills/` text, reference assets, and the `build_docx.py` helper under the MIT License. The adapter changes `wecomcli-shared/SKILL.md` so DSH never silently installs or upgrades the external CLI and never automatically starts credential authorization. The remaining copied files preserve the inspected upstream baseline except for packaging-normalized final newlines.

The WeCom CLI executable and platform binaries are not included. Users obtain them separately from the official `@wecom/cli` distribution.
