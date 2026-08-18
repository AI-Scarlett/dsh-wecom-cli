# DSH WeCom CLI Adapter

将 [WeComTeam/wecom-cli](https://github.com/WecomTeam/wecom-cli) 提供的 14 个企业微信 Agent Skills 作为标准 DSH Bundle 挂载到 DeepSeek Harness。

## 能力

覆盖通讯录、消息、邮件、文档、在线表格、智能表格、智能文档、待办、日程、会议、微盘和媒体文件等工作流。适配器只挂载 Skill，不内置企业微信客户端、不代理凭据，也不自动安装外部运行时。

## 安全模型

- 风险等级：R2 / high。
- 外部进程：固定调用 `wecom-cli`。
- 网络：由官方 WeCom CLI 访问企业微信指定服务。
- 凭据：由 WeCom CLI 加密存储；适配器不读取凭据文件。
- 文件：部分业务能力可上传、下载、导入或导出用户明确指定的文件。
- 业务写入：消息、文档、表格、日程、会议、待办、微盘等操作可能修改企业微信数据。

## 前置条件

1. DSH `>=0.1.0-rc.7`，Node.js `>=22.13.0`。
2. 用户在插件安装之外独立安装官方 `@wecom/cli >=1.1.0`：

   ```bash
   npm install -g @wecom/cli
   ```

3. 用户明确发起并完成官方授权：

   ```bash
   wecom-cli auth init
   ```

安装 DSH 适配器不会自动执行以上两步。

## DSH 安装

正式商城安装必须固定到公开 GitHub 仓库的 40 位 Commit，并通过 DSH-Store 的一次性计划执行。不要使用浮动 `main` 作为生产安装源。

## 包契约

- Bundle Patch：`./cordis.patch.yml`
- Entry ID：`dsh-wecom-cli-skill-provider`
- Skill provider：`@deepseek-ai/dsh-skill-filesystem`
- 生命周期脚本：无
- Profile 兼容性：待一次性 Profile E3 验证

## 上游与许可证

Skill 内容基于 `WecomTeam/wecom-cli` 的 MIT 许可源码。固定上游基线与修改说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
