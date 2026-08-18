---
name: wecomcli-shared
description: dsh-wecom-cli v0.1.2 的公共安全边界。所有企业微信业务技能必须通过 Host Tool wecom_cli_read 执行有限、只读、可脱敏的官方 CLI 查询；禁止直接运行 Shell、Python、curl、HTTP、wecom-cli 命令或自动安装和授权。
---

# WeCom CLI 公共安全边界

## 唯一执行入口

只能调用 DSH Host Tool `wecom_cli_read`。不得调用 bash、终端、Python、curl、wget、任意 HTTP 工具或直接执行 `wecom-cli`。

Host Bridge 使用固定 argv 和 `shell: false`，仅开放枚举中的只读操作，并限制输入、分页、运行时间和输出字节数。

## 前置检查

1. 调用 `wecom_cli_read`，`operation: "status"`。
2. 调用 `wecom_cli_read`，`operation: "auth_status"`。
3. 任一步失败、版本不满足或未授权时停止。不得安装软件、升级 CLI、启动授权、生成二维码或索取 Secret。

## v0.1.2 禁止能力

- 发送、创建、更新、删除、取消、覆盖、追加、导入、上传、下载、重命名和 Webhook 写入。
- SQL、effectful formula（OPENLINK、ADDRECORD、MODIFYRECORDS）、本地路径、URL、密码、Token、Bot Secret 和能力链接。
- 任意命令、Shell 插值、重复查询和超过 3 页的分页。

若用户要求上述能力，明确说明当前安全版本只提供受控只读查询，不得寻找替代工具绕过。

## 输出

Host Bridge 会脱敏内部 ID、本地路径、Secret 和 URL。不得尝试恢复、猜测或要求用户粘贴这些值。只用可读名称和摘要回答。
