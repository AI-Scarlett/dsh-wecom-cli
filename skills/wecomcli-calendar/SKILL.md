---
name: wecomcli-calendar
description: 只读查询企业微信日程、忙闲和会议室。v0.1.2 暂停创建、更新、取消和预订。
---

# wecomcli-calendar（v0.1.2 安全只读模式）

执行前必须读取 `wecomcli-shared`。只能调用 Host Tool `wecom_cli_read`，不得直接执行 CLI、Shell、Python 或网络工具。

## 允许操作

- `calendar_schedules_free_list`
- `calendar_schedules_list`
- `calendar_schedules_get`
- `calendar_schedules_search`
- `meeting_rooms_buildings_list`
- `meeting_rooms_search`

只传结构化 `input`；分页最多 3 页。不得传本地路径、URL、Secret、SQL 或公式。Host 返回脱敏摘要后，以可读名称回答。

## 写入请求

当前版本不执行任何远程写入、发送、删除、覆盖、上传、下载或导入。用户提出这些请求时，说明该能力因安全加固暂时停用并停止，不得使用其他工具或旧参考文件绕过。
