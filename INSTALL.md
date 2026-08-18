# Installation

## 1. Install the external runtime separately

Install and authorize the official WeCom CLI outside the DSH plugin transaction. These operations may modify global npm state and local encrypted credentials, so the adapter never performs them automatically.

```bash
npm install -g @wecom/cli
wecom-cli --version
wecom-cli auth init
wecom-cli auth show --status
```

Never paste Bot Secret, Token, encrypted credential files, or keyring contents into DSH chat.

## 2. Install the adapter

Use DSH-Store after the adapter has a public immutable Commit and an approved catalog entry. Direct official-CLI installation into a real Profile is a separate R3 operation requiring a fresh plan, backup, exact confirmation, dump-config, health checks, and rollback.

## 3. Verify

A valid installation must show the `dsh-wecom-cli-skill-provider` row and discover all 14 packaged Skills, including the shared prerequisite Skill. External account capability remains unverified until a separately authorized real account test succeeds.
