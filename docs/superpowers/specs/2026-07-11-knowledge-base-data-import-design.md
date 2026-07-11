# 知识底座数据录入设计

**版本**: 2026-07-11 (rev 3 - 数据流贯通 + 对抗审查修正)
**作者**: 阿臻 + Claude
**状态**: 待 review

## 1. 背景与目标

医院建筑节能助手目前五步链路(Step 1-5)的计算依据大量缺失或为 mock 数据。用户桌面 `/Users/plus0/Desktop/技术交底-20260701` 文件夹包含全部真实知识底座(约 30 个 Excel/Word/PDF 文件),需要录入系统。

### 目标

- 将真实数据录入 `src/data/` 下的 TS 文件
- **跑通 Step 1-5 全链路真实数据**(选项 C,全链路接通)
- **Step 3 -> Step 5 运维费数据流贯通**(当前脱节,Step 5 要用户重填)
- 为未来知识中台提供真实使用依据

### 范围(Phase 1 = 选项 C:全链路接通 + 数据流贯通)

Phase 1 包含:
- 录入 P0 数据(模块2 的 6 个计算表 + 模块3 的 12 个设备表 + 模块4 的 2 个碳排放因子)
- Schema 扩展(`DefaultRow` 加 4 个分类字段 + `years`/`lifecycleTotal`)
- **Step 1 表单字段核对**(前置依赖,挪到 Phase 1.0)
- **设备分类库核对**(模块0/系统素材库,和设备表替换有硬依赖)
- **规范标准库基础部分**(被计算引用的国标,挪到 Phase 1)
- Step 2 综合节能率接通(单项节能率 + 综合节能率修正)
- Step 3 投资汇总接真实数据
- Step 4 能耗计算改查真实表(能耗权重/折算系数/碳排放因子分省分类型)
- **Step 5 运维费从 Step 3 自动读取**(按 costType 拆分,不再用户重填)

Phase 1 不包含(后续 Phase 做):
- 中台管理界面(Phase 5)
- 数据库迁移(Phase 4)
- 规范标准库全量补全(Phase 2,Phase 1 只补被计算引用的基础部分)
- 政策绿融库补全(Phase 2)
- 能源价格表补全(Phase 2)
- 气候分区 + 光伏条件(Phase 2)
- 模块5 报告模板对齐(Phase 3)

### 非目标

- 本设计**不包含**中台管理界面的实现
- 本设计**不包含**数据库迁移

## 2. 设计决策

### 2.1 数据存放位置:前端 TS 文件,非数据库

| 阶段 | 数据位置 | 类比 |
|---|---|---|
| 现在(中台需求不清晰) | `src/data/*.ts` | Figma 设计稿,随时能改 |
| 未来(中台需求清晰,要多人协作) | Supabase 数据库 | 设计稿定稿,开始开发上线 |

**核心理由**(从第一性原理修正):

不是"字段会频繁改"--Excel 已经定义了字段结构,大部分字段是稳定的。也不仅是"探索使用方式"--中台的核心 CRUD + 权限 + 审核不依赖真实使用。

**真正的理由是:中台需求不清晰**。

用户说"知识中台"但没说细节(权限怎么分?审核几步?版本怎么管?哪些字段要审核?谁是运营谁是专家?)。直接做中台 = 给模糊需求建系统,一定返工。

先录前端跑通产品,用户看到"哦这个字段要改、那个要审核、这个权限该给谁",中台需求自然具体了。这时候再做中台,设计有据可依。

**TS 类型定义 = 未来数据库 schema 的字段部分**。迁移时跑个脚本 `INSERT INTO` 即可。审计列(version/updated_by/updated_at/is_system)在中台设计时补,现在预留 `_meta` 字段位置。

### 2.2 运维费:数据流贯通(Step 3 -> Step 5)

**当前现状(对抗审查发现)**:

运维费算法分两层,且**脱节**:

| 层 | 数据来源 | 算法 |
|---|---|---|
| Step 3 | Step 3 运维表(Excel 12 个表) | 数量 × 单价 求和(年度总价) |
| Step 5 | Step 5 表单用户手填 | 年度值 × 运营年数 |

Step 3 算出来的 `maintenanceCost` **不会自动传到 Step 5**。Step 5 要用户重新填维保费/人工费/管理费。这导致:
- 用户重复录入
- Step 3 和 Step 5 数据容易不一致
- 违反"数据贯通"原则

**决策:Step 5 运维费从 Step 3 自动读取**

Step 3 运维表已经有"维护分类"列(运维人工费用/维保费用),正好对应 Step 5 的 `laborCost`/`repairCost`。自动传 = Step 3 填完,Step 5 自动有值,用户可微调。

**算法**:

