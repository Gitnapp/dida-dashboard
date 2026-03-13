# Dida365 API 文档（基于实现证据）

> 本文档只记录**有实现证据**的接口。
>
> - **官方 Open API / OAuth 端点**：来自本仓库 `dida365-cli` 的 Go 实现。
> - **私有 API 端点**：来自 `oymy/dida365-ai-tools` 的 TypeScript 实现（`dida365-cli` 技能所引用的实现）。
> - **未在代码中出现的字段、限流策略、隐藏参数、额外端点**一律不做臆测。

## 1. 证据来源

### 本地 Go CLI（官方 Open API）

- `dida365-cli/internal/client/client.go`
- `dida365-cli/internal/client/projects.go`
- `dida365-cli/internal/client/tasks.go`
- `dida365-cli/internal/oauth/browser.go`
- `dida365-cli/internal/oauth/oauth.go`
- `dida365-cli/internal/oauth/server.go`
- `dida365-cli/internal/models/*.go`

### 外部 TypeScript CLI（私有 API）

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/services/sync.service.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

## 2. 服务划分

### 官方服务域名

| 服务 | Base URL |
|---|---|
| Dida365（中国） | `https://dida365.com` |
| TickTick（国际） | `https://ticktick.com` |

### 私有 API 域名

| 服务 | Base URL |
|---|---|
| Dida365 私有 API | `https://api.dida365.com/api/v2` |

---

## 3. 认证

## 3.1 官方 OAuth 2.0

### 3.1.1 发起授权

- **Method**: `GET`
- **Path**: `/oauth/authorize`
- **Host**:
  - `https://dida365.com/oauth/authorize`
  - `https://ticktick.com/oauth/authorize`

### 查询参数

| 参数 | 必需 | 值来源 |
|---|---|---|
| `client_id` | 是 | CLI 参数 |
| `redirect_uri` | 是 | `http://localhost:{port}/callback` |
| `response_type` | 是 | 固定为 `code` |
| `state` | 是 | 随机 32 字节 hex |
| `scope` | 是 | 固定为 `tasks:read tasks:write` |

### 示例

```http
GET /oauth/authorize?client_id=CLIENT_ID&redirect_uri=http://localhost:8080/callback&response_type=code&state=RANDOM_STATE&scope=tasks%3Aread+tasks%3Awrite
```

**实现证据**

- `internal/oauth/browser.go:53-64`
- `internal/oauth/oauth.go:55-57`

---

### 3.1.2 交换 access token

- **Method**: `POST`
- **Path**: `/oauth/token`
- **Host**:
  - `https://dida365.com/oauth/token`
  - `https://ticktick.com/oauth/token`
- **Content-Type**: `application/x-www-form-urlencoded`

### 表单字段

| 字段 | 必需 | 值 |
|---|---|---|
| `grant_type` | 是 | `authorization_code` |
| `code` | 是 | 回调得到的授权码 |
| `client_id` | 是 | OAuth client id |
| `client_secret` | 是 | OAuth client secret |
| `redirect_uri` | 是 | 必须与授权请求一致 |

### 成功响应模型

```json
{
  "access_token": "...",
  "expires_in": 15552000,
  "token_type": "Bearer"
}
```

### 错误响应模型

```json
{
  "error": "invalid_grant",
  "error_description": "..."
}
```

**说明**

- 本实现明确注释：**不发 refresh token**。
- `expires_in` 被 CLI 用来计算本地 `token_expiry`。

**实现证据**

- `internal/oauth/browser.go:81-93`
- `internal/oauth/oauth.go:96-159`
- `internal/oauth/oauth.go:13-25`

---

### 3.1.3 本地 OAuth 回调端点（CLI 本地，不是 Dida365 服务器接口）

- **Method**: `GET`
- **Path**: `/callback`
- **Host**: `http://localhost:{port}`

### 支持的查询参数

| 参数 | 含义 |
|---|---|
| `code` | 授权码 |
| `state` | CSRF 校验值 |
| `error` | OAuth 错误码 |
| `error_description` | OAuth 错误描述 |

### 行为

- 非 `GET` → `405 Method Not Allowed`
- `error` 存在 → 返回错误 HTML，并把错误传回 CLI
- `state` 不匹配 → 拒绝，提示可能存在 CSRF
- `code` 缺失 → 失败
- 成功 → 返回成功 HTML 页面

**实现证据**

- `internal/oauth/server.go:19-202`

---

