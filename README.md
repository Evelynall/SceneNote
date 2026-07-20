# SceneNote

SceneNote 是一个面向影视创作者的手机优先 Web 应用：在观看影片时独立计时，并快速记录情绪爆点、音乐节点、镜头语言、台词、转场和必剪片段。它不是播放器。

## 项目理念

### 为什么制作 SceneNote

影视创作者在观看影片时，常常会遇到灵感出现但无法快速记录的问题。传统的笔记方式要么打断观看体验，要么事后遗忘关键细节。

SceneNote 解决的核心问题是：**如何在不打断观看的前提下，快速捕捉影片中的精彩瞬间，为后续剪辑和分析提供可靠的素材库。**

### 核心原则

1. **不打断观看体验** — 极简的交互设计，让记录操作尽可能快速、轻盈
2. **快速记录** — 两次点击即可完成一条 Marker 记录，不占用过多注意力
3. **让观看记录服务剪辑** — 所有记录最终都能导出为结构化数据，直接用于剪辑流程

## 功能特性

- **独立计时器**：不受系统时间影响的单调时钟，支持暂停、继续和手动校时
- **快速记录**：两次点击即可完成的 Marker 记录，支持 7 种类型（含自定义）
- **时间轴管理**：点击卡片直接编辑，支持添加、修改、删除时间节点
- **项目管理**：创建、删除、批量导入导出项目，支持项目状态管理
- **观看会话**：记录同一作品的多次观看过程
- **标签系统**：支持多标签分类、搜索、整理
- **标题编辑**：点击标题即可修改项目名称
- **滑动导航**：上下滑动在项目管理、观看、时间轴之间切换
- **动画过渡**：页面切换和交互动画流畅自然
- **PWA 支持**：可安装到手机桌面，支持离线使用

## 典型使用流程

```
观看影片
    ↓
启动 SceneNote 计时
    ↓
发现重要片段
    ↓
快速记录 Marker（选择类型 + 添加备注）
    ↓
观看结束
    ↓
查看时间轴（浏览、编辑、筛选）
    ↓
开始剪辑整理（导出 JSON 用于后期制作）
```

## 使用场景

### 混剪制作

记录影片中的精彩片段，为混剪收集素材：
- 🔥 情绪爆发 — 高潮时刻、感人场景
- 🎵 音乐节点 — BGM 变化、音效亮点
- ⭐ 必剪片段 — 核心画面、关键镜头

### 影视分析

深入分析影片的创作手法：
- 🎬 镜头设计 — 构图、运镜、景别变化
- 💬 台词 — 关键对话、独白、伏笔
- ⚡ 转场 — 剪辑手法、场景切换

### 二次创作

为二次创作收集灵感素材：
- ⚡ 转场灵感 — 独特的剪辑技巧
- 🎵 BGM 记录 — 适合作为配乐的片段
- 📌 自定义标记 — 根据个人需求标记的内容

## 技术栈

- Vue 3 + Vite + TypeScript
- Pinia：项目、计时器与 Marker 状态管理
- Vue Router：页面路由
- IndexedDB：本地持久化存储
- 原生 CSS：轻量、手机优先的暗色界面

## 安装方式

需要 Node.js 22.12 或更高版本。

```bash
npm install
```

## 开发方式

```bash
npm run dev
```

## 构建方式

```bash
npm run build
```

## PWA 安装

部署构建产物后，可在手机浏览器的菜单中选择"添加到主屏幕"或"安装应用"。首次访问会缓存应用基础资源，之后可在离线状态下打开已缓存的应用。

## 页面说明

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 创建新项目入口，有项目时自动跳转项目管理页 |
| 项目管理 | `/projects` | 项目列表、创建、删除、批量导入导出 |
| 观看 | `/watch/:projectId` | 计时器、记录瞬间、标题编辑 |
| 时间轴 | `/timeline/:projectId` | 时间节点列表、编辑、添加、单项目导入导出 |

## 目录约定

```text
src/
├── assets/                 # 静态资源
├── components/             # 可复用界面组件
│   ├── dialog/             # 通用弹窗组件与服务
│   ├── MarkerButton.vue    # 记录瞬间按钮（含动画）
│   ├── MarkerCard.vue      # 时间轴卡片（点击编辑）
│   ├── ProjectHeader.vue   # 项目标题头（可点击编辑）
│   ├── SwipeGesture.vue    # 滑动手势组件
│   ├── Timeline.vue        # 时间轴列表组件
│   └── Timer.vue           # 计时器组件（校时开关）
├── views/                  # 路由页面
│   ├── Home.vue            # 首页
│   ├── ProjectManager.vue  # 项目管理页面
│   ├── TimelineView.vue    # 时间轴页面
│   └── Watch.vue           # 观看页面
├── stores/project.ts       # 项目、计时器、Marker 状态管理
├── database/indexedDB.ts   # IndexedDB 数据访问（含版本迁移）
├── services/storage.ts     # 存储服务接口封装
├── types/                  # 稳定数据类型定义
│   ├── common.ts           # 通用类型（MarkerType, ProjectStatus, TagCategory）
│   ├── project.ts          # Project 接口
│   ├── session.ts          # WatchSession 接口
│   ├── marker.ts           # Marker 接口
│   ├── tag.ts              # Tag 接口
│   └── index.ts            # 类型导出聚合
├── utils/                  # 工具函数
│   ├── json.ts             # JSON 序列化、导入导出（含版本兼容）
│   ├── marker.ts           # Marker 类型配置
│   └── time.ts             # 时间格式化、解析
├── router/index.ts         # 路由定义
├── App.vue                 # 根组件（页面切换动画）
└── main.ts                 # 应用入口
```

