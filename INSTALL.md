# Installation

## External runtime

在 DSH 设置页输入精确确认语后，插件可通过受信任 npm 的固定 argv 安装 `@wecom/cli@1.1.0`，并启动官方扫码授权。不要把 Bot Secret、Token、凭据文件或 keyring 内容粘贴到 DSH 对话。

适配器不会静默安装或升级外部 CLI。v0.3.0 对安装和授权分别要求 `INSTALL WECOM CLI` 与 `AUTHORIZE WECOM`；不会接收或显示 Secret。若 npm 权限不足，页面保留相同固定命令作为手动恢复入口。

## DSH adapter

只使用 DSH Store 中固定到 40 位 Commit 的版本。v0.3.0 增加页面内 CLI 安装和 npm 全局目录检测；仍须完成新的固定源码和 disposable E3 后才能更新商城来源。

## Acceptance

一次有效的 disposable 安装必须：

1. 在 dump-config 中出现 `dsh-wecom-cli-host` 和 `dsh-wecom-cli-skill-provider`；
2. 冷启动时即使缺少 `wecom-cli` 也不崩溃；
3. 发现全部 14 个 Skill；
4. 注册 `wecom_cli_read`；
5. 未知和写入 operation 在 process spawn 前被拒绝。

真实 Profile 和企业账号验收是独立操作，未获单独授权时保持 unchanged。
