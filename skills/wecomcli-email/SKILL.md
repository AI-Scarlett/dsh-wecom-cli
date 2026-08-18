---
name: wecomcli-email
description: 只读搜索和获取企业微信邮件。v0.2.0 暂停发送、回复、转发、附件下载和能力链接展示。
---

# wecomcli-email（v0.2.0 安全只读模式）

执行前必须读取 `wecomcli-shared`。只能调用 Host Tool `wecom_cli_read`，不得直接执行 CLI、Shell、Python 或网络工具。

## 允许操作

- `mail_search`
- `mail_get`

只传结构化 `input`；分页最多 3 页。不得传本地路径、URL、Secret、SQL 或公式。Host 返回脱敏摘要后，以可读名称回答。

## 写入请求

当前版本不执行任何远程写入、发送、删除、覆盖、上传、下载或导入。用户提出这些请求时，说明该能力因安全加固暂时停用并停止，不得使用其他工具或旧参考文件绕过。
