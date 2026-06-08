# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

医院建筑节能方案助手 — B端工具类产品，帮助医院管理者 / 节能服务公司完成从建筑信息录入到节能方案输出的全流程。

**核心交互模型**：五步线性 Stepper，上一步完成才能进入下一步：

```
Step 1               Step 2               Step 3               Step 4               Step 5
建筑基本信息    →    节能方案筛选    →    机电系统投资概算    →    能耗分析与节能计算    →    数据分析与辅助决策
```

**背景数据库**：三个预置参考数据层（规范标准库 / 系统素材库 / 政策绿融库），提前录入系统，为五个步骤提供计算依据、技术推荐、政策匹配。用户不可直接编辑。

详细产品设计见 `docs/reference.md`。

## 样式参考

- **组件库**：项目根目录 `SKILL .md` — Ant Design React 4.x 完整组件指南，所有组件用法、API、主题定制均参考此文件
- **视觉风格**：`frontend-design` skill — 追求独特、大胆的视觉方向，拒绝通用 AI 审美
- 以上两项为强制参考，每次新页面/新组件开发前先加载对应 skill

## 技术栈

- React 18 + TypeScript
- Ant Design 5.x（Steps 为核心交互组件）
- Vite
- Zustand（跨步骤状态共享）
- React Router v6
- ECharts（能耗数据可视化）
- dayjs

## 目录结构（按四步业务流程拆分）

```
src/
  steps/
    step1-basic-info/       # Step 1: 建筑基本信息
      components/           # 5 个子步骤的表单组件
      hooks/
      index.tsx
    step2-solution/          # Step 2: 节能方案筛选
      components/           # 技术卡片（图标/列表）、详情、节能率估算
      hooks/
      index.tsx
    step3-twins/             # Step 3: 机电系统孪生管理
      components/           # 投资计算表（设备/材料/安装/运维 Tab）
      hooks/
      index.tsx
    step4-energy/            # Step 4: 能耗分析与节能计算
      components/           # 条件设定、计算表、分析图表、决策表单
      hooks/
      index.tsx
  shared/
    components/             # Steps 导航条、Stepper 容器等通用 UI
    stores/                 # Zustand stores（主流程store + 各步骤slice）
    services/               # API 请求层
    utils/                  # 工具函数（能耗公式、单位转换等）
    types/                  # 全局类型定义
    styles/                 # 主题配置、全局样式变量
  data/                     # 背景数据库（静态JSON/TS，规范标准库/素材库/政策库）
    standards.ts            # 规范标准库
    materials.ts            # 系统素材库
    policies.ts             # 政策绿融库
  App.tsx
  main.tsx
```

## 命令

```bash
npm run dev            # 启动开发服务器
npm run build          # 生产构建
npm run lint           # ESLint
npm run format         # Prettier
npm run preview        # 预览生产构建
```

## 核心交互框架：四步 Stepper

### 顶层 Stepper（五步）
- 横向 Steps，始终显示在页面顶部
- 当前步骤高亮，已完成步骤可点击回退，未完成步骤置灰不可点击
- 每步内容区居中卡片式布局（max-width 1200px），不撑满全屏

### 嵌套 Stepper
- Step 1 内部有 5 个子步骤（填写人 → 客户 → 医院 → 机电系统 → 市政能源）
- Step 2 内部有 3 个子步骤（技术筛选 → 详情确认 → 节能率估算）
- Step 3 内部有 3 个子步骤（补贴 → 投资明细 → 汇总）
- Step 4 内部有 5 个子步骤（能源价格 → 条件设定 → 节能计算 → 数据分析 → 辅助决策）
- Step 5 为辅助决策总览，展示多项目横向对比与投资决策指标
- 内部子步骤用较小的次级 Steps 或 Tabs 实现

### 按钮约定
- 每步底部固定「上一步」「保存」「下一步」
- Step 1 的「上一步」为「返回项目列表」
- Step 5 的「下一步」为「生成报告」
- 「保存」仅保存草稿，不跳转步骤；「下一步」先保存再跳转

### 状态管理
- 顶层 store：`useProjectStore` — currentStep、projectId、核算状态、步骤完成标记
- 各步骤 slice 独立管理本步骤表单数据
- 步骤间数据依赖：
  - Step 1 → Step 2：医院类型/规模/床位数/气候分区/机电系统/所在地
  - Step 2 → Step 3：选中的节能技术列表
  - Step 3 → Step 4：各技术投资概算明细
- 回退修改上游步骤后，下游步骤数据标记为「可能过期」，提示用户重新确认

## 设计规范

### 视觉方向
- Ant Design 设计语言为骨架，`frontend-design` skill 追加独特性
- 主色蓝系，辅色在数据卡片/图表/标签上跳出 Ant Design 默认安全区
- 中文：PingFang SC / Microsoft YaHei；英文/数字：选有个性的等宽字体用于数据展示
- Steps 为核心视觉元素，步骤图标使用与能耗/建筑相关的语义化图标

### 数据展示（能耗领域特有）
- 单位规范：用电 kWh/年、用气 m³/年、用水 吨/年、碳排放 tCO₂/年、费用 万元/年、面积 ㎡
- 对比场景：节能方案 vs 原方案、行业基准 vs 当前值
- 图表配色：实际值=主色、预测值/目标值=虚线+灰、超标=红色预警
- 大数加千分位，单位标注在数值右侧

### 表单规范
- 单列布局，标签左对齐
- 长表单分组 + 分割线
- 优先 Select/Radio，减少自由文本
- 数值输入限制范围并给出合理默认值

### 反馈规范
- 加载态：步骤切换用 Steps loading + 内容区 Skeleton
- 异常态：能耗数据异常在指标旁加 warning 标签，不阻塞流程
- 成功/失败：message.success / message.error
- 危险操作：Modal.confirm

## 代码风格
- 文件名 PascalCase：`BuildingForm.tsx`、`TechCard.tsx`
- 每个文件只导出一个组件，子组件放同级 `components/`
- Props interface 定义在组件文件内，超过 3 个 props 提取，否则内联
- 不用 default export，用 named export
- 步骤间不直接互相引用，通过 shared/stores 通信