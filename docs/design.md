---
version: alpha
name: Building Energy Saver
description: 医院建筑节能方案助手的专业设计系统，覆盖建筑信息录入、节能方案筛选、投资概算、能耗计算与辅助决策全流程。
colors:
  primary: "#2B87C9"
  primary-hover: "#2F86D2"
  primary-subtle-1: "#EAF5FF"
  primary-subtle-2: "#F0F5FF"
  primary-subtle-3: "#E6F0F9"
  primary-border: "rgba(43,135,201,0.28)"
  primary-border-light: "#91CAFF"
  title: "#1A1A1A"
  text-emphasis: "#434343"
  text-body: "#595959"
  text-secondary: "#8C8C8C"
  text-disabled: "#BFBFBF"
  border: "#D9D9D9"
  border-light: "#F0F0F0"
  border-section: "#E8ECF0"
  bg-table-header: "#FAFAFA"
  bg-nested: "#FAFBFC"
  bg-layout: "#F0F2F5"
  bg-container: "#FFFFFF"
  success: "#52C41A"
  success-subtle: "#F6FFED"
  success-border: "#B7EB8F"
  warning: "#FAAD14"
  warning-subtle: "#FFF7E6"
  warning-border: "#FFD591"
  error: "#FF4D4F"
  orange: "#FA8C16"
  purple: "#722ED1"
  purple-subtle: "#F9F0FF"
  shadow-card: "rgba(0,0,0,0.04)"
  shadow-raised: "rgba(0,0,0,0.18)"
typography:
  font-family: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
  font-mono: '"SF Mono", Menlo, monospace'
  page-title-xl:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.4
  page-title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
  section-title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
  card-title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  body-xs:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
  label-sm:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
  table-header:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
  kpi-number:
    fontFamily: '"SF Mono", Menlo, monospace'
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
    fontVariantNumeric: tabular-nums
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  full: 50%
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  xxxl: 40px
  page-x: 24px
  card-padding: "12px 20px"
  card-header: "14px 24px"
  table-cell: "12px 16px"
  toolbar-gap: 12px
  control-height: 32px
  container-max: 1200px
  modal-large-width: "92vw"
  modal-large-maxWidth: 1400px
  modal-large-top: 24px
  drawer-width: 520px
components:
  app-shell:
    backgroundColor: "{colors.bg-layout}"
    textColor: "{colors.title}"
    maxWidth: "{spacing.container-max}"
    contentPadding: "{spacing.xxl}"
    contentPaddingBottom: 80px
  topbar:
    backgroundColor: "{colors.bg-container}"
    height: 56px
    logoHeight: 32px
    borderBottom: "1px solid {colors.border-section}"
  avatar:
    size: 32px
    backgroundColor: "{colors.primary-subtle-3}"
    iconColor: "{colors.primary}"
    rounded: "{rounded.full}"
  stepper:
    gridColumns: 5
    gridGap: "{spacing.lg}"
    cardMinHeight: 72px
    cardPadding: "{spacing.md}"
    rounded: "{rounded.md}"
    dotSize: 42px
    borderColor: "{colors.border-section}"
  stepper-current:
    backgroundColor: "{colors.primary-subtle-1}"
    borderColor: "{colors.primary-border}"
    dotBackground: "{colors.primary-hover}"
    dotTextColor: "{colors.bg-container}"
    label: 进行中
  stepper-completed:
    dotBackground: "#E8F7EF"
    dotTextColor: "#1F9A67"
    dotIcon: check
    label: 已完成
  stepper-pending:
    dotBackground: "#EEF0F3"
    dotTextColor: "#5F6974"
    opacity: 0.5
    cursor: not-allowed
    label: 待完善
  card:
    backgroundColor: "{colors.bg-container}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.border-section}"
    shadow: "0 1px 4px {colors.shadow-card}"
  card-hover:
    shadow: "0 4px 12px {colors.shadow-raised}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg-container}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.bg-container}"
    textColor: "{colors.text-body}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 14px"
    borderColor: "{colors.border}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.bg-container}"
    rounded: "{rounded.sm}"
    height: 32px
  input:
    backgroundColor: "{colors.bg-container}"
    textColor: "{colors.title}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 12px"
  table:
    backgroundColor: "{colors.bg-container}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.md}"
    bordered: true
  table-header:
    backgroundColor: "{colors.bg-table-header}"
    textColor: "{colors.text-emphasis}"
    typography: "{typography.table-header}"
    height: 44px
    borderColor: "{colors.border-light}"
  table-row:
    backgroundColor: "{colors.bg-container}"
    textColor: "{colors.text-body}"
    height: 48px
    borderColor: "{colors.border-light}"
  table-cell:
    padding: "{spacing.table-cell}"
    borderColor: "{colors.border-light}"
  badge-success:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.success}"
    borderColor: "{colors.success-border}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "{colors.warning-subtle}"
    textColor: "{colors.warning}"
    borderColor: "{colors.warning-border}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
  badge-error:
    backgroundColor: "{colors.error}"
    textColor: "{colors.bg-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
  badge-neutral:
    backgroundColor: "{colors.bg-table-header}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
  knowledge-sidebar:
    backgroundColor: "{colors.bg-container}"
    railWidth: 52px
    panelWidth: 440px
    top: 57px
    height: calc(100vh - 57px)
    transitionDuration: 0.2s
    zIndex: 900
  modal:
    backgroundColor: "{colors.bg-container}"
    textColor: "{colors.title}"
    rounded: "{rounded.md}"
  modal-large:
    width: "{spacing.modal-large-width}"
    maxWidth: "{spacing.modal-large-maxWidth}"
    top: "{spacing.modal-large-top}"
    bodyMaxHeight: 82vh
    bodyOverflowY: auto
  footer-bar:
    backgroundColor: "{colors.bg-container}"
    borderTop: "1px solid {colors.border-section}"
    height: 52px
    zIndex: 10
  empty-state:
    textColor: "{colors.text-disabled}"
    typography: "{typography.body-md}"
  pagination:
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    height: 32px
---