## 3.2 官方 Open API 请求认证

所有 Open API 请求由 Go CLI 统一设置：

```http
Authorization: Bearer ACCESS_TOKEN
```

如果请求带 body，还会设置：

```http
Content-Type: application/json
```

**实现证据**

- `internal/client/client.go:56-60`

---

## 3.3 私有 API 请求认证

私有 API 不是 OAuth Bearer Token，而是 **Cookie token**。

### 固定头

```http
Cookie: t=HEX_TOKEN
Content-Type: application/json
User-Agent: Mozilla/5.0 ... Firefox/95.0
x-device: {"platform":"web",...}
```

### 特征

- token 必须匹配 hex 格式
- 私有 API base URL 固定为 `https://api.dida365.com/api/v2`

**实现证据**

- `oymy/dida365-ai-tools/src/core/api-client.ts`

---

## 4. 官方 Open API 端点

## 4.1 Projects

### 4.1.1 列出项目

- **Method**: `GET`
- **Path**: `/open/v1/project`
- **Auth**: Bearer

### 响应模型

返回 `Project[]`：

```json
[
  {
    "id": "proj123",
    "name": "工作",
    "color": "#FF5733",
    "sortOrder": 1000,
    "closed": false,
    "kind": "TASK"
  }
]
```

**实现证据**

- `internal/client/projects.go:9-16`
- `internal/models/project.go:3-11`

---

### 4.1.2 获取单个项目

- **Method**: `GET`
- **Path**: `/open/v1/project/{projectId}`
- **Auth**: Bearer

### 响应模型

返回 `Project`：

```json
{
  "id": "proj123",
  "name": "工作",
  "color": "#FF5733",
  "sortOrder": 1000,
  "closed": false,
  "kind": "TASK"
}
```

**实现证据**

- `internal/client/projects.go:18-26`
- `internal/models/project.go:3-11`

---

### 4.1.3 获取项目完整数据

- **Method**: `GET`
- **Path**: `/open/v1/project/{projectId}/data`
- **Auth**: Bearer

### 响应模型

返回 `ProjectData`：

```json
{
  "project": {
    "id": "proj123",
    "name": "工作",
    "color": "#FF5733",
    "sortOrder": 1000,
    "closed": false,
    "kind": "TASK"
  },
  "tasks": [
    {
      "id": "task456",
      "projectId": "proj123",
      "title": "写文档",
      "content": "",
      "status": 0,
      "priority": 0,
      "completedTime": null,
      "sortOrder": 1000,
      "columnId": "column1"
    }
  ],
  "columns": [
    {
      "id": "column1",
      "projectId": "proj123",
      "name": "待办",
      "sortOrder": 1000
    }
  ]
}
```

**说明**

- 本地 CLI 的 `project data` 和 `project columns` 都依赖这个端点。
- `task list` 也是通过这个端点取出其中的 `tasks` 字段。

**实现证据**

- `internal/client/projects.go:28-38`
- `internal/client/tasks.go:28-41`
- `internal/models/column.go:11-16`

---

## 4.2 Tasks

### 4.2.1 创建任务

- **Method**: `POST`
- **Path**: `/open/v1/task`
- **Auth**: Bearer
- **Content-Type**: `application/json`

### 请求体

```json
{
  "title": "写文档",
  "projectId": "proj123",
  "content": "补齐接口说明"
}
```

对应模型：

```ts
interface TaskCreate {
  title: string
  projectId: string
  content?: string
}
```

### 响应体

返回 `Task`。

**实现证据**

- `internal/client/tasks.go:9-16`
- `internal/models/task.go:16-21`
- `internal/models/task.go:3-14`

---

### 4.2.2 获取单个任务

- **Method**: `GET`
- **Path**: `/open/v1/project/{projectId}/task/{taskId}`
- **Auth**: Bearer

### 响应体

返回 `Task`。

**实现证据**

- `internal/client/tasks.go:18-26`
- `internal/models/task.go:3-14`

---

### 4.2.3 列出项目任务

- **Method**: `GET`
- **Path**: `/open/v1/project/{projectId}/data`
- **Auth**: Bearer

### 实际使用方式

CLI 没有单独的 “list tasks” 端点，而是：

1. 请求 `/open/v1/project/{projectId}/data`
2. 读取响应中的 `tasks` 字段

### 返回给 CLI 的结构

```json
{
  "tasks": [
    {
      "id": "task456",
      "projectId": "proj123",
      "title": "写文档",
      "status": 0,
      "sortOrder": 1000
    }
  ]
}
```

