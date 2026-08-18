# Security

## Trust boundaries

This package mounts instruction files into DSH. It does not contain the WeCom binary, does not read credentials, and does not expose an HTTP route or custom Browser Client.

The external `wecom-cli` process may access enterprise data, encrypted local credentials, specified WeCom network services, and user-selected files. Business commands can create or modify messages, documents, sheets, calendars, meetings, todos, mail, and drive data.

## Controls

- No install, prepare, postinstall, or preinstall scripts.
- No automatic external CLI installation, upgrade, or authorization.
- Fixed `wecom-cli` command boundary; no curl/Python fallback or arbitrary shell routing.
- Internal IDs and credentials are excluded from user-visible output.
- Skills fail closed when CLI/version/auth checks fail or targets are ambiguous.
- DSH Profile installation and restart remain separate guarded operations.

## Reporting

Report security issues to the repository owner without including credentials, full enterprise data, private file contents, DSH session logs, or environment variable values.