## 数据结构说明

### 对象关系

```
Project（项目）
    ├── 一对多 ── WatchSession（观看会话）
    ├── 包含 ── Marker（时间节点）
    └── 关联 ── Tag（标签）

Marker（时间节点）
    └── 关联 ── Tag（标签）
```

### Project

表示一个影视作品分析项目：

```ts
interface Project {
  id: string
  title: string             // 当前显示名称
  originalTitle?: string    // 原始名称，例如英文名
  description?: string      // 项目备注
  cover?: string            // 预留封面地址
  status: ProjectStatus     // 项目状态
  duration?: number         // 当前计时时长（秒）
  tags: string[]            // 项目标签
  sessions: WatchSession[]  // 观看会话列表
  markers: Marker[]         // 记录列表
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}
```

### WatchSession

表示一次观看行为：

```ts
interface WatchSession {
  id: string
  projectId: string         // 所属项目 ID
  name?: string             // 会话名称，如"第一次观看"
  startTime: number         // 开始时间戳
  endTime?: number          // 结束时间戳
  duration?: number         // 持续时长（秒）
  markers: string[]         // 本次会话产生的 Marker ID 列表
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}
```

### Marker

核心对象，表示电影中某个值得记录的时间点：

```ts
interface Marker {
  id: string
  projectId: string         // 所属项目 ID
  sessionId?: string        // 所属观看会话 ID
  time: number              // 秒数
  timeText: string          // 格式化时间文本
  endTime?: number          // 结束时间（可选，用于记录片段范围）
  type: MarkerType          // 记录类型
  title?: string            // 简短标题
  note: string              // 详细备注
  tags: string[]            // 标签数组
  rating: number            // 1-5 分，表示剪辑价值
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}
```

### Tag

用于分类、搜索、整理：

```ts
interface Tag {
  id: string
  name: string              // 标签名称
  color?: string            // 标签颜色
  category?: TagCategory    // 标签分类
  createdAt: number
  updatedAt: number
}
```

### MarkerType

```ts
type MarkerType = 'emotion' | 'music' | 'shot' | 'dialogue' | 'transition' | 'favorite' | 'custom'
```

### ProjectStatus

```ts
type ProjectStatus = 'planned' | 'watching' | 'finished' | 'reviewing' | 'editing'
```

### TagCategory

```ts
type TagCategory = 'emotion' | 'character' | 'theme' | 'style' | 'custom'
```

| 分类 | 示例 |
|------|------|
| emotion | 高潮、孤独、悲伤 |
| character | 英雄、反派、关系 |
| theme | 成长、牺牲 |
| style | 慢镜头、长镜头 |

## Marker 类型说明

| 类型 | 表情 | 说明 |
|------|------|------|
| emotion | 🔥 | 情绪爆发 |
| music | 🎵 | 音乐节点 |
| shot | 🎬 | 镜头设计 |
| dialogue | 💬 | 台词 |
| transition | ⚡ | 转场 |
| favorite | ⭐ | 必剪片段 |
| custom | 📌 | 用户自定义 |

## 导入导出

### 单项目导入导出

在时间轴页面可导出单个项目为 JSON 文件，或导入单项目文件。

### 批量导入导出

在项目管理页面可：
- 导出所有项目为一个 JSON 文件（文件名包含日期）
- 导入批量导出文件或单项目文件

### JSON 格式

导出的 JSON 包含版本管理信息：

```json
{
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "exportTime": 1784517013000,
  "data": {
    "projects": [...],
    "tags": [...]
  }
}
```

## Roadmap

### 当前版本

已完成：

- 项目管理（创建、删除、状态管理）
- 独立时间记录（暂停、继续、手动校时）
- Marker 记录（7 种类型、多标签、评分）
- 时间轴查看与编辑
- 观看会话记录
- JSON 导入导出（单项目/批量）
- PWA 支持（可安装、离线使用）

### 后续计划

**短期：**
- 时间轴筛选功能
- Marker 搜索优化
- 更多排序方式

**中期：**
- 图片截图支持
- Supabase 云同步

**长期：**
- AI 镜头分析
- 自动总结

> **注意**：Roadmap 仅为规划，不代表承诺实现时间。

## 代码规范

- 所有主要数据对象必须包含 `id`、`createdAt`、`updatedAt`
- 所有主要数据对象保留 `metadata` 字段用于未来扩展
- 不提前定义未知字段
- 保持数据结构稳定，避免频繁修改