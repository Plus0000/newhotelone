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

---

## 2. Step 3 -> Step 4

**传递字段(期望)**: 设备功率(`powerKw`)/系统容量(`systemCapacity`)/运维分类(`maintenanceCategory`)/savingEquipments/originalEquipments

**当前状态**: **部分通 - 仅 equipment.powerKw/quantity/name 接通,savingEquipments 从 Step 3 同步**

### 盘点结果

| 项 | 值 | 状态 |
|---|---|---|
| Step 4 读 Step 3 字段 | `projectsStep3Data[pid][techId].equipment[]` | ✅ 通 |
| 字段映射 equipment -> savingEquipments | `id`/`name`/`powerKw`/`quantity`/`isMainEquipment` | ✅ 通 |
| `powerKw` -> `ratedPower` | `EditView.tsx:141,150` | ✅ 通 |
| `savingEquipments` 数据来源 | 从 Step 3 `equipment.filter(isMainEquipment)` 同步 | ✅ 通 |
| `originalEquipments` 数据来源 | **不从 Step 3 读**,从 Step 4 `existing.originalEquipments` 迁移,无则空 | ❌ 断点 |
| `maintenanceCategory` 字段 | **InvestmentRow 类型里不存在**,只有 `costType: 'repair'\|'labor'` | ❌ 缺失 |
| `systemCapacity` 字段 | `TechInvestment.systemCapacity` 存在,但 Step 4 不读 | n/a |

### 代码证据

- `src/steps/step4-energy/components/EditView.tsx:127` - 读 `projectsStep3Data[project.id]?.[techId]`
- `src/steps/step4-energy/components/EditView.tsx:128` - `step3.equipment.filter(r => r.isMainEquipment)` 取主要设备
- `src/steps/step4-energy/components/EditView.tsx:133-158` - 字段映射 `id`/`name`/`powerKw`/`quantity`
- `src/steps/step4-energy/components/EditView.tsx:164-172` - `originalEquipments` 从 Step 4 自身迁移,**不读 Step 3**
- `src/steps/step4-energy/components/StepCalculation.tsx:243` - 读 `projectsStep3Data[projectId]?.[techId]?.equipment`
- `src/shared/stores/projectStore.ts:38` - `InvestmentRow.costType?: 'repair' | 'labor'`(无 `maintenanceCategory`)

### Step 4 不读的 Step 3 字段

- `maintenance[]` 表(运维费)- Step 5 读,Step 4 不读
- `materials[]` 表(材料)- Step 5 读
- `installation[]` 表(安装)- Step 5 读
- `subsidyMode`/`subsidyIndex`/`systemCapacity` - Step 5 读
- `costType`/`maintenanceCategory` - Step 5 读

### 1.4 schema 扩展依据(spec §5.4)

`InvestmentRow` 要加 `maintenanceCategory` 字段,枚举值对齐 Excel 的 6 类:
- 光伏维保费用
- 检测校准维保费用
- 水蓄冷维保费用
- 相变蓄热维保费用
- 设备维保费用
- 运维人工费用

**当前 `costType: 'repair' | 'labor'` 保留**(向后兼容),1.4 阶段加 `maintenanceCategory` 作为新字段,1.6 阶段 Step 5 改读 `maintenanceCategory` 替换 `costType`。

### 1.8 接通依据(spec §5.5)

Step 4 计算逻辑当前用 `savingEquipments[techId][].ratedPower`(已从 Step 3 `powerKw` 同步),无需改。`originalEquipments` 用户手填,不从 Step 3 读(符合产品逻辑:原方案设备是 Step 4 独立盘点)。

**结论**: Step 3 -> Step 4 数据流 **已通**,无阻塞。1.4/1.8 不需要改 Step 4 读取逻辑,只需在 1.4 加 `maintenanceCategory` 字段到 `InvestmentRow`(为 Step 5 准备)。
