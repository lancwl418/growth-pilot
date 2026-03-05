# IdeaMax POD Growth Dashboard — MVP 项目计划

## 1. 项目概述

构建内部 BI 仪表盘，聚合 Shopify 订单/产品/客户数据 + GA4 流量数据，形成单一事实源（Single Source of Truth），提供实时监控、智能提醒和轻量级预测。

**MVP 目标：3 周上线**

---

## 2. 技术栈

| 层级 | 技术选型 |
|---|---|
| 前端框架 | Next.js 16 (App Router) + TypeScript |
| UI 组件 | Tailwind CSS + shadcn/ui |
| 图表 | Recharts |
| 数据库 | PostgreSQL (Neon/Supabase 托管) |
| ORM | Prisma 7 (adapter 模式) |
| 认证 | NextAuth.js + Google OAuth |
| 数据获取 | SWR (客户端) |
| 邮件通知 | Resend |
| 部署 | Vercel + Vercel Cron |

---

## 3. 项目结构

```
growth-pilot/
├── prisma/
│   ├── schema.prisma              # 星型模式：事实表 + 维度表
│   └── seed.ts                    # 默认提醒规则 + 开发数据
├── prisma.config.ts               # Prisma 7 配置（DATABASE_URL）
├── vercel.json                    # Cron 定时任务配置
├── .env.example                   # 环境变量模板
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # 根布局（Providers）
│   │   ├── page.tsx               # 重定向到 /overview
│   │   ├── globals.css            # Tailwind 全局样式
│   │   │
│   │   ├── (auth)/                # 认证页面组
│   │   │   ├── layout.tsx         # 居中布局
│   │   │   └── login/page.tsx     # Google 登录页
│   │   │
│   │   ├── (dashboard)/           # 仪表盘页面组（需认证）
│   │   │   ├── layout.tsx         # 侧边栏 + 顶栏布局
│   │   │   ├── error.tsx          # 错误边界
│   │   │   ├── loading.tsx        # 加载骨架屏
│   │   │   ├── overview/page.tsx  # 概览（Revenue/Orders/AOV/CR）
│   │   │   ├── sales/page.tsx     # 销售分析
│   │   │   ├── traffic/page.tsx   # 流量分析（GA4）
│   │   │   ├── products/page.tsx  # 产品分析
│   │   │   ├── customers/page.tsx # 客户分析
│   │   │   ├── alerts/page.tsx    # 提醒管理
│   │   │   └── forecast/page.tsx  # 预测分析
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts    # NextAuth 处理
│   │       ├── dashboard/                      # 数据 API（需 session）
│   │       │   ├── overview/route.ts
│   │       │   ├── sales/route.ts
│   │       │   ├── traffic/route.ts
│   │       │   ├── products/route.ts
│   │       │   ├── customers/route.ts
│   │       │   └── forecast/route.ts
│   │       ├── alerts/                         # 提醒 CRUD
│   │       │   ├── route.ts                    # GET(列表) + POST(创建规则)
│   │       │   └── [id]/route.ts               # PATCH(确认/忽略)
│   │       ├── sync/                           # 数据同步触发
│   │       │   ├── shopify/orders/route.ts
│   │       │   ├── shopify/products/route.ts
│   │       │   ├── shopify/customers/route.ts
│   │       │   └── ga4/route.ts
│   │       ├── webhooks/shopify/route.ts       # Shopify Webhook 接收
│   │       └── cron/                           # 定时任务（CRON_SECRET 保护）
│   │           ├── daily-sync/route.ts         # 每日同步编排
│   │           ├── alerts/route.ts             # 每日提醒评估
│   │           └── forecast/route.ts           # 每日预测生成
│   │
│   ├── lib/
│   │   ├── prisma.ts              # Prisma 单例客户端
│   │   ├── auth.ts                # NextAuth 配置
│   │   ├── utils.ts               # shadcn/ui 工具函数
│   │   │
│   │   ├── shopify/               # Shopify 集成
│   │   │   ├── client.ts          # GraphQL 客户端（限速 + 重试）
│   │   │   ├── queries.ts         # GraphQL 查询字符串
│   │   │   ├── sync-products.ts   # 产品同步逻辑
│   │   │   ├── sync-customers.ts  # 客户同步逻辑
│   │   │   ├── sync-orders.ts     # 订单同步逻辑 + upsertOrder
│   │   │   └── webhook-verify.ts  # HMAC-SHA256 签名验证
│   │   │
│   │   ├── ga4/                   # GA4 集成（脚手架）
│   │   │   ├── client.ts          # GA4 客户端（待配置凭证）
│   │   │   └── sync-daily.ts      # 每日 GA4 拉取（待实现）
│   │   │
│   │   ├── alerts/                # 提醒系统
│   │   │   ├── rules.ts           # 规则定义 + 默认阈值
│   │   │   ├── engine.ts          # 评估引擎：加载规则→计算指标→对比→生成
│   │   │   └── notify.ts          # Resend 邮件发送
│   │   │
│   │   ├── forecast/              # 预测系统
│   │   │   ├── moving-average.ts  # 7日移动平均 + 星期权重
│   │   │   └── engine.ts          # 预测管道：生成预测 + 更新实际值 + 偏差检测
│   │   │
│   │   ├── queries/               # Prisma 查询构建器
│   │   │   ├── common.ts          # 共享过滤器（日期、已付款订单）
│   │   │   ├── overview.ts        # 概览指标查询
│   │   │   ├── sales.ts           # 销售指标查询
│   │   │   ├── traffic.ts         # 流量指标查询
│   │   │   ├── products.ts        # 产品指标查询
│   │   │   └── customers.ts       # 客户指标查询
│   │   │
│   │   ├── utils/                 # 工具函数
│   │   │   ├── api-helpers.ts     # requireAuth / requireCronSecret / jsonResponse
│   │   │   ├── date.ts            # 日期范围预设 + 格式化
│   │   │   ├── currency.ts        # 货币格式化
│   │   │   ├── percentage.ts      # 百分比变化计算
│   │   │   └── hash.ts            # SHA256 邮件哈希
│   │   │
│   │   └── validators/            # Zod 校验
│   │       ├── date-range.ts      # 日期范围参数校验
│   │       └── alert-rules.ts     # 提醒规则校验
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 基础组件（16个）
│   │   ├── layout/                # 布局组件
│   │   │   ├── sidebar.tsx        # 侧边导航栏
│   │   │   ├── topbar.tsx         # 顶栏（用户头像 + 下拉菜单）
│   │   │   ├── mobile-nav.tsx     # 移动端导航
│   │   │   └── providers.tsx      # SessionProvider + TooltipProvider
│   │   ├── dashboard/             # 仪表盘组件
│   │   │   ├── kpi-card.tsx       # KPI 卡片（值 + 迷你图 + 对比）
│   │   │   ├── kpi-grid.tsx       # KPI 网格布局
│   │   │   ├── sparkline.tsx      # 迷你面积图
│   │   │   ├── period-comparison.tsx  # 环比标签（+12.3%/-5.1%）
│   │   │   ├── metric-skeleton.tsx    # 加载骨架屏
│   │   │   └── date-range-picker.tsx  # 日期范围选择器
│   │   ├── charts/                # Recharts 封装
│   │   │   ├── line-chart.tsx     # 折线图
│   │   │   ├── bar-chart.tsx      # 柱状图
│   │   │   ├── area-chart.tsx     # 面积图
│   │   │   ├── donut-chart.tsx    # 环形图
│   │   │   └── chart-tooltip.tsx  # 自定义提示框
│   │   ├── tables/                # 表格组件
│   │   │   ├── data-table.tsx     # 通用排序分页表格
│   │   │   ├── products-table.tsx # 产品排行表格
│   │   │   └── customers-table.tsx # 客户排行表格
│   │   ├── alerts/                # 提醒组件
│   │   │   ├── alert-badge.tsx    # 严重级别标签
│   │   │   ├── alert-card.tsx     # 单条提醒卡片
│   │   │   └── alert-list.tsx     # 提醒列表
│   │   └── forecast/              # 预测组件
│   │       ├── forecast-chart.tsx # 预测 vs 实际折线图
│   │       └── forecast-table.tsx # 预测详情表格
│   │
│   ├── hooks/                     # React Hooks
│   │   ├── use-auth.ts            # 认证守卫
│   │   ├── use-dashboard-data.ts  # SWR 数据获取
│   │   └── use-date-range.ts      # 日期范围状态管理
│   │
│   └── types/                     # TypeScript 类型定义
│       ├── next-auth.d.ts         # NextAuth 类型扩展
│       ├── shopify.ts             # Shopify API 响应类型
│       ├── ga4.ts                 # GA4 API 响应类型
│       ├── dashboard.ts           # 仪表盘指标类型
│       ├── alerts.ts              # 提醒类型
│       └── forecast.ts            # 预测类型
```