## Overview

Building Energy Saver 是面向医院管理者与节能服务公司的 B 端专业工具设计系统。覆盖「建筑信息录入 → 节能方案筛选 → 投资概算 → 能耗计算 → 辅助决策」全流程闭环。它不是营销页面，也不是数据大屏——它应该像一个专业的能源调度控制台：信息密度足够高，层级清楚，状态明确，操作位置稳定。

设计的核心第一性原则是**降低专业判断成本**。颜色、间距、表格、标签、按钮都必须服务于"快速定位、准确筛选、低误操作风险"。任何装饰性视觉都应让位于数据可读性、扫描效率和状态可见性。

品牌气质关键词：**专业可信**（蓝系主色 + 克制中性灰）、**高效流畅**（五步线性 Stepper + 一站式子流程）、**理性精确**（数字等宽 + 表格 bordered）、**现代克制**（圆润图标 + 8px 卡片圆角 + 轻阴影）。

## Colors

颜色系统采用**科技蓝 + 冷灰**工作台基调。品牌蓝 `#2B87C9` 是唯一主色源，传达医疗级专业与能源科技感。浅灰色页面底 `#F0F2F5` 适合长时间办公，让白色内容区自然浮起。

- **Primary `#2B87C9`:** 主按钮、链接、当前态、聚焦、强调图标。禁止大面积铺色。**禁止使用 `#1677ff` 或 `#1890ff`**（旧版 Ant Design 遗留色）。
- **Primary Hover `#2F86D2`:** hover 态、Stepper 当前圆点。
- **Primary Subtle ① `#EAF5FF`:** 当前态卡片背景、Stepper 当前态底。
- **Primary Subtle ② `#F0F5FF`:** 区块/分组浅蓝底。
- **Primary Subtle ③ `#E6F0F9`:** 头像等小面积浅蓝。
- **Title `#1A1A1A`:** 主标题、页面标题。避免使用纯黑。
- **Text Body `#595959`:** 表格正文、说明文字主体。
- **Text Secondary `#8C8C8C`:** 辅助说明、占位文字、单位标注（最高频使用的中性色）。
- **Text Disabled `#BFBFBF`:** 禁用状态、placeholder、空态。
- **Border Section `#E8ECF0`:** 卡片描边、导航分隔、底栏分割（项目标准边框，区别于 antd 默认 `#D9D9D9`）。
- **Border Default `#D9D9D9`:** 输入框、默认分隔线。
- **Border Light `#F0F0F0`:** 表格内行列分隔。

语义色：**Success `#52C41A`** 用于节能达标、已完成；**Warning `#FAAD14`** 用于待处理、过期提醒；**Error `#FF4D4F`** 用于超标、异常、驳回。状态配浅底标签使用，单色不承载唯一信息。Purple `#722ED1` 作为 AI 专属强调色，配浅底 `#F9F0FF`，与品牌蓝区分。