```
Step 3 层(不变):
  maintenanceCost = 运维行 subtotal 求和(数量 × 单价 = 年度总价)
  lifecycleTotal = Excel"全维护周期总价"列(参考字段,不参与计算)

Step 5 层(改):
  repairCost = Step 3 运维行中 maintenanceCategory === '维保费用' 的 subtotal 求和
  laborCost  = Step 3 运维行中 maintenanceCategory === '运维人工费用' 的 subtotal 求和
  adminCost  = 保留用户填(Step 3 没有此分类)
  N 年总运维成本 = (repairCost + laborCost + adminCost) × operatingPeriod  (已有逻辑)
```

**年限处理**:
- Step 3 运维表的"年限"列作为参考展示,不参与计算
- Step 5 用 `operatingPeriod`(用户配置的项目运维期)作为 N
- `lifecycleTotal` 字段保留,UI 可选展示"Excel 参考全周期总价",不参与计算

**改动位置**:
- `src/steps/step5-decision/utils/financialCalculate.ts`:加"从 Step 3 读取"逻辑
- `src/steps/step5-decision/index.tsx` 或对应组件:Step 5 表单的运维费字段改为"自动填充 + 可编辑"

### 2.3 录入顺序:按依赖关系分 11 个子阶段

从第一性原理看,录入顺序应该按**数据依赖关系**,不是按模块顺序:

```
Phase 1.0: Step 1 表单字段核对        (前置依赖,Step 2 计算的输入)
Phase 1.1: 技术卡片字段核对           (Step 2 基础数据)
Phase 1.2: 规范标准库基础部分         (被计算引用的国标)
Phase 1.3: 模块2 计算表录入           (权重/系数/限额/边界)
Phase 1.4: 模块3 设备表替换           (Step 3 投资数据)
            + 设备分类库核对          (和设备表分类值对齐)
Phase 1.5: 模块4 碳排放因子录入       (Step 4 碳排放分省分类型)
Phase 1.6: Step 2 综合节能率接通      (单项节能率 + 综合修正)
Phase 1.7: Step 3 投资汇总验证        (替换后自动生效,验证求和)
Phase 1.8: Step 4 能耗/碳排放计算接通 (查真实权重/系数/因子)
Phase 1.9: Step 5 运维费从 Step 3 读取 (数据流贯通)
Phase 1.10: 全链路联调 + UI 微调      (Step 2->3->4->5 贯通 + 界面调整)
```

**为什么这个顺序**:
- 1.0 在最前:Step 1 字段是 Step 2 计算的输入,必须先核对
- 1.2 规范标准基础部分:被计算引用的国标(如 GB 50189、GB/T 2589)是计算依据,提前
- 1.3 在 1.6 前:综合节能率修正逻辑需要真实权重/系数才能接通
- 1.4 设备表和设备分类库一起:设备表的"设备分类"值要和分类库对齐
- 1.6-1.9 计算逻辑接通:每步独立验证,最后 1.10 全链路联调 + UI 微调

### 2.4 中台范围与时机

**中台不是"放数据的地方",是"管理数据的界面"**。

**中台做什么**:
- 给运营/专家团队用,在网页上增删改查三大库数据
- 权限:管理员/专家(可编辑)/运营(可提交审核)
- 审核流:运营提交 -> 专家审核 -> 管理员发布
- 版本管理:每次修改有版本号,可回滚

**中台什么时候做**:
- Phase 1-3 完成,Step 1-5 真实数据跑通
- 那时候中台需求自然清晰(哪些字段要审核、谁有权改、版本怎么管)
- 中台 schema 直接基于真实使用过的字段设计,不返工

## 3. 现状盘点

### 3.1 已对应(部分录,需扩展)

| 桌面文件 | 系统位置 | 状态 |
|---|---|---|
| 规范标准全名录.xlsx | `src/data/standards.ts` (33行) | 🔴 严重缺失,只 3 条 |
| 设备分类表.xlsx | `src/data/equipmentClassification.ts` (97行) | 🟡 已录,**Phase 1.4 核对** |
| 能源政策.xlsx | `src/data/policies.ts` | 🟡 部分录(Phase 2 补) |
| 能源价格表.xlsx | `src/data/materials.ts` 的 `energyPriceReferences` | 🟡 部分录(Phase 2 补) |
| 技术卡片.xlsx | `src/data/materials.ts` 的 `techEntries` | 🟡 **Phase 1.1 核对字段** |
| 建筑基本信息表.xlsx | `src/steps/step1-basic-info/components/SubStep*.tsx` | 🟡 **Phase 1.0 核对**(前置) |
| 报告模板.docx | `src/steps/step5-decision/report/ReportView.tsx` | 🟡 Phase 3 核对 |

### 3.2 完全缺失(需新建)