> 真实响应还包含 `project` 和 `columns`；这里仅展示 `task list` 使用到的部分。

**实现证据**

- `internal/client/tasks.go:28-41`

---

### 4.2.4 更新任务

- **Method**: `POST`
- **Path**: `/open/v1/task/{taskId}`
- **Auth**: Bearer
- **Content-Type**: `application/json`

### 请求体

CLI 会自动把 `id` 和 `projectId` 写回 body：

```json
{
  "id": "task456",
  "projectId": "proj123",
  "title": "新标题",
  "content": "新内容",
  "columnId": "column2"
}
```

对应模型：

```ts
interface TaskUpdate {
  id: string
  projectId: string
  title?: string
  content?: string
  columnId?: string
}
```

### 说明

- `title` / `content` / `columnId` 在模型里是可选字段。
- CLI 只会发送用户显式更新过的字段。
- `task move` 本质上也是调用该接口，仅设置 `columnId`。

**实现证据**

- `internal/client/tasks.go:44-54`
- `internal/models/task.go:23-30`
- `cmd/task.go:171-201`
- `cmd/task.go:238-253`

---

### 4.2.5 完成任务

- **Method**: `POST`
- **Path**: `/open/v1/project/{projectId}/task/{taskId}/complete`
- **Auth**: Bearer
- **Request Body**: 无

### 响应

- Go 客户端按“空响应体也算成功”处理。
- CLI 最终对用户输出：

```json
{
  "status": "completed",
  "task_id": "task456"
}
```

**实现证据**

- `internal/client/tasks.go:56-63`
- `cmd/task.go:204-219`
- `internal/client/client.go:80-87`

---

### 4.2.6 删除任务

- **Method**: `DELETE`
- **Path**: `/open/v1/project/{projectId}/task/{taskId}`
- **Auth**: Bearer

### 响应

- Go 客户端按“空响应体也算成功”处理。
- CLI 最终对用户输出：

```json
{
  "status": "deleted",
  "task_id": "task456"
}
```

**实现证据**

- `internal/client/tasks.go:65-72`
- `cmd/task.go:221-235`
- `internal/client/client.go:80-87`

---

## 5. 官方 Open API 数据模型

以下字段均来自本地 Go models。

### 5.1 Project

```ts
interface Project {
  id: string
  name: string
  color?: string
  sortOrder: number
  closed: boolean
  kind: string // "TASK" | "NOTE"
}
```

来源：`internal/models/project.go`

### 5.2 Task

```ts
interface Task {
  id: string
  projectId: string
  title: string
  content?: string
  status: number        // 0=normal, 2=completed
  priority?: number     // 0=none, 1=low, 3=med, 5=high
  completedTime?: string | null
  sortOrder: number
  columnId?: string
}
```

来源：`internal/models/task.go`

### 5.3 Column

```ts
interface Column {
  id: string
  projectId: string
  name: string
  sortOrder: number
}
```

来源：`internal/models/column.go`

### 5.4 ProjectData

```ts
interface ProjectData {
  project: Project
  tasks: Task[]
  columns: Column[]
}
```

来源：`internal/models/column.go`

### 5.5 时间字段兼容性

`completedTime` 在 Go 侧通过 `FlexTime` 兼容多种格式：

- `RFC3339Nano`
- `2006-01-02T15:04:05.999999999-0700`
- `RFC3339`
- `2006-01-02T15:04:05-0700`

来源：`internal/models/time.go`

---

## 6. 官方 Open API 错误处理（按 Go CLI 实现）

Go CLI 的统一错误映射：

| HTTP 状态码 | CLI 语义 |
|---|---|
| `401` | `unauthorized: access token expired or invalid` |
| `403` | `forbidden: insufficient permissions` |
| `404` | `not found: resource does not exist` |
| `400` | 优先解析 JSON 中的 `errorMessage`，否则返回 `bad request (status 400)` |
| `500` | `Dida365 server error, try again later` |
| 其他 | `HTTP error: status N` |

### 400 响应体解析约定

```json
{
  "errorMessage": "..."
}
```

来源：`internal/client/client.go:90-113`

---

## 7. 私有 API 端点（来自 dida365-ai-tools 实现）

> 这一节不是来自本地 Go 仓库；它来自 `oymy/dida365-ai-tools` 的源码实现。
>
> 这些接口属于**非官方私有 API**，可能随时变化。