## Typography

字体系统优先使用系统原生字体栈（`-apple-system, PingFang SC, Microsoft YaHei`），确保跨平台中文字形稳定清晰。数字和数据场景使用等宽字体 `SF Mono / Menlo / monospace` 并开启 `font-variant-numeric: tabular-nums`。

- **Page Title (18–24px / 600):** 页面标题、模块大标题。
- **Section Title (16px / 600):** 表格标题、详情分组标题。
- **Card Title (15px / 600):** 内层卡片标题、Stepper 步骤标题。
- **Body (14px / 400):** 默认正文、表单标签、导航文字。
- **Body Small (13px / 400):** 次级正文、表格内容。
- **Body XS (12px / 400):** 表格密集内容、标签、辅助说明（高频）。
- **Table Header (14px / 600):** 表头列名，便于扫读。
- **KPI Number (24px / 700):** 等宽 + 大字重，用于关键指标数字。

所有字重收敛于 400/500/600/700 四档，禁止使用 800/820/620 等非常规字重。

## Layout

布局遵循固定控制台结构：顶部导航 → 五步 Stepper 引导流程 → 主内容工作区 → 固定底部操作栏。

**页面结构：**

1. **顶部导航**（56px）：Logo 32px、头像 32px、导航描边 1px solid `#E8ECF0`。
2. **Stepper 引导区**：5 列等宽 grid、gap 16、步骤卡 minHeight 72。
3. **主内容区**：左右布局——左侧主体（1200px 最大宽居中）、右侧知识库侧边栏。
4. **底部操作栏**：固定底部，左侧"上一步"，右侧"保存" + "下一步"。

**容器**：内容最大宽 `1200px`、`margin: 0 auto`；左右安全边距 `24px`；内容底部留 80px 避固定底栏。

**间距基准**：4px 基础网格。常用间距：8px（图标-文字紧凑）、12px（默认组件间距，最高频）、16px（卡片内/区块间）、24px（区块大间距/页面安全边距）、40px（报告分区大留白）。

**响应式**：桌面优先（≥1200px 为设计目标），宽屏容器居中两侧留白，暂不优先移动端。

## Elevation & Depth

深度通过色块、边框和轻阴影建立，不使用重阴影、玻璃拟态、霓虹光效或大面积渐变。

- 页面背景为最低层（`#F0F2F5`）。
- 白色卡片为主要内容层，使用 1px 边框（`#E8ECF0`）和轻阴影 `0 1px 4px rgba(0,0,0,0.04)`。
- 弹窗、抽屉和悬浮菜单使用抬升阴影 `0 4px 12px rgba(0,0,0,0.18)`。

如果边框已经足够表达层级，不要额外加阴影。阴影透明度收敛为 0.04 / 0.18 两档，禁止 0.05 / 0.06 等变体。

## Shapes

形状应稳定、克制、可预测。圆角不能成为主要视觉风格，只用于降低界面硬度。

- **卡片、面板、区块容器**：8px 圆角（最高频块级圆角）。
- **按钮、输入框、选择器**：6px 圆角（全局默认）。
- **状态标签、Tag、小徽标**：4px 圆角。
- **头像、Stepper 圆点**：50% 圆形。
- 不使用大圆角胶囊按钮作为默认形态。

## Components

### App Shell

页面底色 `#F0F2F5`，内容区 1200px 居中。顶部导航 56px，浅底白卡片，底部 1px `#E8ECF0` 描边。头像 32px 圆形，浅蓝底 `#E6F0F9` + 品牌蓝图标。

固定底栏位于页面底部，z-index 10，上方 1px `#E8ECF0` 描边分隔。内容区底部留 80px 防止底栏遮挡。

### Stepper (Top-Level)

五步线性引导是项目的核心交互模型。5 列等宽 grid，列间距 16px。每步一个卡片，minHeight 72px、padding 12px、圆角 8px。

- **当前步**：背景 `#EAF5FF`，描边 `rgba(43,135,201,0.28)`，圆点 42px 深蓝底 `#2F86D2` + 白字，文案"进行中"。
- **已完成**：圆点浅绿底 `#E8F7EF` + 深绿钩 `#1F9A67` ✓，文案"已完成"。
- **待完善**：圆点浅灰底 `#EEF0F3` + 灰文字 `#5F6974`，`opacity: 0.5`，`cursor: not-allowed`，文案"待完善"。
- 已完成步和当前步可点击回退；未达步不可点。