| 桌面文件 | 影响范围 | Phase |
|---|---|---|
| 节能技术卡片-适用边界条件梳理表.xlsx | Step 2 技术筛选 | 1.3 |
| 技术组合重叠修正系数表.xlsx | Step 2 综合节能率修正 | 1.3 |
| 医院整体修正系数表.xlsx | Step 2 综合节能率修正 | 1.3 |
| 医院建筑能耗限额标准汇总表.xlsx | Step 4 能耗基准对比 | 1.3 |
| 机电系统能耗权重表.xlsx | Step 4 综合节能率计算 | 1.3 |
| 能源折算系数.xlsx(分能源类型) | Step 4 能耗折算 | 1.3 |
| 气候分区.xlsx | Step 1/2 气候分区联动 | 2 |
| 全国光伏条件.xlsx | Step 2 光伏技术评估 | 2 |
| 电力平均碳排放因子(省级电网).xlsx | Step 4 碳排放分省计算 | 1.5 |
| 化石能源碳排放因子.xlsx | Step 4 碳排放计算 | 1.5 |
| 计算1-节能技术筛选和综合节能率估算.docx | Step 2 计算说明 | 3 |
| 计算2-节能率计算-运行时间.docx | Step 4 计算说明 | 3 |
| 计算3-数据分析.docx | Step 4 数据分析说明 | 3 |
| 可视化建议.pdf | Step 5 报告可视化 | 3 |

### 3.3 需替换的 mock 数据

| 系统位置 | 现状 | 动作 |
|---|---|---|
| `src/data/materials.ts` 的 `techDefaultInvestments` | 12 项技术的设备/材料/安装/运维行是 mock | Phase 1.4 用桌面 12 个 xlsx 替换 |

### 3.4 数据流断裂(需接通)

| 断点 | 现状 | Phase |
|---|---|---|
| Step 3 运维费 -> Step 5 | Step 5 表单用户重填,不读 Step 3 | 1.9 接通 |

## 4. 文件落位映射

### 4.1 扩展现有文件

| 桌面文件 | 系统文件 | 动作 | Phase |
|---|---|---|---|
| 建筑基本信息表.xlsx | `src/steps/step1-basic-info/components/SubStep*.tsx` | 字段名/选项值核对 | 1.0 |
| 技术卡片.xlsx | `src/data/materials.ts` | 核对 `techEntries` 字段完整性 | 1.1 |
| 规范标准全名录.xlsx | `src/data/standards.ts` | 补被计算引用的基础国标(全量补在 Phase 2) | 1.2 |
| 12 个设备表.xlsx | `src/data/materials.ts` | 替换 `techDefaultInvestments` | 1.4 |
| 设备分类表.xlsx | `src/data/equipmentClassification.ts` | 核对已有数据,补充缺失项,**对齐设备表分类值** | 1.4 |
| 能源政策.xlsx | `src/data/policies.ts` | 扩展(Phase 2) | 2 |
| 能源价格表.xlsx | `src/data/materials.ts` | 扩展(Phase 2) | 2 |

### 4.2 新建文件(全部在 `src/data/` 下)

| 桌面文件 | 新建系统文件 | 主接口 | Phase |
|---|---|---|---|
| 节能技术卡片-适用边界条件梳理表.xlsx | `src/data/techBoundaries.ts` | `techBoundaries: TechBoundary[]` | 1.3 |
| 技术组合重叠修正系数表.xlsx | `src/data/overlapCorrection.ts` | `overlapCorrections: OverlapCorrection[]` | 1.3 |
| 医院整体修正系数表.xlsx | `src/data/hospitalCorrection.ts` | `hospitalCorrections: HospitalCorrection[]` | 1.3 |
| 医院建筑能耗限额标准汇总表.xlsx | `src/data/energyQuota.ts` | `energyQuotas: EnergyQuota[]` | 1.3 |
| 机电系统能耗权重表.xlsx | `src/data/energyWeight.ts` | `energyWeights: EnergyWeight[]` | 1.3 |
| 能源折算系数.xlsx | `src/data/energyConversion.ts` | `energyConversions: EnergyConversion[]` | 1.3 |
| 电力平均碳排放因子(省级电网).xlsx | `src/data/electricityCarbonFactor.ts` | `electricityCarbonFactors: ElectricityCarbonFactor[]` | 1.5 |
| 化石能源碳排放因子.xlsx | `src/data/fossilCarbonFactor.ts` | `fossilCarbonFactors: FossilCarbonFactor[]` | 1.5 |
| 气候分区.xlsx | `src/data/climateZones.ts` | `climateZones: ClimateZone[]` | 2 |
| 全国光伏条件.xlsx | `src/data/solarConditions.ts` | `solarConditions: SolarCondition[]` | 2 |

### 4.3 文档归档(Phase 3)

| 桌面文件 | 系统位置 |
|---|---|
| 计算1-节能技术筛选和综合节能率估算.docx | `docs/calc/step2-calculation.md` |
| 计算2-节能率计算-运行时间.docx | `docs/calc/step4-calculation.md` |
| 计算3-数据分析.docx | `docs/calc/step4-data-analysis.md` |
| 可视化建议.pdf | `docs/calc/step5-visualization.md`(内容摘要) |

