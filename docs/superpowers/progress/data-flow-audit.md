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

---

## 3. Step 3 -> Step 5

**传递字段(期望)**: 运维费按 `maintenanceCategory` 拆分到 `repairCost`/`laborCost`

**当前状态**: **部分通 - 用 `costType` 2 类拆分,非 spec 要求的 `maintenanceCategory`**

### 盘点结果

| 项 | 值 | 状态 |
|---|---|---|
| Step 5 读 Step 3 字段 | `projectsStep3Data[pid][techId]`(TechInvestment) | ✅ 通 |
| `fixedInvestment` -> `totalFixedInvestment` | `calcFixedFromSelected(inv)` | ✅ 通 |
| `initialInvestment` -> `initialInvestment` | `calcInitialFromSelected(inv)` | ✅ 通 |
| `maintenance[]` 运维表 | 读 `inv.maintenance[].costType`/`selected`/`subtotal` | ⚠️ 用 costType 非 maintenanceCategory |
| `costType === 'labor'` -> `laborCost` | `index.tsx:175` | ⚠️ 2 类拆分 |
| `costType !== 'labor'` -> `repairCost` | `index.tsx:178` | ⚠️ 2 类拆分 |
| `adminCost` 计算 | `Math.round(totalLabor * 0.05 * 100) / 100`(运维人工 × 5%) | ❌ spec 要求用户填 |
| `maintenanceCategory` 字段 | **InvestmentRow 不存在** | ❌ 缺失,1.4 加 |

### 代码证据

- `src/steps/step5-decision/index.tsx:140` - 读 `projectsStep3Data`
- `src/steps/step5-decision/index.tsx:153` - `investments = projectsStep3Data[projectId]`
- `src/steps/step5-decision/index.tsx:165-181` - 遍历技术,读 `inv.maintenance[].costType`/`selected`/`subtotal`
- `src/steps/step5-decision/index.tsx:175-179` - 按 `costType === 'labor'` 拆分
- `src/steps/step5-decision/index.tsx:203` - `adminCost = totalLabor * 0.05`(硬编码 5%)
- `src/steps/step5-decision/utils/financialCalculate.ts:93-118` - `repairCost`/`laborCost` 作为输入参数参与财务计算

### spec §5.4 差异(1.9 阶段修复)

| 项 | 当前代码 | spec §5.4 要求 |
|---|---|---|
| 拆分字段 | `costType: 'repair' \| 'labor'` | `maintenanceCategory: string` |
| 拆分类数 | 2 类 | 2 类('维保费用' / '运维人工费用') |
| Excel 实际枚举 | n/a | 6 类(光伏维保/检测校准/水蓄冷/相变蓄热/设备维保/运维人工) |
| adminCost | `totalLabor * 0.05` 硬编码 | 用户填,不自动 |
| dirty flag | 无 | `step5DirtyFlags: { repairCostDirty, laborCostDirty, ... }` |
| derive 函数 | 无 | `deriveStep5MaintenanceFromStep3(step3Data)` |

### Excel 6 类 -> Step 5 2 类映射(1.9 阶段定)

Excel `运维分类` 实际 6 个枚举值(来自 `excel-structure-probe.py` 探测):
- 光伏维保费用
- 检测校准维保费用
- 水蓄冷维保费用
- 相变蓄热维保费用
- 设备维保费用
- 运维人工费用

映射到 Step 5:
- `repairCost` = 光伏维保 + 检测校准 + 水蓄冷 + 相变蓄热 + 设备维保(5 类求和)
- `laborCost` = 运维人工费用

**注意**: spec §5.4 L431 用 `maintenanceCategory === '维保费用'`,但 Excel 实际是 `设备维保费用`(不是 `维保费用`)。1.4 阶段定 schema 时要确认枚举值用 Excel 的精确字符串,spec 的 `'维保费用'` 是简写,实际应为 `设备维保费用`。

### 1.9 接通依据(spec §5.4)

1. `InvestmentRow` 加 `maintenanceCategory?: string`(1.4 schema 扩展)
2. `deriveStep5MaintenanceFromStep3(step3Data)` 函数加到 `financialCalculate.ts`
3. Step 5 表单 `repairCost`/`laborCost` 改为"自动填充 + 可编辑"
4. `adminCost` 改为用户填(去掉 `totalLabor * 0.05` 硬编码)
5. dirty flag: `step5DirtyFlags` 内存层,不 persist
6. `costType` 字段移除,旧数据通过迁移函数转为 `maintenanceCategory`

**结论**: Step 3 -> Step 5 数据流 **部分通**(有 costType 2 类拆分),但与 spec §5.4 要求不符(用 costType 非 maintenanceCategory,adminCost 硬编码)。1.9 阶段完整接通。