### Footer Bar

固定底部操作栏，z-index 10。左右分栏布局：左侧"上一步"（首步显示"返回项目列表"），右侧 Space 内"保存"（线框）+ "下一步"（主色实心，末步为"生成报告"）。按钮排序：线框在前，primary 在后。

编辑态（step3/4/5Editing）下隐藏全局底栏，由步骤内底栏接管。

### Knowledge Sidebar

ChatGPT 式侧边栏，悬浮于内容区右侧。收起状态仅显示 rail 52px，hover 展开至 440px panel，过渡 0.2s。起点 top 57px（紧贴导航下沿），高度 calc(100vh - 57px)，z-index 900。使用 lucide-react 圆润图标，SF Mono 等宽用于数据展示。

### Modal

通用弹窗使用 antd 默认配置。大数据展示弹窗：宽 92vw、maxWidth 1400px、top 24px、body 区域 maxHeight 82vh 且 overflow-y auto、destroyOnClose。

危险操作使用 `Modal.confirm` + `okType: 'danger'`。

### Tables

表格是系统核心承载方式。使用 antd Table bordered 模式，表头底 `#FAFAFA`，描边 `#F0F0F0`。

- **对齐约定**：数字列右对齐，说明列（单位/评价）左对齐，默认左对齐。
- **数字列**：使用 tabular-nums 等宽字体，便于数字比对。
- **滚动**：隐藏滚动条使用 `.hide-scrollbar-table`。
- **结果表**：配 KPI 指标卡，700 字重 + 数字等宽 + 下方附单位/标签。

### Badges

语义标签是状态的核心表达手段。

- **Success（#52C41A / #F6FFED）**：节能达标、正常运行、已完成。
- **Warning（#FAAD14 / #FFF7E6）**：待处理、待确认、过期提醒。
- **Error（#FF4D4F）**：超标、异常、危险状态。
- **Neutral（#FAFAFA / #8C8C8C）**：已归档、停用、草稿。

同一状态在全系统使用同一颜色和文案。状态必须同时通过文字和标签背景表达，不只用颜色区分。

### Buttons

按钮层级：**默认=线框（次要）**，**type="primary"=实心（主操作）**，**primary ghost=主色描边（中量操作）**，**type="text"=无框（图标/轻操作）**。

同组按钮排序：线框在前，实心 primary 在后，主操作居最右。危险操作用 `danger` 属性，配二次确认弹窗。

控件高度统一 32px。

### Forms

单列布局、标签左对齐。长表单分组 + 分割线。优先使用 Select/Radio 减少自由输入，InputNumber 限制范围并给默认值。错误提示使用 Error 色，放在字段下方。

### Empty & Loading & Error

空态使用 antd Empty 弱灰文案，不展示大插画。可附带一个次级说明和一个主操作。

加载态使用 Spin size="large" 居中 + tip 文案。步骤切换可配 Skeleton。禁止整页白屏。

## Design Debts & Standardization

> 代码中扫描发现的**不统一现状**。新代码一律按"统一标准"写，旧代码逐步收敛。

| # | Current State | Unified Standard |
|---|---|---|
| 1 | **Three blues**: theme `#2B87C9`, hardcoded `#1677ff`(58×), Stepper `#2f86d2`, old v4 `#1890ff`(4×) | Converge to `#2B87C9` system (hover `#2F86D2`). Ban new `#1677ff` / `#1890ff`. |
| 2 | **Font weight chaos**: `800`/`820`/`620` in Stepper legacy | Unify to 400/500/600/700. Heavy titles/dots use 700. |
| 3 | **Shadow inconsistency**: three variants of 0.04/0.05/0.06 opacity | Base shadow `0 1px 4px rgba(0,0,0,0.04)`, raised `0 4px 12px rgba(0,0,0,0.18)`. |
| 4 | **Tabular nums not adopted**: only sidebar uses mono for data | Apply to all data tables, result tables, KPI cards, financial metrics. |
| 5 | **Slate contamination**: report page uses `#64748b`/`#475569`/`#1a1a2e` | Map to neutral scale; dark bg uses `#1A1A2E` as single source. |
| 6 | **Doc-code drift**: sidebar panel documented as 360px, actual code 440px | Code truth: rail 52px / panel 440px / top 57px. |

---

*本文件随系统演进维护；新增 token 或修改标准时，先改本文件再改代码（约束先行）。*