### 4.4 组件核对(Phase 3)

| 桌面文件 | 系统位置 | Phase |
|---|---|---|
| 报告模板.docx | `src/steps/step5-decision/report/ReportView.tsx` | 3 |

## 5. Schema 扩展点

### 5.1 `DefaultRow` 扩展(Phase 1.4 设备表录入)

现有 `src/data/materials.ts` 的 `DefaultRow`:

```ts
export interface DefaultRow {
  name: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  isMainEquipment?: boolean;
  powerKw?: number;
  remark?: string;
  costType?: 'repair' | 'labor';
}
```

真实 Excel 字段对比 + 决策:

| 现有 | Excel 实际 | 处理 |
|---|---|---|
| 无分类字段 | 设备/材料/项目/维护 各有分类列 | **4 个独立字段**(见下) |
| `costType: 'repair' \| 'labor'` | 实际是"运维人工费用/维保费用"等 | **一次性迁移**,不向后兼容 |
| 无年限 | 运营维护表有"年限"和"全维护周期总价" | 新增 `years?`/`lifecycleTotal?`(参考字段) |

扩展后:

```ts
export interface DefaultRow {
  name: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  isMainEquipment?: boolean;
  powerKw?: number;
  remark: string;
  // 4 个独立分类字段(不共用 category)
  equipmentCategory?: string;    // 设备表"设备分类"
  materialCategory?: string;     // 材料表"材料分类"
  projectCategory?: string;      // 安装调试表"项目分类"
  maintenanceCategory?: string;  // 运维表"维护分类"
  // 运维专属(参考字段,不参与计算)
  years?: number;                // 运维年限
  lifecycleTotal?: number;       // 全维护周期总价(UI 参考展示)
}
```

**`costType` 字段移除**,改用 `maintenanceCategory` 承载运维分类语义。

**一次性迁移(不向后兼容)**:
- 删除 `DefaultRow.costType` 字段定义
- `materials.ts` 的 `techDefaultInvestments`(Phase 1.4 整体替换为真实 Excel 数据)用 `maintenanceCategory` 承载运维分类
- `seedProject.ts` 的 `toRows` 函数(`...(tab === 'maintenance' ? { costType: r.costType } : {})`)改为 `...(tab === 'maintenance' ? { maintenanceCategory: r.maintenanceCategory } : {})`
- 代码里所有 `=== 'repair'` / `=== 'labor'` 的判断改为 `=== '维保费用'` / `=== '运维人工费用'`
- 已知引用点:Step 5 运维费拆分逻辑(`step5-maintenance-cost-split` memory 记录的 autoFill 拆分)

**注意**:`InvestmentRow`(store 里的运行时类型)也要同步扩展,否则 Step 3 编辑视图保存时会丢数据。

### 5.2 新建文件的 schema 约定

所有新建的 `src/data/*.ts` 文件遵循统一约定:

```ts
// 文件头:注明数据来源 + 录入时间 + Excel 版本 hash
// 来源: 模块2/机电系统能耗权重表.xlsx
// 录入: 2026-07-11
// Excel hash: <sha1>  // 锁定版本,防止 Excel 修改后对不上账

export interface XxxRow {
  id: string;            // 主键,便于未来数据库迁移
  // ...业务字段
  _meta?: {              // 预留:未来中台用
    version?: number;
    updatedBy?: string;
    updatedAt?: string;
  };
}

export const xxxRows: XxxRow[] = [
  // ...
];
```

### 5.3 单一常量改为分省/分能源类型表(Phase 1.5)

现有 `src/shared/utils/constants.ts`:

```ts
export const COAL_FACTOR = 1.229;           // 折标煤系数(国标单一值,保留)
export const CARBON_FACTOR = 5.81;           // 全国统一(不对,改查表)
export const GAS_CARBON_FACTOR = 0.00196;    // 单一值(改查表)
```

改为查表:

```ts
// src/data/electricityCarbonFactor.ts
export interface ElectricityCarbonFactor {
  id: string;
  province: string;       // 省/直辖市
  factor: number;         // tCO₂/万kWh
  year: number;           // 因子年份(电网因子每年更新)
  source: string;         // 数据来源
}
export function getElectricityCarbonFactor(province: string, year?: number): number { ... }

// src/data/fossilCarbonFactor.ts
export interface FossilCarbonFactor {
  id: string;
  fuelType: string;       // 天然气/汽柴油/无烟煤/烟煤/液化石油气...
  factor: number;         // tCO₂/单位(按能源类型单位不同)
  unit: string;           // Nm³/kg/L...
  source: string;
}
export function getFossilCarbonFactor(fuelType: string): number { ... }
```

`COAL_FACTOR` 保留(GB/T 2589 国标单一值)。`CARBON_FACTOR` 和 `GAS_CARBON_FACTOR` 改为查表函数的回退默认值(查不到时用),实际计算必须走查表。

