# DSH WeCom CLI Adapter

将企业微信官方 `@wecom/cli` 的有限只读查询能力通过标准 DSH Host Tool 和 14 个隔离 Skill 接入 DeepSeek Harness。

## v0.3.0 一站式首次使用

v0.3.0 在保持业务操作只读的前提下把首次使用串成一个页面流程。安装后进入 DSH 设置页的“企业微信”，输入精确确认语即可由 Host 使用固定 npm argv 安装官方 CLI；安装状态自动刷新，完成后直接扫码授权并测试连接。授权二维码来自企业微信官方 CLI，五分钟失效；插件不会接收、显示或记录 Bot Secret。

业务查询统一经过 Host Tool `wecom_cli_read`：

- 使用 DSH 官方 `ctx.subprocess` 服务和固定 argv；不存在 Shell 解释。
- 只开放冻结的只读 operation allowlist。
- 禁止 Secret、本地路径、URL、SQL 和副作用公式进入参数。
- 分页最多 3 页；输入、输出、嵌套深度和运行时间均有上限。
- 内部 ID、本地路径、Secret 和能力 URL 在模型输出前统一脱敏。
- 发送、创建、更新、删除、取消、覆盖、导入、上传和下载全部 fail closed。

这是一项有意的能力收缩：目标是在恢复远程写入前先建立可验证的 Host 边界。

## 前置条件

- DSH `>=0.1.0-rc.7`，Node.js `>=22.13.0`。
- DSH Host 可解析受信任的 npm 可执行文件，并具备用户级全局安装权限。
- 用户明确确认安装官方 `@wecom/cli@1.1.0` 和企业微信扫码授权。

插件不会静默安装或升级 CLI，也不会读取凭据文件。只有用户在设置页输入 `INSTALL WECOM CLI` 后才会运行固定 npm argv；输入 `AUTHORIZE WECOM` 后才会启动官方扫码授权流程。

## 首次使用

1. 打开 DSH 设置 → 企业微信。
2. 若未安装官方 CLI，输入 `INSTALL WECOM CLI` 并点击“安装官方 CLI”；页面自动显示进度并重新检测。无安装权限时可复制同一条固定命令到终端处理。
3. 安装成功后输入 `AUTHORIZE WECOM`，点击“开始扫码授权”。
4. 使用企业微信扫描二维码，随后点击“测试连接”。
5. 在对话中要求搜索联系人、文档、会议、日程、邮件、待办、微盘或表格。

安装和授权均由用户分别显式确认。Host 只执行固定参数数组，不接收包名、版本、flags、可执行路径或 Shell 字符串；设置页不接受 Secret 输入。

## Bundle

- Host entry：`dsh-wecom-cli-host`
- Skill provider：`dsh-wecom-cli-skill-provider`
- Tool：`wecom_cli_read`
- 生命周期脚本：无
- 风险等级：R2 / high

## 当前能力

联系人、消息会话、微盘元信息、文档搜索/读取、日程、会议、表格、智能表格、智能文档、邮件和待办的有限只读查询。媒体上传下载及全部远程写入暂不可用。

## 上游与许可证

Skill 名称与领域划分源自 [WeComTeam/wecom-cli](https://github.com/WecomTeam/wecom-cli) 的 MIT 许可版本；v0.3.0 保持删除原始可执行参考、模板和 Python 辅助脚本后的 Host Tool 安全入口。详情见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
