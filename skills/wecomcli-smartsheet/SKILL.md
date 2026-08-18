---
name: wecomcli-smartsheet
description: 只读查询企业微信智能表格的子表、记录、字段、视图和图表。v0.1.1 禁止 SQL、Webhook、公式副作用和全部结构或数据写入。
---

# wecomcli-smartsheet（v0.1.1 安全只读模式）

执行前必须读取 `wecomcli-shared`。只能调用 Host Tool `wecom_cli_read`，不得直接执行 CLI、Shell、Python 或网络工具。

## 允许操作

- `smartsheet_sheets_list`
- `smartsheet_records_list`
- `smartsheet_fields_list`
- `smartsheet_views_list`
- `smartsheet_charts_list`

只传结构化 `input`；分页最多 3 页。不得传本地路径、URL、Secret、SQL 或公式。Host 返回脱敏摘要后，以可读名称回答。

## 写入请求

当前版本不执行任何远程写入、发送、删除、覆盖、上传、下载或导入。用户提出这些请求时，说明该能力因安全加固暂时停用并停止，不得使用其他工具或旧参考文件绕过。