### 5.4 运维费:Step 3 -> Step 5 数据流贯通(Phase 1.9)

**Step 3 层(算法不变)**:

```ts
// 已有逻辑,保留
calcMaintenanceFromAll(inv) = inv.maintenance.reduce((s, r) => s + r.subtotal, 0)
// subtotal = quantity × unitPrice = 年度总价
```

**Step 5 层(改为从 Step 3 读取)**:

```ts
// 新增:从 Step 3 运维行按 maintenanceCategory 拆分
function deriveStep5MaintenanceFromStep3(step3Data: TechInvestment): {
  repairCost: number;
  laborCost: number;
} {
  const repairRows = step3Data.maintenance.filter(
    (r) => r.maintenanceCategory === '维保费用'
  );
  const laborRows = step3Data.maintenance.filter(
    (r) => r.maintenanceCategory === '运维人工费用'
  );
  return {
    repairCost: repairRows.reduce((s, r) => s + r.subtotal, 0),
    laborCost: laborRows.reduce((s, r) => s + r.subtotal, 0),
  };
}

// adminCost 保留用户填(Step 3 没有此分类)
// N 年总运维成本 = (repairCost + laborCost + adminCost) × operatingPeriod  (已有逻辑)
```

**UI 行为**:
- Step 5 表单的 `repairCost`/`laborCost` 字段改为"自动填充 + 可编辑"
- 自动填充值来自 Step 3(按 `maintenanceCategory` 拆分)
- 用户可微调(比如 Step 3 没考虑的运维成本)
- `adminCost` 完全用户填

**年限处理**:
- Step 3 运维表的 `years` 列作为参考展示,不参与计算
- Step 5 用 `operatingPeriod`(用户配置的项目运维期)作为 N
- `lifecycleTotal` 字段保留,UI 可选展示"Excel 参考全周期总价",不参与计算

**改动位置**:
- `src/steps/step5-decision/utils/financialCalculate.ts`:加 `deriveStep5MaintenanceFromStep3` 函数
- `src/steps/step5-decision/index.tsx` 或对应组件:Step 5 表单运维费字段改为"自动填充 + 可编辑"
- `src/shared/stores/projectStore.ts`:Step 5 数据加载时调用 derive 函数,从 Step 3 读取

## 6. Phase 拆分

### Phase 1: 全链路接通 + 数据流贯通(预计 14-16 天)

**目标**:Step 1-5 全链路跑通真实数据,Step 3 -> Step 5 运维费贯通。

**子阶段工作量(纯工作日,含验证,不含 Session 间接力开销)**:

| 子阶段 | 任务 | 文件 | 工作量 |
|---|---|---|---|
| 1.0 | Step 1 表单字段核对 | `src/steps/step1-basic-info/components/SubStep*.tsx` | 0.5 天 |
| 1.1 | 技术卡片字段核对 | `src/data/materials.ts` 的 `techEntries` | 0.5 天 |
| 1.2 | 规范标准库基础部分补全 | `src/data/standards.ts`(被计算引用的国标,初步清单见下) | 0.5 天 |
| 1.3 | 模块2 的 6 个计算表录入 | `src/data/techBoundaries.ts` 等 6 个新文件 | 3 天 |
| 1.4 | 12 个设备表替换 + 设备分类库核对 + Schema 扩展 | `src/data/materials.ts` + `equipmentClassification.ts` + `projectStore.ts` | 2 天 |
| 1.5 | 模块4 的 2 个碳排放因子表录入 | `src/data/electricityCarbonFactor.ts` 等 | 0.5 天 |
| 1.6 | Step 2 综合节能率接通 | `src/steps/step2-solution/components/*` | 2.5 天 |
| 1.7 | Step 3 投资汇总验证 | - | 0.5 天 |
| 1.8 | Step 4 能耗/碳排放计算接通 | `src/steps/step4-energy/components/StepCalculation.tsx` + `helpers.ts` + `DataAnalysis.tsx` | 2.5 天 |
| 1.9 | Step 5 运维费从 Step 3 读取 | `src/steps/step5-decision/utils/financialCalculate.ts` + `index.tsx` + `projectStore.ts` | 1 天 |
| 1.10 | 全链路联调 + UI 微调 | - | 1.5 天 |

**小计**:15 天(纯工作日),加 Session 接力/意外问题排查缓冲,实际 14-16 天。

**1.2 规范标准库基础部分初步清单**(Phase 1.0 开工时和 Excel 对照后定稿):
- GB/T 2589-2020 综合能耗计算通则(折标煤系数,已被 `constants.ts` 引用)
- GB 50189 公共建筑节能设计标准(能耗限额对比依据)
- 医院建筑能耗相关行业标准(具体编号 Phase 1.0 查 Excel 确认)
- 其他被 Step 2/3/4 计算逻辑直接引用的国标(Phase 1.0 扫代码确认)