**总计：110 个源文件**（含 16 个 shadcn/ui 组件）

---

## 4. 数据库模型（星型模式）

### 维度表
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `dim_products` | 产品维度 | shopify_id, title, vendor, product_type, tags, status |
| `dim_variants` | 变体维度 | shopify_id, product_id, title, sku, price |
| `dim_customers` | 客户维度 | shopify_id, email_hash(SHA256), orders_count, total_spent |

### 事实表
| 表名 | 说明 | 关键字段 |
|---|---|---|
| `fact_orders` | 订单事实 | shopify_id, order_date, financial_status, total_price, total_refund |
| `fact_order_items` | 订单明细 | order_id, product_id, variant_id, quantity, price |
| `fact_ga4_daily` | GA4 每日聚合 | date, channel_group, source_medium, sessions, users |

### 应用表
| 表名 | 说明 |
|---|---|
| `alerts` | 已触发的提醒记录 |
| `alert_rules` | 提醒规则配置（类型、阈值、对比周期） |
| `forecast_daily` | 每日预测值 + 实际值 + 偏差 |
| `sync_log` | 同步日志（状态、游标、记录数） |

### 认证表（NextAuth）
`users`, `accounts`, `sessions`, `verification_tokens`

### 关键索引
- `fact_orders`: `[order_date, financial_status]` 复合索引（加速收入查询）
- `fact_ga4_daily`: `[date, channel_group, source_medium, campaign_name]` 唯一约束（幂等 upsert）
- `dim_customers`: `[email_hash]`, `[last_order_at]`

