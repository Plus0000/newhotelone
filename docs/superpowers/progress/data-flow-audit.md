# 数据流盘点报告

> Phase 1.0 前置,spec §5.5 要求。盘点 Step 2->3/3->4/3->5/4->5 四条断点。
> 1.6/1.8/1.9 开工前必读,确认数据传递字段和断点。

## 1. Step 2 -> Step 3

**传递字段(期望)**: techId 列表(Step 2 选中的节能技术)

**当前状态**: **断点 - Step 3 不读 Step 2 数据**

### 盘点结果

| 项 | 值 |
|---|---|
| Step 2 写字段 | `projectsStep2Data: Record<projectId, string[]>`(techId 列表) |
| Step 3 读字段 | `projectsStep3SelectedTechs: Record<projectId, string[]>`(独立字段,非 Step 2) |
| Step 3 候选池 | 全量技术 `techEntries`(来自 `useMergedTechEntries`),非 Step 2 子集 |
| Step 3 初始勾选 | 空(用户重新勾选),首次进入用 `projectsStep3SelectedTechs[projectId]` 回填 |
| Step 2 数据被谁读 | 仅 Step 4 `DecisionTool.tsx:57`(过滤"有 Step 2 选择的项目"),Step 3 不读 |

### 代码证据

- `src/steps/step3-twins/index.tsx:71` - 读 `projectsStep3SelectedTechs`
- `src/steps/step3-twins/index.tsx:117-118` - `candidateTechIds = techEntries.map(t => t.id)`(全量,非 Step 2 子集)
- `src/steps/step3-twins/index.tsx:120-130` - 首次进入用 `projectsStep3SelectedTechs` 回填,没有则空
- `grep "projectsStep2Data" src/steps/step3-twins/` - **零命中**(Step 3 不读 Step 2)

### 设计决策(已记录)

这是 memory `step2-to-step3-tech-selection-flow.md` 记录的设计决策:"Step 3 用全部技术池/默认未勾选/不继承 Step 2"。

**含义**: Step 2 和 Step 3 是两个独立的技术选择环节:
- Step 2: 节能方案筛选(基于 hospitalType/location/mep 推荐技术,用户勾选)
- Step 3: 机电系统投资概算(全量技术池,用户重新勾选要投资的技术)

用户在 Step 3 可能选和 Step 2 不同的技术组合(例如 Step 2 筛选了 5 个,Step 3 只投资 3 个,或加入 Step 2 没筛的技术)。

### spec 对齐情况

spec §5.5 要求"盘点 Step 2->3 断点",但 **未要求接通 Step 2 -> Step 3 数据流**。当前设计(独立选择)符合产品逻辑(Step 2/3 是不同环节),不需要改。

**1.1 待核对**: `techEntries` 的 techId 和 `techDefaultInvestments` 的 techId 完全一致(spec §2.3 1.1 范围,在 Task 13/1.1 阶段核对)。