**保留现有逻辑(不改)**:
- Step 3 运维费算法(数量×单价求和)
- Step 5 N 年总成本循环逻辑(已有,改为从 Step 3 读输入)

**验证标准**:
- Step 1 表单字段和 Excel 对齐
- Step 2 综合节能率真实计算(非 seed 硬编)
- Step 3 编辑视图 4 个 Tab 显示真实数据
- Step 3 总表固定投资/初投资/运维费来自真实数据求和
- Step 4 能耗/碳排放按项目所在省查真实因子
- **Step 5 运维费自动从 Step 3 读取**(repairCost/laborCost 按 maintenanceCategory 拆分)
- Step 5 N 年运维费 = (repairCost + laborCost + adminCost) × operatingPeriod
- 全链路:Step 2 -> 3 -> 4 -> 5 真实数据贯通

### Phase 2: 参考库补全(预计 1-2 天)

**目标**:侧边栏三个库内容饱满。

| 子任务 | 文件 |
|---|---|
| 补全规范标准库(全量) | `src/data/standards.ts` |
| 补全能源政策库 | `src/data/policies.ts` |
| 补全能源价格表 | `src/data/materials.ts` 的 `energyPriceReferences` |
| 录入气候分区 + 光伏条件 | `src/data/climateZones.ts` + `solarConditions.ts` |

### Phase 3: 报告与文档归档(预计 1 天)

**目标**:Step 5 报告生成有依据,计算逻辑有文档。

| 子任务 | 文件 |
|---|---|
| 归档 3 个计算 docx 为 md | `docs/calc/*.md` |
| ReportView 章节结构核对 | `src/steps/step5-decision/report/ReportView.tsx` |
| 可视化建议摘要 | `docs/calc/step5-visualization.md` |

### Phase 4: 迁移到 Supabase(未来,预计 1 天)

**前置条件**:Phase 1-3 完成,Step 1-5 真实数据跑通,字段稳定至少 2 周。

**动作**:
1. 基于 `src/data/*.ts` 的 interface 设计 Supabase 表结构
2. 建表(每张表加 `id`/`version`/`updated_by`/`updated_at`/`is_system` 审计列)
3. 写迁移脚本:读 TS 文件 -> INSERT INTO Supabase
4. 改前端从 Supabase 读数据(替换 import)
5. 验证 Step 1-5 数据一致

### Phase 5: 中台管理界面(未来,预计 2-3 周)

**前置条件**:Phase 4 完成,数据在 Supabase,中台需求清晰。

**范围**:
- 中台前端:独立路由(`/admin/*`),列表/编辑/审核/版本界面
- 权限:管理员/专家/运营 三角色
- 审核流:运营提交 -> 专家审核 -> 管理员发布
- 版本管理:每次修改存版本,可回滚
- 仅管理 `is_system=true` 的预置数据,用户数据(`is_system=false`)仍在产品内编辑

## 7. 未来迁移路径(TS -> Supabase)

### 7.1 TS interface -> SQL schema

```ts
// src/data/energyWeight.ts
export interface EnergyWeightRow {
  id: string;
  systemType: string;
  weight: number;
  source: 'HVAC' | 'LGT';
}
```

对应 SQL:

```sql
CREATE TABLE energy_weights (
  id UUID PRIMARY KEY,
  system_type TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  source TEXT NOT NULL,
  -- 审计列
  version INT DEFAULT 1,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_system BOOLEAN DEFAULT TRUE
);
```

### 7.2 迁移脚本(Python)

```python
# scripts/migrate_ts_to_supabase.py
# 读 src/data/*.ts -> 解析 -> INSERT INTO Supabase
# 每张表一个迁移函数
```

脚本一次性运行,迁移完成后 TS 文件保留作为 seed 数据备份。

## 8. 风险与应对

### 8.1 Excel 字段不一致风险

12 个设备表的 Excel 结构看起来一致(4 个 sheet,列名相同),但需要逐个验证:
- "是否主要用能设备"列用 'R'/'£' 标记,'£' 字符可能是编码问题,需确认含义
- 运维表的 `maintenanceCategory` 实际是自由文本,需要约定枚举值

**应对**:Phase 1.4 第一步先录 2-3 个技术验证脚本和 schema,确认无问题后批量录。

### 8.2 数据准确性验证风险

录入 700+ 行数据,人工核对不现实。没有验证机制,错误数据会进入计算链路,后续排查困难。

**应对**:
- Python 脚本录入时同时输出"行数统计"和"关键字段抽样",和 Excel 原文件对比
- 录入后跑验证脚本:每张表的行数、数值列总和、关键字段非空率
- 关键计算结果(如 Step 3 总投资)和 Excel 原文件手工算的总和对比

### 8.3 Excel 本身可能有错