---

## 5. API 路由设计

### 仪表盘数据 API（需 session 认证）

所有路由接受 `startDate`, `endDate`，可选 `compareStart`, `compareEnd`。

| 路由 | 方法 | 返回 |
|---|---|---|
| `/api/dashboard/overview` | GET | 收入、订单、AOV、CR、迷你图、环比 |
| `/api/dashboard/sales` | GET | 收入时间序列、渠道分布、退款汇总 |
| `/api/dashboard/traffic` | GET | 会话时间序列、渠道占比、Top 来源 |
| `/api/dashboard/products` | GET | Top 产品排行、趋势 |
| `/api/dashboard/customers` | GET | 新客/回头客、复购率、Top 客户 |
| `/api/dashboard/forecast` | GET | 预测值 vs 实际值、偏差提醒 |

### 提醒管理 API

| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/alerts` | GET | 列表（支持 status/ruleType 过滤 + 分页） |
| `/api/alerts` | POST | 创建提醒规则 |
| `/api/alerts/[id]` | PATCH | 确认/忽略提醒 |

### 数据同步 API（CRON_SECRET 保护）

| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/sync/shopify/products` | POST | 触发产品同步 |
| `/api/sync/shopify/customers` | POST | 触发客户同步 |
| `/api/sync/shopify/orders` | POST | 触发订单同步（支持增量） |
| `/api/sync/ga4` | POST | 触发 GA4 每日拉取 |
| `/api/webhooks/shopify` | POST | 接收 Shopify Webhook（HMAC 验证） |

### Cron 定时任务（Vercel Cron）

| 路由 | 时间 | 说明 |
|---|---|---|
| `/api/cron/daily-sync` | 每天 06:00 UTC | 编排全量同步（产品→客户→订单48h增量） |
| `/api/cron/forecast` | 每天 07:00 UTC | 生成未来 7 天预测 + 更新实际值 |
| `/api/cron/alerts` | 每天 08:00 UTC | 评估所有启用的规则 + 发送邮件 |

---

## 6. 仪表盘页面设计

### 6.1 Overview（概览）
- **KPI 网格**：Revenue / Orders / AOV / Conversion Rate（或 Sessions）
- 每个 KPI 卡片：当前值 + 迷你图 + 环比变化标签
- **收入趋势图**：折线图展示日收入

### 6.2 Sales（销售分析）
- **KPI**：总收入 / 总订单 / 退款率 / 退款总额
- **收入时间序列**：面积图
- **渠道分布**：柱状图（按 sourceName 分组）

### 6.3 Traffic（流量分析）
- **KPI**：Sessions / Users
- **会话趋势**：双折线图（Sessions + Users）
- **渠道占比**：环形图
- **Top 来源**：排序表格
- 未配置 GA4 时显示空状态引导页

### 6.4 Products（产品分析）
- **KPI**：活跃产品数 / 总销量
- **Top 产品柱状图**：按收入排序前 10
- **产品排行表格**：可排序（收入/销量/订单数）

