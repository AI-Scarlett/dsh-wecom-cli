# Installation

## External runtime

在 DSH 插件事务之外，用户可按企业微信官方文档安装 `@wecom/cli >=1.1.0` 并完成授权。不要把 Bot Secret、Token、凭据文件或 keyring 内容粘贴到 DSH 对话。

适配器不会自动安装、升级或授权外部 CLI。

## DSH adapter

只使用 DSH Store 中固定到 40 位 Commit 的版本。v0.1.3 修复了 v0.1.2 Git 安装后缺少 `@deepseek-ai/dsh-tools` 运行时解析、Skills 错误相对 Profile 定位，以及空 `data` Schema 被 rc.7 拒绝的问题；仍须完成新的固定源码和 disposable E3 后才能更新商城来源。

## Acceptance

一次有效的 disposable 安装必须：

1. 在 dump-config 中出现 `dsh-wecom-cli-host` 和 `dsh-wecom-cli-skill-provider`；
2. 冷启动时即使缺少 `wecom-cli` 也不崩溃；
3. 发现全部 14 个 Skill；
4. 注册 `wecom_cli_read`；
5. 未知和写入 operation 在 process spawn 前被拒绝。

真实 Profile 和企业账号验收是独立操作，未获单独授权时保持 unchanged。
