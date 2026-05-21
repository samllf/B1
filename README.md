# 团餐营收管理系统

一个完整的企业级团餐营收管理单页应用，支持多项目管理、实时营收看板、批量营收录入、Excel导入导出、数据大屏等功能。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design 5
- **图表**: Recharts 2
- **状态管理**: Redux Toolkit
- **Excel 处理**: SheetJS (xlsx)
- **测试**: Vitest + Testing Library
- **代码规范**: ESLint + TypeScript

## 功能特性

### 1. 多项目管理
- 创建/编辑/删除项目（名称、地点、日期、状态）
- 项目列表分页（每页5条），支持按名称搜索
- 项目状态：进行中、已暂停、已完成

### 2. 实时营收看板
- 选中项目的今日实时营收趋势（折线图，横轴0-23小时）
- 数据每10秒自动刷新（模拟后端轮询）
- 点击图表某小时弹窗显示该小时各档口营收明细
- 顶部KPI卡片：今日累计营收、订单数、客单价

### 3. 批量营收录入
- 动态表单（可增减行），每行包含档口、早/午/晚/夜宵/外卖的金额和订单数
- 前端校验（档口名称非空、金额非负）
- 一次性提交保存

### 4. 数据导入导出
- 按项目 + 时间范围导出 Excel
- 导入 Excel 支持覆盖/追加模式
- 同一天同档口重复时提示冲突处理

### 5. 数据大屏模式
- 一键切换全屏大屏模式（隐藏侧边栏和底部导航）
- 大屏下自动刷新间隔5秒
- 包含营收趋势图、档口占比饼图、档口排行、实时数据流

### 6. 性能优化
- 图表渲染使用防抖/节流
- 数据轮询可控（可暂停/恢复）

### 7. 错误处理与用户体验
- 所有请求有 loading 状态
- 错误时显示错误信息和重试按钮
- 表单未保存离开时有确认提示
- 删除重要数据需二次确认（Popconfirm）

### 8. 代码架构
- Redux Toolkit 状态管理
- API 层单独封装，支持请求取消（AbortController）
- 支持暗色/亮色主题切换

### 9. 测试与工程化
- 至少3个单元测试（核心工具函数：validateRevenueEntry、validateRevenueEntries、validateProjectForm、formatAmount、formatNumber）
- ESLint 配置

### 10. 移动端适配
- 响应式布局，手机端底部导航栏切换页面
- 表格横向滚动适配

### 11. 加分项
- Service Worker 离线缓存支持
- 乐观更新（模拟新增记录即时显示在图表）
- WebSocket 模拟（通过轮询模拟）
- web-vitals 指标输出

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 构建生产版本
npm run build

# ESLint 检查
npm run lint
```

## 项目结构

```
src/
├── api/              # API 层（AbortController 封装）
│   ├── client.ts     # API 客户端（请求取消支持）
│   ├── mock.ts       # Mock 数据与模拟延迟
│   ├── projects.ts   # 项目 API
│   └── revenue.ts    # 营收 API
├── components/
│   └── Layout/
│       └── AppLayout.tsx  # 主布局（侧边栏+顶栏+底部导航）
├── hooks/
│   ├── useDebounce.ts     # 防抖/节流 Hook
│   ├── usePolling.ts      # 轮询 Hook
│   └── useRouteGuard.ts   # 路由守卫（未保存提示）
├── pages/
│   ├── BigScreen/        # 数据大屏
│   ├── Dashboard/        # 实时营收看板
│   ├── DataIO/           # 导入导出
│   ├── Projects/         # 项目管理
│   └── RevenueEntry/     # 批量营收录入
├── store/               # Redux Toolkit Store
│   ├── index.ts
│   ├── projectSlice.ts
│   ├── revenueSlice.ts
│   ├── themeSlice.ts
│   └── uiSlice.ts
├── types/               # TypeScript 类型定义
│   └── index.ts
├── utils/
│   ├── excel.ts        # Excel 导入导出工具
│   └── validation.ts   # 表单验证工具
├── __tests__/          # 单元测试
│   └── validation.test.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 使用说明

1. 启动应用后进入**项目管理**页面
2. 创建新项目或选择已有项目
3. 点击项目名称进入**营收看板**查看实时数据
4. 在**营收录入**页面批量录入各档口营收
5. 使用**导入导出**功能备份和恢复数据
6. 点击**数据大屏**进入全屏展示模式

## 模拟数据说明

系统启动时会自动为"进行中"的项目生成本日模拟营收数据。轮询过程中会随机生成新的营收记录，模拟实时数据流。

## License

MIT