桌面文件是用户整理的,可能存在错误(如 '£' 编码问题、单位不一致、公式错误)。

**应对**:
- 录入时不修正 Excel 数据(保持原样)
- 发现可疑数据标记到 `docs/calc/excel-data-issues.md`
- Phase 1.10 联调时统一 review 可疑数据,确认后修正

### 8.4 计算逻辑改动的回归风险

Step 2/4/5 计算逻辑改了,seed 数据(`seedProject.ts`)里的硬编值可能不再匹配,导致显示异常。

例如:seed 里 `comprehensiveRate: 15.2`,但接通真实修正系数后算出来是 18.7--seed 值会覆盖真实计算,或者产生不一致。

**应对**:
- Phase 1.6/1.8/1.9 改计算逻辑时,同步清理 seed 里对应的硬编值
- seed 改为只保留"输入项"(项目信息、选技术),不保留"计算结果"
- 计算结果由真实逻辑实时算

### 8.5 数据更新机制缺失

真实数据会变(电价每年调整、碳排放因子每年更新、政策变化)。中台没做之前,数据更新只能改 TS + 发版。

**应对**:
- 短期:数据更新走 TS 文件修改 + git commit + Vercel 自动部署(可接受,频率低)
- 长期:Phase 5 中台完成后,数据更新走中台界面
- 在每个数据文件头注明"数据时效"(如 `// 数据年份: 2023 年电网碳排放因子`),便于后续检查是否过期

### 8.6 Excel 版本锁定风险

录入期间用户可能修改 Excel(发现错别字、补充数据)。如果录到一半 Excel 变了,要重新对账。

**应对**:
- Phase 1.0 开工时,先记录所有 Excel 文件的修改时间 + sha1 hash,写入 `docs/superpowers/specs/excel-version-lock.md`
- 录入期间 Excel 如有更新,走"变更流程"(记录差异,有选择地同步)
- 每个新建 TS 文件头注明 Excel hash(见 5.2)

### 8.7 跨 Session 进度丢失风险

12-14 天的工作不可能一次 Session 完成。每个 Session 之间上下文丢失,不知道上次做到哪、做过什么决策。

**应对**:
- Phase 1.0 开工前建进度文件 `docs/superpowers/progress/phase-1-progress.md`
- 记录:每个子阶段的完成状态(pending/in_progress/done)、实际工作量、遇到的问题和决策、下次 Session 从哪接
- 每个 Session 开头先读这个文件,结尾更新它

### 8.8 字段命名约定

新建 10 个 TS 文件,字段命名需要统一:
- 中文字段名 -> 英文 camelCase(如"设备分类" -> `equipmentCategory`)
- 枚举值用英文 string,不用数字
- 主键统一用 `id: string`(UUID,便于未来数据库迁移)

**应对**:Phase 1.0 开工前先定一份《数据字段命名约定》补到本 spec 附录 A。

## 9. 验收标准(具体测试用例)

### Phase 1 验收(全链路真实数据 + 数据流贯通)

每条验收标准配具体测试场景:

1. **Step 1 表单字段对齐**
   - 测试:Step 1 五个子步骤的表单字段和 `医院建筑基本信息表.xlsx` 一致(字段名、选项值)

2. **Step 2 技术卡片显示真实字段**
   - 测试:打开 Step 2,"相变储热供暖技术"卡片显示节能率"35%~45%"、投资指标"90元/㎡"
   - 测试:技术卡片字段和 Excel `节能技术全量信息.xlsx` 一致

3. **Step 2 综合节能率真实计算**
   - 测试:选 3 个技术(如相变储热 + 高效空调 + 智能照明),综合节能率 = 各项节能率 × 机电系统能耗权重 × 重叠修正系数 × 医院整体修正系数
   - 验证:和 `！！计算1-节能技术筛选和综合节能率估算.docx` 的算例手算结果一致(±0.5%);若 docx 算例不可信,改用 Excel 表数据自洽性验证

4. **Step 3 设备表真实数据**
   - 测试:打开"相变储热供暖技术"编辑视图,设备表第 1 行 = "图灵 BOX 边缘计算中枢,规格:定制化,数量:1,单价:350000"(和 Excel 一致)
   - 测试:12 个技术各自打开,4 个 Tab 数据和 Excel 一致

5. **Step 3 总表求和正确**
   - 测试:"相变储热"固定投资 = Excel 设备表总价 + 材料表总价 + 安装调试总价 + 运维年度总价(±0.01 万元)
   - 测试:总表"固定投资/初投资/运维费"列 = 当前项目下所有已选技术求和

6. **Step 4 能耗计算用真实权重**
   - 测试:换不同机电系统组合(如全电制冷 vs 燃气锅炉+热泵),能耗权重查表结果变化
   - 验证:权重和 `机电系统能耗权重表.xlsx` 一致

