# IdeaMax Growth Dashboard — Marketing Analytics 升级 Spec

## 背景与目标

当前 dashboard 衡量营销看的是「量」(sessions、首单 ROAS)。本次升级新增 3 个衡量「质」的分析工具(渠道质量、CAC 趋势、营销漏斗),核心问题是:**哪个渠道带来的客户会复购**,而不只是带来第一单。

本 spec 必须严格贴合现有架构:
- 数据查询写成 `src/lib/queries/*.ts` 纯函数,复用 `src/lib/queries/common.ts` 的 filter helper
- API route 放 `src/app/api/dashboard/*/route.ts`,用 `requireAuth` + `parseDateRangeParams`
- 页面用现有 shadcn 组件(Card / KpiCard / KpiGrid / 现有 chart 组件)
- 所有文案走 i18n(`src/lib/i18n/translations.ts`),中英双语
- 类型加进 `src/types/dashboard.ts`

---

## ⚠️ 前置任务(必须先做,否则分析数据会被污染/不准)

### 前置 1:测试/内部账号排除

现状:`lancwl418@gmail.com` 等内部测试账号会被算进所有分析。`dim_customers` 存的是 `emailHash`(SHA256),没有排除机制。

要做:
1. Prisma migration:`dim_customers` 增加字段 `is_internal Boolean @default(false) @map("is_internal")`,并加索引 `@@index([isInternal])`。
2. 写一个一次性脚本 `scripts/mark-internal-customers.ts`:接收一组明文 email,用现有 `src/lib/utils/hash.ts` 的 `hashEmail()` 算出 hash,把 `dim_customers` 中匹配的行 `is_internal = true`。初始名单先放一个:`lancwl418@gmail.com`(脚本里写成数组常量,方便以后加)。脚本可用 `npx tsx scripts/mark-internal-customers.ts` 运行。
3. 在 `src/lib/queries/common.ts` 新增一个 helper:
   ```ts
   // 排除内部测试客户的订单。用于所有客户/营销分析。
   // 注意:customerId 为 null 的订单(游客)保留——它们不是内部账号。
   export function excludeInternalFilter(): Prisma.FactOrderWhereInput {
     return {
       OR: [
         { customerId: null },
         { customer: { is: { isInternal: false } } },
       ],
     };
   }
   ```
4. 新增一个组合 helper,后续营销分析统一用它:
   ```ts
   export function marketingOrderFilter(startDate: string, endDate: string): Prisma.FactOrderWhereInput {
     return { ...paidOrderFilter(startDate, endDate), ...excludeInternalFilter() };
   }
   ```
   不要改动现有的 `paidOrderFilter`(其它页面仍在用,避免回归)。

### 前置 2:补 `landingSite` 到订单同步

现状:`fact_orders.landingSite` 字段在 schema 里存在,但 `ORDERS_QUERY`(`src/lib/shopify/queries.ts`)没有拉取,`upsertOrder`(`src/lib/shopify/sync-orders.ts`)也没写入,所以现有数据该字段为空。

要做:
1. `ORDERS_QUERY` 在 order node 上增加字段:`landingPageUrl` 和 `referrerUrl`(Shopify GraphQL Order 上的字段;若 API version 不支持 `landingPageUrl`,用 `customerJourneySummary { firstVisit { landingPage referrerUrl } }` 作为后备——请先确认当前 `SHOPIFY_API_VERSION`=2025-01 支持哪种,并在最终报告里说明你用了哪个)。
2. `src/types/shopify.ts` 的 `ShopifyOrder` 接口补上对应字段。
3. `upsertOrder` 在 create/update 时写入 `landingSite`(存 landing page URL 全串即可,解析留给查询层)。
4. **重要**:已同步的历史订单该字段为空,需要重跑一次订单全量同步才能回填。在最终报告里提示用户:「需要在 Settings 页手动触发一次 Orders 全量同步以回填 landingSite」。不要自动触发。

---

## 工具一:渠道质量分析(Channel Quality)

**问题:哪个获客渠道带来的客户会复购、LTV 高?**

### 数据逻辑
- 「获客渠道」= 每个客户**首单**的来源。来源优先级:解析首单 `landingSite` 的 UTM 参数(`utm_source` / `utm_medium`),解析不到则退回 `sourceName`,再不行标记 `(direct/unknown)`。
- 写一个工具函数 `parseChannel(landingSite: string | null, sourceName: string | null): string`,放在 `src/lib/queries/channel-quality.ts` 内部。规则简单即可:有 utm_source 就用 `utm_source / utm_medium`,否则用 sourceName,否则 `(direct)`。
- 对每个渠道聚合(只统计**非内部**客户,用 `marketingOrderFilter` + 客户首单落在所选日期区间内):
  - `newCustomers`:首单在该区间、且首单归属此渠道的客户数
  - `repeatCustomers`:上述客户中,**生命周期内**下过 ≥2 单的人数(用 `dim_customers.ordersCount >= 2`)
  - `repeatRate` = repeatCustomers / newCustomers
  - `avgLtv` = 这批客户的 `dim_customers.totalSpent` 平均值
  - `totalLtv` = 这批客户 totalSpent 之和

### 实现
- `src/lib/queries/channel-quality.ts`:导出 `getChannelQuality(startDate, endDate): Promise<ChannelQuality>`
- 思路:先查区间内 `marketingOrderFilter` 的订单 → 拿到 customerId 集合 → join `dim_customers` 取 `firstOrderAt` / `ordersCount` / `totalSpent` / 首单的 landingSite+sourceName → 只保留 `firstOrderAt` 落在区间内的客户(即「该区间的新客」)→ 按 parseChannel 分组聚合。
- 注意:首单的 landingSite 需要从该客户最早那笔订单取。可以先按 customerId 分组取最早订单。N+1 查询要避免,用 `findMany` 一次取齐再在内存聚合。