## 7.1 用户设置

### 获取用户设置

- **Method**: `GET`
- **Path**: `/user/preferences/settings`
- **Base URL**: `https://api.dida365.com/api/v2`
- **Auth**: `Cookie: t=HEX_TOKEN`

### 响应模型（已实现字段）

```ts
interface UserSettings {
  timeZone?: string
  startOfWeek?: number
  dateFormat?: string
  timeFormat?: string
  weekStart?: number
  theme?: string
  [key: string]: unknown
}
```

来源：

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

## 7.2 全量同步

### 获取全量同步快照

- **Method**: `GET`
- **Path**: `/batch/check/0`
- **Auth**: Cookie token

### 响应模型（实现中实际消费的字段）

```ts
interface BatchCheckResponse {
  syncTaskBean?: {
    update?: Dida365Task[]
  }
  projectProfiles?: Dida365Project[]
  projectGroups?: Dida365ProjectGroup[]
  tags?: Dida365Tag[]
  inboxId?: string
  [key: string]: unknown
}
```

### SyncService 从中提取的结果

```ts
{
  tasks: raw.syncTaskBean?.update || [],
  projects: raw.projectProfiles || [],
  projectGroups: raw.projectGroups || [],
  tags: raw.tags || [],
  inboxId: raw.inboxId
}
```

来源：

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/services/sync.service.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

## 7.3 已完成任务

### 按时间范围查询已完成任务

- **Method**: `GET`
- **Path**: `/project/all/completed?from={from}&to={to}&limit={limit}`
- **Auth**: Cookie token

### 查询参数

| 参数 | 必需 | 说明 |
|---|---|---|
| `from` | 是 | 格式：`YYYY-MM-DD HH:mm:ss` |
| `to` | 是 | 格式：`YYYY-MM-DD HH:mm:ss` |
| `limit` | 否 | 默认 100 |

### 响应模型

- 返回 `Dida365Task[]`

来源：

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

## 7.4 批量任务操作

### 批量任务写入

- **Method**: `POST`
- **Path**: `/batch/task`
- **Auth**: Cookie token

### 请求体模型

```ts
interface BatchTaskPayload {
  add?: Dida365Task[]
  update?: Dida365Task[]
  delete?: Array<{ taskId: string; projectId: string }>
  addAttachments?: unknown[]
  updateAttachments?: unknown[]
  deleteAttachments?: unknown[]
}
```

### 响应体

- 实现中声明为 `unknown`
- 未在代码中继续约束具体返回结构

来源：

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

### 设置父子任务关系

- **Method**: `POST`
- **Path**: `/batch/taskParent`
- **Auth**: Cookie token

### 请求体模型

```ts
interface TaskParentPayload {
  taskId: string
  parentId: string
  projectId: string
}
```

实际传参为 `TaskParentPayload[]`。

来源：

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

### 跨项目移动任务

- **Method**: `POST`
- **Path**: `/batch/taskProject`
- **Auth**: Cookie token

### 请求体模型

```ts
interface TaskMovePayload {
  taskId: string
  fromProjectId: string
  toProjectId: string
}
```

实际传参为 `TaskMovePayload[]`。

来源：

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

## 7.5 批量项目 / 文件夹 / 标签

### 批量项目操作

- **Method**: `POST`
- **Path**: `/batch/project`

```ts
interface BatchProjectPayload {
  add?: Dida365Project[]
  update?: Dida365Project[]
  delete?: string[]
}
```

### 批量项目文件夹操作

- **Method**: `POST`
- **Path**: `/batch/projectGroup`

```ts
interface BatchProjectGroupPayload {
  add?: Dida365ProjectGroup[]
  update?: Dida365ProjectGroup[]
  delete?: string[]
}
```

### 批量标签操作

- **Method**: `POST`
- **Path**: `/batch/tag`

```ts
interface BatchTagPayload {
  add?: Dida365Tag[]
  update?: Dida365Tag[]
  delete?: string[]
}
```

来源：

- `oymy/dida365-ai-tools/src/core/api-client.ts`
- `oymy/dida365-ai-tools/src/core/types.ts`

---

## 7.6 标签专用接口

### 重命名标签

- **Method**: `PUT`
- **Path**: `/tag/rename`

```json
{
  "name": "oldName",
  "newName": "newName"
}
```

### 合并标签

- **Method**: `PUT`
- **Path**: `/tag/merge`