### 6.5 Customers（客户分析）
- **KPI**：新客数 / 回头客数 / 30天复购率 / 90天复购率
- **新客 vs 回头客**：双环形图（订单数 + 收入）
- **Top 客户表格**：按消费金额排序

### 6.6 Alerts（提醒管理）
- **Tab 切换**：Active / All
- **提醒卡片列表**：严重级别标签 + 标题 + 描述 + 时间
- **操作按钮**：确认 / 忽略

### 6.7 Forecast（预测分析）
- **Tab 切换**：Revenue / Orders
- **预测 vs 实际图**：双折线图（实线 = 实际，虚线 = 预测）
- **预测详情表格**：日期 / 预测值 / 实际值 / 偏差百分比
- **偏差提醒列表**

---

## 7. 提醒规则（MVP 默认）

| 规则类型 | 指标 | 阈值 | 对比基准 |
|---|---|---|---|
| `revenue_drop` | 收入 | 下降 >20% | 上周同日 |
| `cr_drop` | 转化率 | 下降 >15% | 昨日 |
| `sessions_drop` | 会话数 | 下降 >30% | 上周同日 |
| `sessions_spike` | 会话数 | 上升 >50% | 上周同日 |
| `product_spike` | 产品销量 | 上升 >100% | 上周同日 |

**严重级别判断**：
- 偏差 ≥ 2× 阈值 → `critical`
- 偏差 ≥ 1.5× 阈值 → `warning`
- 其他 → `info`

**通知方式**：Resend 邮件（HTML 模板，含严重级别颜色标识）

---

## 8. 预测方法（MVP）

**算法：7日移动平均 + 星期权重调整**

```
对于未来 7 天中的每一天 (D+1 到 D+7)：
  1. 计算 7 日移动平均：ma7 = AVG(过去 7 天指标值)
  2. 计算星期权重因子：
     dowFactor = AVG(过去 4 周该星期几的值) / ma7
  3. 最终预测值：predicted = ma7 × dowFactor
```

**偏差检测**：
- 实际值产生后自动更新 `forecast_daily.actual_value`
- 计算偏差百分比：`(actual - predicted) / predicted × 100`
- 偏差 > 20% 时触发提醒

---

## 9. 数据同步管道

### Shopify 同步架构

**初始全量同步（Backfill）**：
1. 触发 `POST /api/sync/shopify/products` → 游标分页拉取所有产品/变体 → upsert
2. 触发 `POST /api/sync/shopify/customers` → 游标分页拉取所有客户 → 邮件哈希 → upsert
3. 触发 `POST /api/sync/shopify/orders` → 游标分页拉取所有订单/明细 → upsert + 更新客户聚合

**增量同步（Webhook + Cron）**：
- **Webhook**：接收 `orders/create` + `orders/updated` → HMAC 验证 → upsert 订单
- **每日 Cron**：拉取过去 48 小时更新的订单（安全重叠窗口）→ 幂等 upsert

**健壮性设计**：
- 所有 upsert 基于 `shopify_id` 唯一约束（幂等）
- `sync_log` 记录游标位置，失败后可恢复
- GraphQL 客户端自动处理限速（429 重试 + query cost 检测）

### GA4 同步（脚手架）

已搭建完整接口和类型，待配置 `GA4_PROPERTY_ID` + `GA4_CREDENTIALS_JSON` 环境变量后启用。

---

## 10. 实施阶段与里程碑

### Phase 1：基础搭建（Day 1-3）✅ 已完成

| 任务 | 状态 |
|---|---|
| 创建 Next.js 项目 + 安装依赖 | ✅ |
| Prisma 星型模式设计 + 客户端配置 | ✅ |
| Google OAuth 认证（NextAuth + Prisma Adapter） | ✅ |
| 仪表盘布局（侧边栏/顶栏/移动端导航） | ✅ |
| 7 个占位页面 + 日期范围选择器 | ✅ |

### Phase 2：Shopify 同步管道（Day 4-7）✅ 已完成

| 任务 | 状态 |
|---|---|
| Shopify GraphQL 客户端（限速/重试） | ✅ |
| 产品/客户/订单同步逻辑 | ✅ |
| Webhook 接收器（HMAC 验证） | ✅ |
| 每日 Cron 增量同步 | ✅ |
| GA4 脚手架 | ✅ |

### Phase 3：仪表盘页面（Day 8-13）✅ 已完成