### API
`src/app/api/dashboard/channel-quality/route.ts`,照搬 `customers/route.ts` 模式。

### 页面
新增导航项 + 页面 `src/app/(dashboard)/channels/page.tsx`:
- 顶部 KpiGrid:总新客数、整体复购率、平均 LTV、表现最好的渠道名
- 一个表格(用现有 table 模式,参考 `ga4-tab.tsx` 里的渠道表):列 = 渠道 / 新客数 / 复购率 / 平均LTV / 总LTV,按总LTV 降序。复购率 ≥20% 标绿,<10% 标红(参考现有 ROAS 着色写法)。
- 一个柱状图(`DashboardBarChart`):x=渠道,bar=复购率,直观看哪个渠道留得住人。

---

## 工具二:CAC 趋势(获客成本)

**问题:拉一个新客多少钱?在变贵吗?**

### 数据逻辑
- 按月:`CAC = 当月广告花费 / 当月新客数`
- 广告花费 = `fact_ga4_daily.adCost` 之和 + `fact_meta_ads_daily.spend` 之和(Meta 当前无数据,合计时自动为 0,**不要报错**)
- 当月新客数 = `dim_customers.firstOrderAt` 落在该月、且 `is_internal=false` 的客户数
- 返回最近 N 个月(默认 6 个月)的数组:`{ month, adSpend, newCustomers, cac }`

### ⚠️ 必须在 UI 上标注
当前 Meta Ads 未接入,adCost 仅含 Google。页面上 CAC 卡片/图表下方必须显示一行小字提示(i18n):「当前仅含 Google Ads 花费,Meta Ads 接入后将更准确」。这是诚实披露,不可省略。

### 实现
- `src/lib/queries/cac-trend.ts`:`getCacTrend(months = 6): Promise<CacTrendPoint[]>`
- API:`src/app/api/dashboard/cac-trend/route.ts`(这个不需要 date range param,接收可选 `months` query param)

### 页面
可以并入工具三的页面(见下),作为同一页的一个区块,不必单独建页。

---

## 工具三:营销漏斗(Sessions → 首单 → 复购)

**问题:漏斗哪一环漏得最狠?**

### 数据逻辑(所选区间内)
- `sessions` = `fact_ga4_daily.sessions` 之和(GA4 数据)
- `firstOrders` = 首单落在区间内的非内部新客数(复用工具一的新客逻辑,或直接 count `dim_customers.firstOrderAt` 在区间内且非内部)
- `repeatInPeriod` = 区间内产生了「非首单」的客户数(即区间内有订单、且该订单不是其首单)
- 两个转化率:`visitToOrder = firstOrders / sessions`、`orderToRepeat = repeatInPeriod / firstOrders`
- 若 GA4 无数据(`fact_ga4_daily` count 为 0),sessions 段返回 null,页面优雅降级(只显示后两段),不要崩。

### 实现
- `src/lib/queries/funnel.ts`:`getFunnel(startDate, endDate): Promise<FunnelData>`
- API:`src/app/api/dashboard/funnel/route.ts`

### 页面
新增页面 `src/app/(dashboard)/funnel/page.tsx`(CAC 区块也放这页):
- 漏斗三段:用三个横向 bar 或三个 KpiCard 串联展示(Sessions → First Orders → Repeat),每段之间显示转化率百分比。不用引入新图表库,用现有组件 + 简单 div 即可。
- 下方放 CAC 趋势区块:`DashboardLineChart`,x=月份,line=CAC。带上面要求的 Meta 披露小字。

---

## 导航与 i18n

- `src/components/layout/sidebar.tsx` 和 `mobile-nav.tsx` 增加两个导航项:Channels(渠道质量)、Funnel(营销漏斗)。选合适的 lucide 图标(如 `GitBranch`/`Filter`/`Network`)。
- `src/lib/i18n/translations.ts` 的 `en` 和 `zh` 都补齐所有新文案(nav、页面标题、表头、卡片标签、Meta 披露提示)。保持现有结构风格。

---

## 验收要求(必须执行,不可跳过)

1. **实际跑通**:`npm run dev`,逐个打开 `/channels` 和 `/funnel` 页面,确认能渲染、不报错(空数据状态也要优雅,不能白屏)。截图或文字描述每个页面的实际渲染结果。
2. **Migration 真的生效**:跑 `npx prisma migrate dev`,确认 `is_internal` 字段建好;跑 mark-internal 脚本,确认 lancwl418 被标记。
3. **类型与 lint**:`npx tsc --noEmit` 和 `npm run lint` 通过。
4. **偏离报告**:在完成报告里,明确列出任何与本 spec 的偏离(例如:Shopify API version 不支持 landingPageUrl 而改用了 customerJourneySummary;或某字段名与预期不同)。逐条说明改了什么、为什么。
5. **不要自动触发任何数据同步**;只在报告里提示用户需要手动重跑 Orders 同步以回填 landingSite。

## 不在本次范围(明确不做)
- 不接入 Meta Ads(保持 spend=0 兼容即可)
- 不做 cohort 留存矩阵(下一阶段单独做)
- 不接入任何 AI / agent(这是纯查询+页面阶段)
- 不改动现有 `paidOrderFilter` 及依赖它的现有页面