```json
{
  "from": "fromTag",
  "to": "toTag"
}
```

### 删除标签

- **Method**: `DELETE`
- **Path**: `/tag?name={name1}&name={name2}...`

说明：实现里通过重复 query 参数 `name` 传多个标签名。

来源：`oymy/dida365-ai-tools/src/core/api-client.ts`

---

## 8. 私有 API 主要数据模型（来自 dida365-ai-tools）

> 以下字段是该实现的 TypeScript 类型中明确声明过的字段；不代表服务端只返回这些字段。

### 8.1 Dida365Task

```ts
interface Dida365Task {
  id: string
  projectId: string
  title: string
  content?: string
  desc?: string
  allDay?: boolean
  startDate?: string
  dueDate?: string
  timeZone?: string
  reminders?: string[]
  repeat?: string
  repeatFrom?: string
  repeatFlag?: string
  priority?: number
  status?: number
  completedTime?: string
  completedUserId?: number
  sortOrder?: number
  items?: SubTask[]
  tags?: string[]
  isFloating?: boolean
  modifiedTime?: string
  createdTime?: string
  creator?: number
  etag?: string
  deleted?: number
  kind?: string
  parentId?: string
}
```

### 8.2 Dida365Project

```ts
interface Dida365Project {
  id: string
  name: string
  color?: string
  sortOrder?: number
  closed?: boolean
  groupId?: string
  viewMode?: string
  permission?: string
  kind?: string
  modifiedTime?: string
  etag?: string
  isOwner?: boolean
  inAll?: boolean
}
```

### 8.3 Dida365ProjectGroup

```ts
interface Dida365ProjectGroup {
  id?: string
  name: string
  sortOrder?: number
  etag?: string
  showAll?: boolean
}
```

### 8.4 Dida365Tag

```ts
interface Dida365Tag {
  name: string
  label?: string
  sortOrder?: number
  sortType?: string
  color?: string
  etag?: string
  parent?: string
  rawName?: string
}
```

来源：`oymy/dida365-ai-tools/src/core/types.ts`

---

## 9. CLI 层面的补充事实

### 本地配置文件

- 路径：`~/.dida365/config.json`
- 目录权限：`0700`
- 文件权限：`0600`

### 配置结构

```json
{
  "client_id": "...",
  "client_secret": "...",
  "access_token": "...",
  "token_expiry": "2026-08-21T14:30:00Z",
  "base_url": "https://dida365.com"
}
```

来源：`internal/config/config.go`

### CLI 的标准错误退出码

| 退出码 | 含义 |
|---|---|
| `1` | 配置错误 |
| `2` | 认证错误 |
| `3` | API 错误 |
| `5` | 参数校验错误 |

> 说明：以上是当前命令实现里明确使用到的退出码。`6` 虽出现在项目文档里，但不属于当前代码中可直接验证到的退出路径，因此不纳入实现证据范围。

---

## 10. 明确未纳入本文的内容

以下内容在当前证据中**没有可靠实现依据**，因此不写成正式协议：

- 官方 Open API 的速率限制
- 任何未在源码中出现的私有端点
- 私有 API 各接口完整返回体结构（若实现只标了 `unknown`）
- 官方 Open API 除 `tasks:read tasks:write` 之外的 scope
- 未在 models/types 中出现的字段定义

---

## 11. 最小端点清单

### 官方 Open API / OAuth

| Method | Path |
|---|---|
| GET | `/oauth/authorize` |
| POST | `/oauth/token` |
| GET | `/open/v1/project` |
| GET | `/open/v1/project/{projectId}` |
| GET | `/open/v1/project/{projectId}/data` |
| POST | `/open/v1/task` |
| GET | `/open/v1/project/{projectId}/task/{taskId}` |
| POST | `/open/v1/task/{taskId}` |
| POST | `/open/v1/project/{projectId}/task/{taskId}/complete` |
| DELETE | `/open/v1/project/{projectId}/task/{taskId}` |

### 私有 API

| Method | Path |
|---|---|
| GET | `/user/preferences/settings` |
| GET | `/batch/check/0` |
| GET | `/project/all/completed` |
| POST | `/batch/task` |
| POST | `/batch/taskParent` |
| POST | `/batch/taskProject` |
| POST | `/batch/project` |
| POST | `/batch/projectGroup` |
| POST | `/batch/tag` |
| PUT | `/tag/rename` |
| PUT | `/tag/merge` |
| DELETE | `/tag` |