7. **Step 4 能耗折算用真实系数**
   - 测试:电/气/油/煤分别按 `能源折算系数.xlsx` 的系数折算为 tce
   - 验证:折算结果和 Excel 系数一致

8. **Step 4 碳排放分省查表**
   - 测试:项目设"北京市",电力碳排放因子 = 北京市值;换"上海市" = 上海市值
   - 测试:天然气碳排放按 `化石能源碳排放因子.xlsx` 查表,不是单一常量

9. **Step 5 运维费从 Step 3 自动读取**
   - 测试:Step 3"相变储热"运维表"维保费用"分类行求和 = Step 5 表单 `repairCost` 字段值
   - 测试:Step 3 运维表"运维人工费用"分类行求和 = Step 5 表单 `laborCost` 字段值
   - 测试:Step 5 表单运维费字段可编辑(用户可微调)
   - 测试:改 Step 3 运维表数据,Step 5 运维费自动更新

10. **Step 5 N 年运维费计算**
    - 测试:10 年运维费 = (repairCost + laborCost + adminCost) × 10
    - 测试:换不同运维期(5/8/10/15/20 年),运维费按比例变化

11. **全链路贯通**
    - 测试:Step 1 填项目信息 -> Step 2 选 3 个技术 -> Step 3 真实投资 -> Step 4 真实能耗/碳排放 -> Step 5 真实财务指标
    - 验证:整个链路无 seed 硬编计算结果(项目信息等输入项除外),所有数字可追溯到 `src/data/*.ts`

### Phase 2 验收(参考库补全)

12. **侧边栏三个库内容饱满**
    - 测试:规范标准库显示全量国/地/行标(非 3 条占位)
    - 测试:政策绿融库按省查到真实政策 + 补贴
    - 测试:能源价格表按省查到真实峰平谷电价/气价/水价

### Phase 3 验收(报告)

13. **Step 5 报告章节对齐**
    - 测试:ReportView 章节结构和 `【模板】投资策略报告.docx` 一致

## 附录 A: 数据字段命名约定(Phase 1.0 开工前补)

Phase 1.0 开工前补充,内容:
- 中英文字段名映射规则
- 枚举值约定
- 主键/审计列约定
- 单位规范(沿用 CLAUDE.md 中的数据展示规范)

## 附录 B: 桌面文件完整清单

```
/Users/plus0/Desktop/技术交底-20260701/
├── 模块0：三库全书/
│   ├── 规范标准库/规范标准全名录.xlsx
│   ├── 系统素材库/建筑机电系统设备分类表-第3步绿表1.xlsx
│   └── 政策绿融库/
│       ├── 全国各省及直辖市主要城市能源政策.xlsx
│       └── 全国各省及直辖市主要城市能源价格表（水电气）.xlsx
├── 模块1：建筑基本信息/
│   └── 医院建筑基本信息表.xlsx
├── 模块2：节能方案筛选/
│   ├── 节能技术全量信息（技术卡片）.xlsx
│   ├── 节能技术卡片-适用边界条件梳理表.xlsx
│   ├── 技术组合重叠修正系数表.xlsx
│   ├── 医院整体修正系数表.xlsx
│   ├── 医院建筑能耗限额标准汇总表.xlsx
│   ├── 机电系统能耗权重表.xlsx
│   ├── 能源折算系数.xlsx
│   ├── 气候分区.xlsx
│   ├── 全国各省及直辖市主要城市光伏条件.xlsx
│   └── ！！计算1-节能技术筛选和综合节能率估算.docx
├── 模块3：机电系统投资概算/
│   └── 设备材料安装运维表/  (12 个 xlsx)
├── 模块4：节能计算与数据分析/
│   ├── 电力平均碳排放因子（省级电网）.xlsx
│   ├── 化石能源碳排放因子.xlsx
│   ├── ！！计算2-节能率计算-运行时间.docx
│   └── ！！计算3-数据分析（节能项目数据分析指标计算说明）.docx
└── 模块5：投资决策报告模板/
    ├── 【模板】医院建筑节能改造投资策略报告.docx
    └── 【建议】可视化内容.pdf
```

## 附录 C: 跨 Session 进度跟踪(Phase 1.0 开工时建)

文件位置:`docs/superpowers/progress/phase-1-progress.md`

内容结构:

```markdown
# Phase 1 进度跟踪

## 当前状态
- 进行中:1.x
- 下一步:1.y

## 子阶段状态
| 子阶段 | 状态 | 实际工作量 | 备注 |
|---|---|---|---|
| 1.0 | done | 0.5 天 | - |
| 1.1 | in_progress | - | 录入到 techBoundaries.ts |
| ... | ... | ... | ... |

## 决策记录
- 2026-07-11:运维费采用"Step 3 -> Step 5 数据流贯通"方案
- ...

## 遇到的问题
- ...

## 下次 Session 接力点
- 从 1.x 继续,先做 ...
```

每个 Session 开头读这个文件,结尾更新它。
