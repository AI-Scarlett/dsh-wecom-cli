# DSH WeCom CLI Adapter

将企业微信官方 `@wecom/cli` 的有限只读查询能力通过标准 DSH Host Tool 和 14 个隔离 Skill 接入 DeepSeek Harness。

## v0.1.1 安全模式

v0.1.1 不再让 Skill 直接描述或运行外部命令。所有执行统一经过 Host Tool `wecom_cli_read`：

- 使用 DSH 官方 `ctx.subprocess` 服务和固定 argv；不存在 Shell 解释。
- 只开放冻结的只读 operation allowlist。
- 禁止 Secret、本地路径、URL、SQL 和副作用公式进入参数。
- 分页最多 3 页；输入、输出、嵌套深度和运行时间均有上限。
- 内部 ID、本地路径、Secret 和能力 URL 在模型输出前统一脱敏。
- 发送、创建、更新、删除、取消、覆盖、导入、上传和下载全部 fail closed。

这是一项有意的能力收缩：目标是在恢复远程写入前先建立可验证的 Host 边界。

## 前置条件

- DSH `>=0.1.0-rc.7`，Node.js `>=22.13.0`。
- 用户在插件事务之外独立安装官方 `@wecom/cli >=1.1.0`。
- 用户在 DSH 之外明确完成官方账号授权。

插件不会安装或升级 CLI，不会启动授权，也不会读取凭据文件。

## Bundle

- Host entry：`dsh-wecom-cli-host`
- Skill provider：`dsh-wecom-cli-skill-provider`
- Tool：`wecom_cli_read`
- 生命周期脚本：无
- 风险等级：R2 / high

## 当前能力

联系人、消息会话、微盘元信息、文档搜索/读取、日程、会议、表格、智能表格、智能文档、邮件和待办的有限只读查询。媒体上传下载及全部远程写入暂不可用。

## 上游与许可证

Skill 名称与领域划分源自 [WeComTeam/wecom-cli](https://github.com/WecomTeam/wecom-cli) 的 MIT 许可版本；v0.1.1 已删除原始可执行参考、模板和 Python 辅助脚本，改写为 Host Tool 安全入口。详情见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
