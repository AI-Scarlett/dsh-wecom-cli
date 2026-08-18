# Security

## Trust boundaries

本包注册 DSH Host Tool `wecom_cli_read` 并挂载 14 个 Skill。外部官方 `wecom-cli` 仍可能访问企业账号、加密凭据和企业微信网络服务，但 v0.1.1 只允许有限只读调用。

## Enforced controls

- 通过 `ctx.subprocess` 执行；argv 数组从冻结 operation registry 生成。
- 不接受命令字符串、原始 argv、可执行路径、工作目录、环境变量或任意 flags。
- 不使用 Node `child_process`、Shell、Python、curl、wget 或通用 HTTP fallback。
- Secret-like 字段、本地路径、URL、SQL 和 `OPENLINK/ADDRECORD/MODIFYRECORDS` 在 spawn 前拒绝。
- 输入 32 KiB、输出 256 KiB、stderr 16 KiB、字符串 4096 字符、分页 3 页、超时 15 秒。
- subprocess spill 禁用；不在磁盘保存完整企业响应。
- 输出统一脱敏内部 ID、Secret、绝对路径和 URL。
- 非零退出不返回原始 stderr。
- 全部写入、文件传输和副作用公式未注册，未知 operation 在 spawn 前拒绝。

## Credentials

插件不调用 DSH credential store，不读取 `credentials.enc`，不接收密码、Bot Secret、Webhook key、Token 或 Cookie。账号授权完全由用户和官方 CLI 在插件之外管理。

## Remaining limitations

CLI 未在本地 E2 环境中提供，因此真实输出 Schema、账号行为和企业服务兼容性仍需独立 E5 验证。远程写入只有在未来版本实现 operation-specific preview、DSH one-shot approval、revision/stale checks 和有界 artifact 管理后才可恢复。