| 任务 | 状态 |
|---|---|
| 共享组件（KPI 卡片/迷你图/骨架屏） | ✅ |
| 图表封装（折线/柱状/面积/环形） | ✅ |
| Overview + Sales 页面 | ✅ |
| Products 页面 | ✅ |
| Customers 页面 | ✅ |
| Traffic 页面（含 GA4 空状态） | ✅ |

### Phase 4：提醒 + 预测（Day 14-17）✅ 已完成

| 任务 | 状态 |
|---|---|
| 提醒规则引擎 + 评估逻辑 | ✅ |
| Resend 邮件通知 | ✅ |
| 提醒 CRUD API + UI | ✅ |
| 7日移动平均预测引擎 | ✅ |
| 预测图表 + 表格 UI | ✅ |
| 偏差检测 + 提醒 | ✅ |

### Phase 5：打磨 + 部署（Day 18-21）⏳ 待完成

| 任务 | 状态 |
|---|---|
| 错误边界 + 加载状态 | ✅ |
| 响应式设计调优 | ⏳ |
| Vercel 部署 + 环境变量配置 | ⏳ |
| 生产数据库迁移 | ⏳ |
| 初始 Shopify 同步 | ⏳ |
| Webhook 注册 | ⏳ |
| 端到端测试 | ⏳ |

---

## 11. 环境变量

```bash
# 数据库（Neon / Supabase PostgreSQL）
DATABASE_URL="postgresql://user:password@host:5432/growth_pilot?sslmode=require"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                    # openssl rand -base64 32

# Google OAuth（Google Cloud Console 获取）
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 邮箱白名单（逗号分隔）或域名
ALLOWED_EMAILS=user@example.com
# ALLOWED_DOMAIN=example.com

# Shopify
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_API_VERSION=2025-01
SHOPIFY_WEBHOOK_SECRET=

# GA4（后续配置）
# GA4_PROPERTY_ID=properties/123456789
# GA4_CREDENTIALS_JSON=             # Base64 编码的服务账号 JSON

# Cron 安全密钥
CRON_SECRET=                        # openssl rand -base64 32

# 邮件通知（Resend）
RESEND_API_KEY=re_xxxxx
ALERT_EMAIL_RECIPIENTS=you@example.com
```

---

## 12. 上线部署步骤

### Step 1：数据库
```bash
# 在 Neon/Supabase 创建 PostgreSQL 数据库
# 复制连接字符串到 .env 的 DATABASE_URL
cp .env.example .env
# 编辑 .env 填入实际值

# 运行数据库迁移
npx prisma migrate dev --name init

# 初始化默认提醒规则
npx tsx prisma/seed.ts
```

### Step 2：Google OAuth
1. 前往 Google Cloud Console → APIs & Services → Credentials
2. 创建 OAuth 2.0 Client ID（Web application）
3. 设置 Authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. 将 Client ID 和 Client Secret 填入 `.env`

### Step 3：Shopify
1. 在 Shopify 后台创建 Custom App
2. 授予权限：`read_products`, `read_orders`, `read_customers`
3. 获取 Admin API Access Token，填入 `.env`
4. 触发初始同步：
```bash
curl -X POST http://localhost:3000/api/sync/shopify/products \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST http://localhost:3000/api/sync/shopify/orders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Step 4：Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod

# 在 Vercel Dashboard 配置环境变量
# 确认 Cron Jobs 已注册（Settings → Cron Jobs）
```

### Step 5：注册 Shopify Webhooks
```bash
# 在 Shopify 后台 Settings → Notifications → Webhooks
# 添加 orders/create 和 orders/updated
# URL: https://yourdomain.com/api/webhooks/shopify
```

---

## 13. 验收标准

- [ ] 仪表盘主页面加载 < 10 秒
- [ ] Shopify 订单数据延迟 < 1 小时（Webhook 实时更新）
- [ ] GA4 数据按日更新
- [ ] 每日自动生成提醒并发送邮件
- [ ] 预测有可解释的基线，偏差提示正常工作
- [ ] 所有页面移动端响应式适配
- [ ] 登录/认证流程正常（未登录跳转登录页）

---

## 14. Phase 2 扩展规划（4-8 周）

- [ ] 接入广告花费（Google Ads / Meta）：ROI、MER、CAC
- [ ] 更精确归因：UTM 全链路 / Server-side Tracking
- [ ] Cohort 分析：复购曲线、LTV（30/60/90）
- [ ] SKU 供应链预警：销量预测 → 生产/库存建议
- [ ] 建议引擎：根据数据给出行动建议
- [ ] 导出功能：CSV / PDF 报表
- [ ] Agency 只读权限
