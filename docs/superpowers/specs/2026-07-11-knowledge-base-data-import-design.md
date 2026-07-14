# 知识底座数据录入设计

**版本**: 2026-07-11 (rev 7 - 五轮对抗审查修正 + 8.9 SQL 置 null + 1.9 工作量再修正)
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

**注意**:Step 5 财务计算不止运维费,还有收入模型(按 investmentMode 分)、能源费、总投资(详见 5.6/5.8)。本节只讲运维费一条贯通,其他在 5.6/5.8。

### 2.3 录入顺序:按依赖关系分 11 个子阶段

从第一性原理看,录入顺序应该按**数据依赖关系**,不是按模块顺序:

```
Phase 1.0: Step 1 表单字段核对 + 全链路数据流盘点        (前置依赖,Step 2 计算输入 + 1.4 schema 扩展依据)
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

**1.0/1.1 核对范围**:

**1.0 Step 1 字段核对**:
- **必输出**差异报告 `docs/superpowers/progress/step1-field-diff.md`,4 类差异分类:
  - 字段名不一致(如代码 `hospitalType` vs Excel"医院类型")
  - 选项值不一致(如代码选项 vs Excel 选项)
  - 代码缺字段(Excel 有,代码没有)
  - Excel 缺字段(代码有,Excel 没有)
- **影响计算的差异当场改代码**(补选项 / 改字段名 / 补缺失字段),工作量算 1.0
  - 影响计算的字段:医院类型 / 机电系统 / 技术节能率 / 投资指标(1.6/1.8 依赖)
- **不影响计算的字段**(如 UI 显示文案)记录到报告,1.10 改
- 改完代码不反向更新 Excel(Excel 是源,代码对齐 Excel)

**1.1 技术卡片字段核对**:同上,额外确认 `techEntries` 的 techId 和 `techDefaultInvestments` 的 techId 完全一致,不一致记录到报告。

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
| 12 个设备表.xlsx | `src/data/techInvestments.ts`(新建,从 materials.ts 拆出) | 替换 `techDefaultInvestments`,拆分到独立文件 | 1.4 |
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

**localStorage 旧数据迁移**(Phase 1.4 改 schema 时同步加):

改 schema 后,用户 localStorage 里的旧项目数据有 `costType`,没有 `maintenanceCategory`。直接读会让 Step 5 拆分逻辑(查 `maintenanceCategory === '维保费用'`)得到 0,运维费算不出来。

在 `projectStore` 的 persist 配置里加 `onRehydrateStorage` 迁移函数:

```ts
// src/shared/stores/projectStore.ts
onRehydrateStorage: () => (state) => {
  if (!state) return;
  const step3 = state.projectsStep3Data;
  if (!step3) return;
  for (const projectId of Object.keys(step3)) {
    const techMap = step3[projectId];
    if (!techMap) continue;
    for (const techId of Object.keys(techMap)) {
      const techInv = techMap[techId];
      if (!techInv?.maintenance) continue;
      techInv.maintenance = techInv.maintenance.map((row: any) => {
        if (row.maintenanceCategory) return row;  // 已迁移或新数据
        if (row.costType === 'repair') return { ...row, maintenanceCategory: '维保费用' };
        if (row.costType === 'labor') return { ...row, maintenanceCategory: '运维人工费用' };
        return row;  // 无 costType 也无 maintenanceCategory,保留原样
      });
    }
  }
}
```

迁移后旧 `costType` 字段保留(不删,避免破坏未知引用),新代码不再读它。Phase 4 迁移 Supabase 时统一清理。

参考 memory `feedback_localstorage_stale_data_migration.md` 的教训:改 schema 后必须加迁移,否则旧数据让新逻辑算出 0。

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

**触发时机与冲突处理**:
- **首次加载**:Step 5 第一次打开时,自动从 Step 3 读取并填充 `repairCost`/`laborCost`
- **后续 Step 3 变化**:不自动覆盖 Step 5 的值,UI 显示提示"Step 3 运维表已更新,点这里重新计算",用户主动点才覆盖
- **dirty flag**:用户手改 `repairCost`/`laborCost` 后,字段标记 dirty(如 `repairCostDirty: true`),Step 3 变化时只提示不覆盖
- **adminCost**:一直用户填,不自动,不标 dirty
- **重置**:用户点"重新计算"按钮,清除 dirty 标记,从 Step 3 重新读取

**dirty flag 持久性**(对抗审查第三轮补):
- **瞬态字段**,刷新页面清除,`persist` 的 `partialize` 排除(参考 memory `zustand-persist-transient-state.md`)
- 理由:刷新后重新从 Step 3 读取是合理行为,用户手改值丢失但可重新触发"Step 3 已更新"提示
- **字段位置**:不扩 `DecisionProjectData` 接口(避免 schema 膨胀),用 store 内存层的 `step5DirtyFlags: { repairCostDirty?: boolean; laborCostDirty?: boolean; energyCostDirty?: boolean; annualEnergySavingDirty?: boolean }`,不 persist

**年限处理**:
- Step 3 运维表的 `years` 列作为参考展示,不参与计算
- Step 5 用 `operatingPeriod`(用户配置的项目运维期)作为 N
- `lifecycleTotal` 字段保留,UI 可选展示"Excel 参考全周期总价",不参与计算

**改动位置**:
- `src/steps/step5-decision/utils/financialCalculate.ts`:加 `deriveStep5MaintenanceFromStep3` 函数
- `src/steps/step5-decision/index.tsx` 或对应组件:Step 5 表单运维费字段改为"自动填充 + 可编辑"
- `src/shared/stores/projectStore.ts`:Step 5 数据加载时调用 derive 函数,从 Step 3 读取

### 5.5 数据流断点全盘点(Phase 1.0 前置)

spec 1.9 只修 Step 3 -> 5 运维费,但"链路可通"要求所有断点都通。1.0 开工前先盘点 Step 2->3、3->4、4->5 的所有数据传递字段。

**输出**:`docs/superpowers/progress/data-flow-audit.md`

**盘点内容**:

| 断点 | 传递字段 | 当前状态 | Phase |
|---|---|---|---|
| Step 2 -> Step 3 | techId(选中的技术) | 已通(seed 里 ['1','3','4']) | 1.1 核对 techId 对齐 |
| Step 3 -> Step 4 | 设备功率(`powerKw`)/系统容量(`systemCapacity`)/运维分类(`maintenanceCategory`) | **未盘**(对抗审查第三轮发现:挪到 1.0 前置) | 1.0 盘,1.4 schema 扩展时用 |
| Step 3 -> Step 5 | `maintenanceCost`(运维费,按 `maintenanceCategory` 拆分 repairCost/laborCost) | 不通(Step 5 重填) | 1.9 接通 |
| Step 4 -> Step 5 | `savingCostRun`(节能金额 = annualEnergySaving)/ `originalCostRun`(原能源费,算 energyCost) | 不通(Step 5 重填) | 1.9 接通(见 5.6) |

**Step 3 -> Step 4 传递字段盘点方法**(1.0 前置,1.4 schema 扩展前必须完成):
1. 读 `src/steps/step4-energy/components/StepCalculation.tsx` 和 `helpers.ts`
2. 找所有读 `step3Data` / `techInvestment` / `projectsStep3Data` 的代码
3. 列出读取的字段名
4. 确认这些字段在 `TechInvestment`/`InvestmentRow` 类型里存在
5. 确认这些字段的值在 Step 3 编辑后能传到 Step 4
6. **额外盘点**:`Step4ProjectData.savingEquipments` 和 `originalEquipments` 字段(`projectStore.ts` line 118-119),确认数据来源--是否从 Step 3 的 `equipment` 表读?如果是,1.4 schema 扩展和 1.8 接通都要考虑
7. 输出到 `data-flow-audit.md` 的"Step 3 -> Step 4"小节

**Step 4 -> Step 5 节能金额传递盘点方法**:
1. 读 `src/steps/step5-decision/utils/financialCalculate.ts`
2. 找所有读 `step4Data` / `projectsStep4Data` 的代码
3. 确认 `savingCostRun`/`originalCostRun` 字段是否被读取(目前不被读,见 5.6.3/5.6.4)
4. 1.9 加"从 Step 4 读取 savingCostRun + originalCostRun"逻辑(见 5.6)

**盘点时机修正**(对抗审查第三轮):
- rev 4 把 Step 3 -> 4 盘点放在 1.8 开工前,但 1.4 schema 扩展就需要--如果 1.8 才发现要扩 `InvestmentRow` 字段,1.4 已经做完要回头改
- 修正:全部盘点挪到 1.0 前置,1.0 开工时一次性盘完 Step 2->3/3->4/3->5/4->5 四条断点

### 5.6 Step 4 -> Step 5 节能金额 + 能源费 + 收入模型贯通(Phase 1.9)

**当前现状**(第三轮对抗审查发现 rev 4 的 5.6 节错在哪里):

Step 5 财务计算实际读取的字段(`financialCalculate.ts`):
- `energyCost` - 能源费(总成本费用表)
- `repairCost`/`laborCost`/`adminCost` - 运维费三类(总成本费用表)
- `custodialOperationFee` - 托管运营费(作为收入,line 380:`revenueExTax = custodialFee / (1 + VAT_RATE_SERVICE)`)
- `totalFixedInvestment` - 总投资(line 364-365,有 fallback 路径)
- `annualEnergySaving` - 节能金额(`DecisionProjectData` 已有字段 line 143,但 `financialCalculate.ts` **从头到尾没读它**)

Step 4 已经算了:
- `savingCostRun` - 节能金额(单技术,万元/年)
- `originalCostRun` - 原能能源费(单技术,万元/年)

**rev 4 的 5.6 节错在**:
1. 假设"Step 5 收入 = savingCostRun",但代码里收入 = custodialOperationFee,业务模型层就错了
2. 只接 savingCostRun,没接 originalCostRun,Step 5 的 energyCost 还是用户手填,数据流还是断的
3. 12 个 savingCostRun 求和当项目级收入,没说业务规则(是项目级汇总还是按比例)

**决策**:1.9 扩展为"运维费 + 节能金额 + 能源费 + 收入模型"四条贯通,且按 investmentMode 分情况算收入。

#### 5.6.1 Step 5 收入模型(按 investmentMode 分)

`DecisionProjectData.investmentMode` 已有 7 种枚举(`''`/`'EMC'`/`'BOT'`/`'EMC-profit'`/`'EMC-guarantee'`/`'EMC-trust'`/`'PPP'`)。不同模式下收入来源不同:

| investmentMode | 收入来源 | 算法 |
|---|---|---|
| `''`(未选)/`'EMC'`/`'EMC-profit'` | 节能收益分享 | `annualEnergySaving × profitShare`(见 5.6.2) |
| `'EMC-guarantee'` | 托管费 + 节能收益分成 | `custodialOperationFee + annualEnergySaving × profitShare` |
| `'EMC-trust'`/`'BOT'` | 托管运营费 | `custodialOperationFee`(用户填,不从 Step 4 读) |
| `'PPP'` | 托管费 + 政府补贴 | `custodialOperationFee + subsidy`(两者都用户填) |

`annualEnergySaving` = Step 4 所有技术 `savingCostRun` 求和(项目级年度节能金额)。

#### 5.6.2 节能收益分享比例(EMC 模式)

`DecisionProjectData` 已有字段:
- `initialProfitShare1`/`initialProfitShare2` - 初始阶段甲乙双方分享比例(%)
- `changeYear` - 变更年份
- `changeProfitShare1`/`changeProfitShare2` - 变更后分享比例(%)

`financialCalculate.ts` 改造:
- 第 1 ~ `changeYear` 年:`revenue = annualEnergySaving × initialProfitShare2 / 100`(乙方分享部分作为收入)
- 第 `changeYear+1` ~ `operatingPeriod` 年:`revenue = annualEnergySaving × changeProfitShare2 / 100`
- 原 `revenueExTax = custodialFee / (1 + VAT_RATE_SERVICE)` 改为按 investmentMode 分支(5.6.1 表格)
- 节能收益是含税收人,仍要 `/ (1 + VAT_RATE_SERVICE)` 转不含税

#### 5.6.3 energyCost 接通(Step 4 -> Step 5)

```ts
function deriveStep5EnergyCostFromStep4(step4Data: Step4ProjectData): number {
  const originalCost = Object.values(step4Data.techs || {})
    .reduce((s, t) => s + (t.originalCostRun || 0), 0);
  const savingCost = Object.values(step4Data.techs || {})
    .reduce((s, t) => s + (t.savingCostRun || 0), 0);
  return Math.max(0, originalCost - savingCost);  // 节能后实际能源费,不为负
}
```

Step 5 表单的 `energyCost` 字段改为"自动填充 + 可编辑"(同 5.4 运维费 dirty flag 逻辑)。

#### 5.6.4 annualEnergySaving 接通

```ts
function deriveStep5IncomeFromStep4(step4Data: Step4ProjectData): number {
  return Object.values(step4Data.techs || {})
    .reduce((s, t) => s + (t.savingCostRun || 0), 0);
}
```

返回值赋给 `DecisionProjectData.annualEnergySaving`(已有字段,line 143)。

#### 5.6.5 custodialOperationFee 处理

- `EMC`/`EMC-profit` 模式:`custodialOperationFee` 不用(收入走节能收益分享),seed 置 0,UI 隐藏
- `EMC-guarantee`/`EMC-trust`/`BOT`/`PPP` 模式:`custodialOperationFee` 保留用户填,不从 Step 4 读
- `''`(未选模式):Step 5 报错提示"请先选投资模式",不算财务指标

#### 5.6.6 UI 行为(同运维费逻辑)

- 首次加载自动填充 `annualEnergySaving`/`energyCost`,后续 Step 4 变化不覆盖,dirty flag 标识手改
- `custodialOperationFee`(EMC-guarantee/EMC-trust/BOT/PPP 模式)一直用户填,不自动
- 分享比例字段(`initialProfitShare*`/`changeProfitShare*`)一直用户填,不自动

**改动位置**:
- `src/steps/step5-decision/utils/financialCalculate.ts`:改 `revenueExTax` 计算为按 investmentMode 分支,加 derive 函数
- `src/steps/step5-decision/index.tsx`:`annualEnergySaving`/`energyCost` 字段改为自动填充,按 investmentMode 显隐 `custodialOperationFee`
- `src/shared/stores/projectStore.ts`:Step 5 数据加载时调用 derive 函数

### 5.7 文件拆分:techDefaultInvestments 从 materials.ts 拆出(Phase 1.4)

12 个设备表 700+ 行,塞进 `materials.ts` 会让文件膨胀到 5000+ 行,影响开发体验(IDE 卡、git diff 难看)。

**拆分方案**:
- `src/data/techInvestments.ts`:主文件,import 各技术,汇总导出 `techDefaultInvestments`
- `src/data/techInvestments/{techId}.ts`:每个技术一个文件(如 `1.ts`/`3.ts`/`4.ts` ... `12.ts`)
- `materials.ts` 删除 `techDefaultInvestments`,只保留 `techEntries`/`energyPriceReferences`

**迁移**:
- 所有 `import { techDefaultInvestments } from '@/data/materials'` 改为 `from '@/data/techInvestments'`
- `seedProject.ts:2` 的 import 同步改
- 1.4 录入时直接按拆分结构录入,不留中间状态

### 5.8 Step 5 总投资 fallback 路径修正(Phase 1.9)

**当前现状**(对抗审查第三轮发现):

`financialCalculate.ts` line 364-365:
```ts
const investment = data.totalFixedInvestment > 0 ? data.totalFixedInvestment
    : data.initialInvestment + data.installationCost;
```

fallback 路径(`totalFixedInvestment` 为 0 时)= `initialInvestment + installationCost`,**不含 maintenanceCost**。

但 spec 2.2 + `seedProject.ts:241`:`fixedInvestment = initial + installCost + maintCost`(含运维,用户已确认)。

两条路径算出的"建设投资"不一致:
- 主路径(有 totalFixedInvestment):含运维
- fallback(无 totalFixedInvestment):不含运维

**决策**:统一为含运维,且强制从 Step 3 汇总,不走 fallback。

**改动**:
```ts
// financialCalculate.ts 改造
const investment = data.totalFixedInvestment > 0
  ? data.totalFixedInvestment
  : data.initialInvestment + data.installationCost + data.maintenanceCost;
//                                                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// fallback 也含运维,和 seed 的 fixedInvestment 算法对齐
```

**长期方案**(1.9 同步做):
- Step 5 的 `totalFixedInvestment`/`initialInvestment`/`installationCost`/`maintenanceCost` 都从 Step 3 自动汇总(见 8.4 seed 字段分类)
- 不再走 fallback,所有路径统一从 Step 3 读
- 详见 8.4 seed 字段分类表

**改动位置**:
- `src/steps/step5-decision/utils/financialCalculate.ts`:fallback 加 `data.maintenanceCost`
- `src/shared/stores/projectStore.ts`:Step 5 数据加载时从 Step 3 汇总四个字段

### 5.9 Step 2 综合节能率算法定义(Phase 1.6,对抗审查第四轮新增)

**当前现状**(代码和 spec 验收标准矛盾):

`calcComprehensiveRate`(`step2-solution/constants.ts:52-68`)是**连乘法**:
```ts
const combinedLower = 1 - rates.reduce((acc, r) => acc * (1 - r.lower), 1);
// = 1 - (1-r1)(1-r2)(1-r3)...
```
纯用单项节能率,没有权重/重叠修正/整体修正。

但 spec 验收标准第 3 条要求:
> 综合节能率 = 各项节能率 × 机电系统能耗权重 × 重叠修正系数 × 医院整体修正系数

spec 1.3 录"重叠修正系数表""医院整体修正系数表""机电系统能耗权重表"+"适用边界条件梳理表"(适配度打分),1.6 接通。rev 8(2026-07-14)已在 §5.9.1-5.9.6 定稿查表算法、函数签名、UI 输入来源(基于 1.3 录入的实际 Excel 结构 + PM 审核文档 `docs/step2-综合节能率计算逻辑说明.md`)。

#### 5.9.1 真实算法框架(2026-07-14 定稿,基于 Excel 实际结构 + PM 审核文档)

权威公式(来源:`docs/step2-综合节能率计算逻辑说明.md` 第五节):

```
综合节能率 =
  Σ_s [ (Σ_{i∈s} 修正后节能率_i) × 重叠修正系数(|s|) × 系统能耗权重(s, 气候区) ]
  × 医院整体修正系数(投产年份)
```

其中:
- **修正后节能率_i** = 基准节能率(取值1) × 适配度%
  - 基准节能率取值1 = `techEntry.energySavingRate` 区间上限(如 "5%-15%" 取 15%)
  - 适配度% = techBoundaries 打分总分 / 100(0~1)
- **重叠修正系数(|s|)** = 查 `overlapCorrection.ts`,按同一作用系统内的技术数量查(1->1.0, 2->0.75, 3->0.70, 4+->0.65)
- **系统能耗权重(s, 气候区)** = 查 `energyWeight.ts`,只用「全院区综合系统能耗」维度,按(作用系统 × 气候分区)查
- **医院整体修正系数(投产年份)** = 查 `hospitalCorrection.ts`,按冷热源最早投产年份查(<2010->1.1, 2010~2020->1.0, >2020->0.9)

关键细节(与 rev 5 推测不同):
1. **组内加和,不是连乘**:`Σ(修正后节能率_i)`,不是 `1-Π(1-r_i)`。多个技术作用于同一系统时,节能率直接相加,再用重叠系数打折。
2. **跨系统技术**:一个技术可能作用于多个系统(如地源热泵同时作用于空调制冷+供暖),修正后节能率在每个作用的系统中都参与计算。
3. **作用系统分组**:按 `techEntry.affectedSystems`(对应 Excel "作用系统"字段)分组,不是按技术 ID。
4. **能耗权重只用一个维度**:`energyWeight.ts` 有 4 个能耗维度(制冷/供暖/非供暖/全院区综合),综合节能率只用「全院区综合系统能耗」维度。
5. **修正后节能率含适配度**:不是直接用基准节能率,要乘以 techBoundaries 打分得到的适配度%。

#### 5.9.2 查表算法(2026-07-14 定稿,基于 1.3 录入的实际 TS 文件)

**能耗权重表**(`energyWeight.ts`,1.3 录入):
```ts
// 实际结构:三维(能耗维度 × 作用系统 × 气候分区)
interface EnergyWeightRow {
  energyDimension: string;   // '制冷系统能耗' | '供暖系统能耗' | '非供暖系统能耗' | '全院区综合系统能耗'
  system: string;             // '空调制冷系统' | '供暖系统' | '照明系统' | ...
  weights: Record<string, number>;  // { '严寒地区': 1.0, '寒冷地区': 1.0, ... }
}
function getEnergyWeight(energyDimension: string, system: string, climateZone: string): number
```
综合节能率计算时,`energyDimension` 固定传 `'全院区综合系统能耗'`。

**重叠修正系数表**(`overlapCorrection.ts`,1.3 录入):
```ts
// 实际结构:一维表(技术数量 -> 系数),不是二维两两组合
interface OverlapCorrectionRow {
  techCount: number;    // 1 | 2 | 3 | 4
  correction: number;   // 1.00 | 0.75 | 0.70 | 0.65
}
function getOverlapCorrection(techCount: number): number  // 4+ 默认 0.65
```
查表键是"同一作用系统内的技术数量",不是技术 ID 两两组合。

**医院整体修正系数表**(`hospitalCorrection.ts`,1.3 录入):
```ts
// 实际结构:按冷热源投产年份查,不是按医院类型
interface HospitalCorrectionRow {
  category: string;        // '老旧医院' | '中年医院' | '新建医院'
  hvacYearRange: string;   // '<2010' | '2010~2020' | '>2020'
  maxYear: number;         // 2010 | 2020 | Infinity
  correction: number;      // 1.1 | 1.0 | 0.9
}
function getHospitalCorrection(hvacYear: number): number
```
查表键是"冷热源系统最早投产年份",从 Step 1 机电系统表单读取,不是医院类型。

**适配度打分表**(`techBoundaries.ts`,1.3 录入,新增):
```ts
// 实际结构:12 技术 × 70 维度 × 210 条件,含 36 个一票否决项
interface TechBoundary {
  techName: string;
  dimensions: BoundaryDimension[];  // 打分维度,权重合计=1.0(洁净区域冷热源=0.9)
}
function getTechBoundary(techName: string): TechBoundary | undefined
function getVetoConditions(techName: string): VetoCondition[]
```
打分逻辑:
- 每个维度有权重,符合=权重×100%,部分符合=权重×50%,不符合=权重×0%
- 一票否决项命中 -> 总分=0,直接不推荐(不进入综合节能率计算)
- 适配度% = 总分 / 100,作为修正后节能率的系数

#### 5.9.3 calcComprehensiveRate 新签名(2026-07-14 定稿)

```ts
// 旧签名(只收 techs,用错误的连乘公式)
export function calcComprehensiveRate(techs: TechEntry[]): { lower: number; upper: number } | null

// 新签名(收查表所需的全部输入)
interface ComprehensiveRateInput {
  techs: TechEntry[];              // 用户勾选的技术(已通过筛选,得分≥80)
  climateZone: string;             // 从 Step 1 读,查能耗权重(如 '寒冷地区')
  hvacYear: number;                // 从 Step 1 机电系统读,查医院整体修正(冷热源最早投产年份)
  hospitalLevel: '三级' | '二级';  // 从 Step 1 读,查能耗限额
  province: string;                // 从 Step 1 读,查能耗限额
  totalArea: number;               // 从 Step 1 读,算 original 能耗
}

interface SystemGroupContribution {
  system: string;                  // 作用系统名(如 '空调制冷系统')
  techs: {
    techId: string;
    techName: string;
    baseRate: number;              // 基准节能率取值1(如 0.15)
    adaptation: number;            // 适配度%(0~1)
    adjustedRate: number;          // 修正后节能率 = baseRate × adaptation
  }[];
  groupSum: number;                // 组内加和 Σ(修正后节能率_i)
  techCount: number;               // 组内技术数
  overlapCorrection: number;       // 重叠修正系数
  energyWeight: number;            // 系统能耗权重
  contribution: number;            // 分组节能率 = groupSum × overlap × weight
}

interface ComprehensiveRateResult {
  groups: SystemGroupContribution[];  // 按作用系统分组
  preliminaryRate: number;            // 初步综合节能率 = Σ(groups.contribution)
  hospitalCorrection: number;         // 医院整体修正系数
  finalRate: number;                  // 最终综合节能率 = preliminary × hospital
}

export function calcComprehensiveRate(input: ComprehensiveRateInput): ComprehensiveRateResult | null
```

返回 `null` 的情况:`techs` 为空,或所有技术都被一票否决。

#### 5.9.4 ComprehensiveRateModal 的 original 输入来源(2026-07-14 定稿)

当前 `ComprehensiveRateModal` 的 `original`(耗电量/气/煤/碳)是 `DEFAULT_ORIGINAL` 硬编:
```ts
const DEFAULT_ORIGINAL: Record<string, number> = {
  electricity: 250, gas: 18, coal: 850, carbon: 2100,
};
```

**1.6 决策**:从 Step 1 算(省份 × 医院等级 × 能源类型 × 面积),不从 Excel 录。
- `energyQuota.ts`(1.3 录入)提供"省份 × 医院等级 × 能源类型"多维查表
- 实际结构:6 数据行(北京电力/天然气/市政热力 + 天津电力/市政热力/天然气)+ 79 备注行(其他省份无数据)
- 算法:
  ```
  original.electricity = getEnergyQuota(province, hospitalLevel, '电力', 'comprehensive', 'baseline') × totalArea
  original.gas         = getEnergyQuota(province, hospitalLevel, '天然气', 'comprehensive', 'baseline') × totalArea
  original.heat        = getEnergyQuota(province, hospitalLevel, '市政热力', 'comprehensive', 'baseline') × totalArea
  ```
- 无数据省份:回退到 `DEFAULT_ORIGINAL` 硬编值,UI 标注"该省份无能耗限额数据,使用默认值"
- 用户可微调(保留输入框,但默认值从 Step 1 算,不是硬编)

#### 5.9.5 1.6 工作量重新估算

1.6 原估 4 天,实际包含:
- 改 `calcComprehensiveRate` 函数签名 + 算法(1 天)
- 接 4 个查表函数(能耗权重/重叠修正/医院整体修正/适配度打分)(1 天)
- 改 `ComprehensiveRateModal` 的 original 输入来源(0.5 天)
- 改 Step 2 调用方传 climateZone/hvacYear/province/hospitalLevel/totalArea(0.5 天)
- 调 seed 不匹配(0.5 天)
- 验证(0.5 天)

合计 4 天,**维持原估**。Excel 结构已在 1.0+1.3 确认(见 §5.9.6),无阻塞。

#### 5.9.6 实际结构确认结果(2026-07-14,1.0+1.3 完成后定稿)

原 §5.9.6 是"1.0 前置依赖清单"(4 个 Excel 待确认),1.0 和 1.3 已完成探测和录入,实际结构如下:

| Excel 表 | spec 原假设(rev 5) | 实际结构 | TS 文件 |
|---|---|---|---|
| 技术组合重叠修正系数表 | 二维表,技术两两组合 | **一维表**:技术数量 -> 系数(1/2/3/4+ -> 1.0/0.75/0.70/0.65) | `overlapCorrection.ts` |
| 医院整体修正系数表 | 按医院类型查 | **按冷热源投产年份查**:<2010->1.1, 2010~2020->1.0, >2020->0.9 | `hospitalCorrection.ts` |
| 机电系统能耗权重表 | 按机电系统类型查(一维) | **三维**:能耗维度 × 作用系统 × 气候分区;综合节能率只用「全院区综合系统能耗」维度 | `energyWeight.ts` |
| 医院建筑能耗限额标准汇总表 | 按医院类型查 | **多维**:省份 × 医院等级 × 能源类型 × 指标类型;仅北京/天津有完整数据,其他省份无数据 | `energyQuota.ts` |

4 个假设全部和实际不符,§5.9.1-5.9.4 已基于实际结构重写。

**额外发现**(1.3 录入时):
- `techBoundaries.ts` 新增「适配度打分」表(12 技术 × 70 维度 × 210 条件 × 36 一票否决项),修正后节能率 = 基准节能率 × 适配度%
- `energyQuota.ts` 仅北京/天津有数据(6 行),其他 28 省份在 Excel 标注"无数据",1.6 接线时需处理无数据回退
- 计算验证:北京三甲 20000㎡ 综合节能率=31.0%(与 PM 审核文档 `docs/step2-综合节能率计算逻辑说明.md` 一致);12 技术评分推荐 7 项(与文档一致)
- 待 PM 确认:"高效空调制冷机房技术"评分矛盾 - Excel 评分=77.5(不推荐),文档=92.5(★★★);根因"系统自动化基础"维度 Excel 给"具备BAS"打 0 分,文档打 15 分

## 6. Phase 拆分

### Phase 1: 全链路接通 + 数据流贯通(预计 22-26 天)

**目标**:Step 1-5 全链路跑通真实数据,Step 3 -> Step 5 运维费贯通。

**子阶段工作量(纯工作日,含验证,不含 Session 间接力开销)**:

| 子阶段 | 任务 | 文件 | 工作量 |
|---|---|---|---|
| 1.0 | Step 1 表单字段核对 + 影响计算字段对齐 + 全链路数据流盘点(5.5/5.9.6) | `src/steps/step1-basic-info/components/SubStep*.tsx` + `data-flow-audit.md` | 1.5 天 |
| 1.1 | 技术卡片字段核对 | `src/data/materials.ts` 的 `techEntries` | 0.5 天 |
| 1.2 | 规范标准库基础部分补全 | `src/data/standards.ts`(被计算引用的国标,初步清单见下) | 0.5 天 |
| 1.3 | 模块2 的 6 个计算表录入 | `src/data/techBoundaries.ts` 等 6 个新文件 | 3 天 |
| 1.4 | 12 个设备表替换 + 设备分类库核对 + Schema 扩展 | `src/data/materials.ts` + `equipmentClassification.ts` + `projectStore.ts` | 2 天 |
| 1.5 | 模块4 的 2 个碳排放因子表录入 | `src/data/electricityCarbonFactor.ts` 等 | 0.5 天 |
| 1.6 | Step 2 综合节能率接通(含算法重构,见 5.9) | `src/steps/step2-solution/components/*` + `constants.ts` | 4 天 |
| 1.7 | Step 3 投资汇总验证 | - | 0.5 天 |
| 1.8 | Step 4 能耗/碳排放计算接通 | `src/steps/step4-energy/components/StepCalculation.tsx` + `helpers.ts` + `DataAnalysis.tsx` | 4.5 天 |
| 1.9 | Step 5 运维费 + 收入模型(5.6) + 能源费 + calcProfit 按年重构(5.6.2) + 总投资 fallback(5.8) | `src/steps/step5-decision/utils/financialCalculate.ts` + `index.tsx` + `projectStore.ts` | 4.5 天 |
| 1.10 | 全链路联调 + UI 微调 | - | 2.5 天 |

**小计**:24 天(纯工作日),加 Session 接力/意外问题排查缓冲,实际 22-26 天。

工作量修正说明(对抗审查第四/五轮):
- 1.0 从 1 天改 1.5 天:加"全链路数据流盘点"(5.5)+ "Step 2 综合节能率 Excel 结构确认"(5.9.6)
- 1.9 从 2 天改 4.5 天(第五轮再修正):5.6.2 要求 EMC 模式按年变化收入,`calcProfit`/`calcProjectCashflow`/`calcEquityCashflow` 三个函数签名都要改,IRR 现金流序列要重新对齐(1.5 天);加上运维费 derive(0.5 天)+ 收入模型 5 种模式分支(1 天)+ energyCost/annualEnergySaving derive(0.5 天)+ 总投资 fallback + dirty flag UI(1 天)+ 调 seed + 验证(0.5 天)
- 1.6 维持 4 天:5.9.5 重新拆解后算法重构 1 天 + 查表函数 1 天 + UI 改造 1 天 + 调 seed/验证 1 天
- 1.8 维持 4.5 天:不变

原估 1.6/1.8/1.9 涉及代码逻辑改动(查表 + 改公式 + 改 UI + 调 seed 不匹配),不是纯数据录入。1.10 联调加缓冲吸收前面 bug 积累。

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

**应对**:

**第一步:Excel 结构探测脚本**(0.5 天,1.0 开工时就能跑,因为 1.0 也要读 Excel)

脚本位置:`scripts/excel-structure-probe.py`

对每个 Excel 文件输出:
- sheet 名列表
- 每个 sheet 的列名(第 1 行)
- 每个 sheet 的前 3 行数据(识别数据类型)
- 每个 sheet 的总行数
- 特殊字符扫描(`£`/`R`/合并单元格标记等)
- 数据类型推断(数字/字符串/日期)

输出格式:Markdown 报告,写到 `docs/superpowers/progress/excel-structure-report.md`

**跨表一致性检查**(同脚本的一部分):

结构探测只看单表,还要检查跨表字段值一致性:
- 6 张计算表的"机电系统"字段值要一致(能耗权重表 / 医院整体修正系数表 / 技术组合重叠修正系数表)
- 12 个设备表的"技术名称"和 `techEntries` 的 techName 要一致
- 碳排放因子表的"省份"和 `energyPriceReferences` 的 location 要一致
- 12 个设备表的"运维分类"枚举值要统一(确认是"维保费用"/"运维人工费用",不是其他变体)

输出:跨表字段值差异表,写到同一份报告

**第二步:录 2-3 个技术验证**

基于探测报告,选 2-3 个结构典型的 Excel 录入,验证 schema 和录入脚本能跑通。

**第三步:批量录**

12 个设备表批量录入,跑验证脚本(行数/求和/关键字段非空率)。

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

**seed 字段分类清单**(1.8 开工前列,1.6/1.8/1.9 同步执行):

| 类别 | 字段 | 处理 |
|---|---|---|
| 输入(保留) | projectName/hospitalName/location/buildingType/hospitalLevel/hospitalScale/totalArea/normalBeds/icuBeds/operatingRooms | 保留 |
| 输入(保留) | mep.*(机电系统选择) | 保留 |
| 输入(保留) | energy.peakValleyDiff/valleyHours | 保留 |
| 输入(保留) | projectsStep2Data(选技术 ['1','3','4']) | 保留 |
| 输入(保留) | projectsStep3SelectedTechs | 保留 |
| 输入(保留) | Step 4 energyPrices/zoneConfigs/custodyYears/investmentMode | 保留 |
| 输入(保留) | Step 5 operatingPeriod/fundingRatio/depreciationYears/loanRate/residualRate/constructionMonths/repaymentPeriod 等配置项 | 保留 |
| 输入(保留) | Step 5 investmentMode(决定收入模型,见 5.6) | 保留 |
| 输入(保留) | Step 5 initialProfitShare*/changeProfitShare*/changeYear(EMC 分享比例) | 保留 |
| 输入(保留,按模式) | Step 5 custodialOperationFee(EMC-trust/BOT/PPP 模式保留;EMC/EMC-profit 置 0) | 按模式处理,见 5.6.5 |
| 输入(保留) | Step 5 adminCost(Step 3 没此分类,一直用户填) | 保留 |
| 计算(清理) | Step 4 savingEnergyRun/savingCostRun/originalEnergyRun/originalCostRun/itemSavingRate/comprehensiveRate | 置 null,由 1.8 真实逻辑算 |
| 计算(清理) | Step 5 avgOperatingIncome/avgNetProfit/staticPaybackPeriod/dynamicPaybackPeriod/totalInvestmentReturn | 置 null,由 1.9 真实逻辑算 |
| 计算(清理) | Step 5 repairCost/laborCost(原来 0) | 由 1.9 从 Step 3 自动读取(按 maintenanceCategory 拆分) |
| 计算(清理,第三轮补) | Step 5 maintenanceCost | 由 1.9 从 Step 3 读(`= repairCost + laborCost`,但 Step 5 财务计算实际拆分用 repairCost/laborCost,此字段保留仅用于展示) |
| 计算(清理,第三轮补) | Step 5 totalFixedInvestment/initialInvestment/installationCost | 由 1.9 从 Step 3 自动汇总(跨技术求和 fixedInvestment/initialInvestment/installationCost) |
| 计算(清理,第三轮补) | Step 5 energyCost | 由 1.9 从 Step 4 读(`= originalCostRun 求和 - savingCostRun 求和`,见 5.6.3) |
| 计算(清理,第三轮补) | Step 5 annualEnergySaving | 由 1.9 从 Step 4 读(`= savingCostRun 求和`,见 5.6.4) |

清理后 seed 只保留输入,所有计算结果实时算。用户打开 seed 项目,看到的数字都是真实计算结果,不是硬编。

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

### 8.7 跨 Session 进度丢失风险 + 未知风险应对

20-23 天的工作不可能一次 Session 完成。每个 Session 之间上下文丢失,不知道上次做到哪、做过什么决策。

**应对**:
- Phase 1.0 开工前建进度文件 `docs/superpowers/progress/phase-1-progress.md`
- 记录:每个子阶段的完成状态(pending/in_progress/done)、实际工作量、遇到的问题和决策、下次 Session 从哪接
- 每个 Session 开头先读这个文件,结尾更新它

**决策记录格式**(每个决策必填):
- 决策:做什么
- 理由:为什么这么定
- 备选方案:考虑过但没选的方案
- 影响:影响哪些子阶段

例:
- 决策:固定投资含运维费
- 理由:用户确认,业务上"固定投资"包含运维初始投入
- 备选:不含运维(被否,用户确认含)
- 影响:1.7 验证公式 / Step 5 财务计算

**未知风险应对**(每个子阶段开工前):
- 30 分钟代码探测:读相关代码,评估复杂度
- 如果复杂度超预期(比如发现隐藏依赖、代码比想象的大),在进度文件标注"工作量 +X 天",通知用户调整排期
- 不要硬扛,超时就报

### 8.8 字段命名约定

新建 10 个 TS 文件,字段命名需要统一:
- 中文字段名 -> 英文 camelCase(如"设备分类" -> `equipmentCategory`)
- 枚举值用英文 string,不用数字
- 主键统一用 `id: string`(UUID,便于未来数据库迁移)

**应对**:Phase 1.0 开工前先定一份《数据字段命名约定》补到本 spec 附录 A。

### 8.9 Supabase 旧数据迁移风险(对抗审查第三轮发现)

项目已上线 Supabase + Vercel(见 memory `supabase-mvp-deployment.md`)。Phase 1 改 schema(`DefaultRow` 加 4 个分类字段)、改 store(`onRehydrateStorage` 迁移)、改 seed(8.4 字段清理),会影响 Supabase 里现存的线上项目数据。

**受影响表**:
- `projects` - 项目元信息(不受 schema 改动影响,字段没变)
- `project_steps` - 各步骤数据 JSON(受影响,见下)

**`project_steps` 表的 JSON 字段影响**(对抗审查第四轮修正:Step 5 数据嵌在 `step4_data.decisionData`,不是独立 `step5_data` 字段):

| 步骤 | 字段路径 | 旧值 | 新值 | 影响 |
|---|---|---|---|---|
| Step 3 | `step3_data` JSON 的 `techInvestments[techId].maintenance[].costType` | `'repair' \| 'labor'` | `maintenanceCategory: '维保费用' \| '运维人工费用'` | Step 5 拆分逻辑查 `maintenanceCategory` 得到 undefined,运维费算 0 |
| Step 4 | `step4_data` JSON 的 `techs[techId].{savingEnergyRun/savingCostRun/originalEnergyRun/originalCostRun/itemSavingRate/comprehensiveRate}` | 硬编值 | 同字段名,但由 1.8 真实逻辑算 | 旧硬编值会覆盖真实计算,需清理为 null |
| Step 5 | `step4_data` JSON 的 `decisionData.{repairCost/laborCost/totalFixedInvestment/energyCost/annualEnergySaving/avgOperatingIncome/avgNetProfit/staticPaybackPeriod/dynamicPaybackPeriod/totalInvestmentReturn}` | 硬编值(`repairCost/laborCost = 0`) | 从 Step 3/4 自动汇总,或由 1.9 真实逻辑算 | 旧硬编值覆盖自动汇总,需清理为 null |

**关键**:Step 5 数据**不是独立 `step5_data` 字段**,而是嵌在 `step4_data.decisionData` 子路径(`projectStore.ts:120` 的 `Step4ProjectData.decisionData?: DecisionProjectData`)。Step 5 保存走 `saveProjectStep4Data(pid, { ...existing, decisionData: data })`(`step5-decision/index.tsx:55`)。

**迁移方案**(Phase 1.4 完成后,1.6/1.8/1.9 上线前执行):

```sql
-- 注意:project_steps 表是"一个 project 一行",所有步骤数据在同一行的不同字段
-- (step1_data / step2_* / step3_data / step4_data),没有 step 字段
-- WHERE 条件用字段非空判断,不用 step = N

-- 0. 迁移前验证(确认字段路径正确)
SELECT 
  jsonb_typeof(step3_data->'techInvestments') AS step3_ok,
  jsonb_typeof(step4_data->'techs') AS step4_ok,
  jsonb_typeof(step4_data->'decisionData') AS decision_data_ok
FROM project_steps LIMIT 5;
-- 期望:都返回 'object' 或 NULL(无数据的行),不能是 'string'/'array'

-- 1. Step 3: costType -> maintenanceCategory(加 maintenanceCategory 字段,保留 costType 不删)
UPDATE project_steps
SET step3_data = (
  SELECT jsonb_object_agg(
    tech_id,
    jsonb_set(
      tech_value,
      '{maintenance}',
      (
        SELECT jsonb_agg(
          CASE
            WHEN elem->>'maintenanceCategory' IS NOT NULL THEN elem
            WHEN elem->>'costType' = 'repair' THEN jsonb_set(elem, '{maintenanceCategory}', '"维保费用"', true)
            WHEN elem->>'costType' = 'labor' THEN jsonb_set(elem, '{maintenanceCategory}', '"运维人工费用"', true)
            ELSE elem
          END
        )
        FROM jsonb_array_elements(tech_value->'maintenance') AS elem
      ),
      true
    )
  )
  FROM jsonb_each(step3_data->'techInvestments') AS t(tech_id, tech_value)
)
WHERE step3_data->'techInvestments' IS NOT NULL;

-- 2. Step 4: 清理 techs 里的硬编计算字段为 null(用 || 合并置 null,不用 #- 删除)
--    理由:删除字段后 JS 读 t.savingCostRun 得到 undefined,数值计算 NaN;
--    置 null 后 JS 读到 null,null/number = 0,不崩。代码层仍要加 ?? 0 兜底。
UPDATE project_steps
SET step4_data = jsonb_set(
  step4_data,
  '{techs}',
  (
    SELECT jsonb_object_agg(
      tech_id,
      tech_value
        || jsonb_build_object(
          'savingEnergyRun', 'null'::jsonb,
          'savingCostRun', 'null'::jsonb,
          'originalEnergyRun', 'null'::jsonb,
          'originalCostRun', 'null'::jsonb,
          'itemSavingRate', 'null'::jsonb,
          'comprehensiveRate', 'null'::jsonb
        )
    )
    FROM jsonb_each(step4_data->'techs') AS t(tech_id, tech_value)
  ),
  true
)
WHERE step4_data->'techs' IS NOT NULL;

-- 3. Step 5(嵌在 step4_data.decisionData,不是独立 step5_data 字段):
--    清理 decisionData 里的硬编计算字段为 null(用 || 合并置 null)
UPDATE project_steps
SET step4_data = jsonb_set(
  step4_data,
  '{decisionData}',
  (step4_data->'decisionData')
    || jsonb_build_object(
      'avgOperatingIncome', 'null'::jsonb,
      'avgNetProfit', 'null'::jsonb,
      'staticPaybackPeriod', 'null'::jsonb,
      'dynamicPaybackPeriod', 'null'::jsonb,
      'totalInvestmentReturn', 'null'::jsonb,
      'repairCost', 'null'::jsonb,
      'laborCost', 'null'::jsonb,
      'totalFixedInvestment', 'null'::jsonb,
      'energyCost', 'null'::jsonb,
      'annualEnergySaving', 'null'::jsonb
    ),
  true
)
WHERE step4_data->'decisionData' IS NOT NULL;
-- 注意:Step 4 数据通过 upsertProjectSteps 保存,Step 5 数据嵌在 step4_data.decisionData
-- Step 4 计算字段(savingCostRun 等)和 Step 5 字段(decisionData.*)在同一行 step4_data JSON 里
```

**代码层兜底**(1.8/1.9 同步加):
- `financialCalculate.ts` 读 `data.repairCost`/`data.laborCost`/`data.energyCost` 等字段时加 `?? 0` 兜底,防止 null/undefined 进入数值计算
- `deriveStep5MaintenanceFromStep3`/`deriveStep5EnergyCostFromStep4`/`deriveStep5IncomeFromStep4` 返回值保证是 number(用 `|| 0` 兜底)

**回滚策略**:
- 迁移前先备份:`pg_dump project_steps > backup-$(date +%Y%m%d).sql`
- 迁移失败回滚:`psql < backup-YYYYMMDD.sql`
- Supabase 项目设置里开启 Point-in-Time Recovery(如未开启),可恢复到迁移前时间点

**执行时机**:
- 1.4 schema 扩展后立即迁移 Step 3(因 1.6+ 都依赖 maintenanceCategory)
- 1.6/1.8/1.9 改计算逻辑前迁移对应 Step 4 计算字段 + Step 5 decisionData 字段
- 迁移在 Supabase Studio 跑 SQL,记录执行时间到 `docs/superpowers/progress/supabase-migration.md`

**风险与降级**:
- 如果 Supabase 里有测试项目数据(开发自建),迁移前可手动删除,不跑迁移
- 如果有真实用户数据,迁移前必须备份 + 在 staging 环境先跑一遍
- 迁移后让用户重新打开旧项目,确认 Step 5 运维费能从 Step 3 算出来(非 0)
- **SQL 语法验证**:迁移前先在 Supabase Studio 跑 `SELECT jsonb_typeof(step4_data->'decisionData') FROM project_steps LIMIT 5;` 确认 decisionData 是 object 类型,避免路径写错

**Phase 1.0 前置任务**:
- 检查 Supabase 当前有无线上用户数据(`SELECT COUNT(*) FROM project_steps WHERE step IN (3, 4, 5)`)
- 如果有真实数据,把"Supabase 迁移"作为 Phase 1.4 完成的验收条件之一
- 如果只有开发测试数据,直接清空 + 重新建项目即可,不跑迁移 SQL

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
   - 验证:用 Excel 表的输入项(单项节能率/权重/修正系数)代入代码计算,结果和 Excel 表的输出列(如有"综合节能率"输出列)一致(±0.5%);若 Excel 没有输出列,只验证"行数 + 关键字段非空率 + 求和自洽",不验证计算正确性(在进度文件标注"计算正确性未验证")

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
   - 测试:Step 5 表单运维费字段可编辑(用户可微调),dirty flag 标识手改后不自动覆盖
   - 测试:改 Step 3 运维表数据,Step 5 运维费提示"Step 3 已更新",用户点"重新计算"才覆盖

10. **Step 5 N 年运维费计算**
    - 测试:10 年运维费 = (repairCost + laborCost + adminCost) × 10
    - 测试:换不同运维期(5/8/10/15/20 年),运维费按比例变化

11. **Step 5 收入按 investmentMode 分**(对抗审查第三轮新增)
    - 测试:investmentMode = 'EMC',Step 5 年收入 = `annualEnergySaving × initialProfitShare2 / 100`(第 1~changeYear 年),第 changeYear+1 年起用 `changeProfitShare2`
    - 测试:investmentMode = 'EMC-trust',Step 5 年收入 = `custodialOperationFee`(用户填,不从 Step 4 读)
    - 测试:investmentMode = 'EMC-guarantee',Step 5 年收入 = `custodialOperationFee + annualEnergySaving × profitShare`
    - 测试:investmentMode = ''(未选),Step 5 报错提示"请先选投资模式",不算财务指标

12. **Step 5 能源费从 Step 4 自动读取**(对抗审查第三轮新增)
    - 测试:Step 5 `energyCost` = Step 4 所有技术 `originalCostRun` 求和 - `savingCostRun` 求和
    - 测试:Step 5 表单 energyCost 字段可编辑,dirty flag 标识手改

13. **Step 5 年节能金额从 Step 4 自动读取**(对抗审查第三轮新增)
    - 测试:Step 5 `annualEnergySaving` = Step 4 所有技术 `savingCostRun` 求和
    - 测试:Step 5 表单 annualEnergySaving 字段可编辑,dirty flag 标识手改

14. **Step 5 总投资含运维费**(对抗审查第三轮新增)
    - 测试:Step 5 `totalFixedInvestment` = Step 3 所有技术 `fixedInvestment` 求和(含运维)
    - 测试:fallback 路径(`totalFixedInvestment` 为 0)也算 `initialInvestment + installationCost + maintenanceCost`,不含漏运维

15. **全链路贯通**
    - 测试:Step 1 填项目信息 -> Step 2 选 3 个技术 -> Step 3 真实投资 -> Step 4 真实能耗/碳排放 -> Step 5 真实财务指标
    - 验证:整个链路无 seed 硬编计算结果(项目信息等输入项除外),所有数字可追溯到 `src/data/*.ts`

16. **Supabase 旧项目数据迁移**(对抗审查第三轮新增)
    - 测试:迁移前 Supabase 里有 Step 3 旧数据(含 `costType`),迁移后 `maintenanceCategory` 字段填上正确值
    - 测试:迁移后旧项目打开,Step 5 运维费能从 Step 3 算出来(非 0)
    - 测试:迁移前备份 `pg_dump`,迁移失败能用备份回滚

### Phase 2 验收(参考库补全)

17. **侧边栏三个库内容饱满**
    - 测试:规范标准库显示全量国/地/行标(非 3 条占位)
    - 测试:政策绿融库按省查到真实政策 + 补贴
    - 测试:能源价格表按省查到真实峰平谷电价/气价/水价

### Phase 3 验收(报告)

18. **Step 5 报告章节对齐**
    - 测试:ReportView 章节结构和 `【模板】投资策略报告.docx` 一致

## 附录 A: 数据字段命名约定

### A.1 主键
- 统一 `id: string`(UUID,`crypto.randomUUID()` 生成)
- 不用数字自增(便于未来数据库迁移)

### A.2 字段名
- 中文 -> 英文 camelCase(如"设备分类" -> `equipmentCategory`)
- 已有字段不改名,只新增字段遵循本约定

### A.3 枚举值
- 用**中文 string**,不翻译成英文
- 理由:业务术语翻译会丢语义,业务方看代码看不懂;运维分类"维保费用"翻成 'repair' 会和旧 `costType` 混淆
- 示例:
  - `maintenanceCategory: '维保费用' | '运维人工费用'`
  - `equipmentCategory: '冷源设备' | '热源设备' | ...`(具体值 Phase 1.4 探测 Excel 后定)
  - `fuelType: '天然气' | '无烟煤' | '烟煤' | '柴油' | '汽油' | '液化石油气'`

### A.4 单位
- 沿用 CLAUDE.md 数据展示规范:用电 kWh/年、用气 m³/年、用水 吨/年、碳排放 tCO₂/年、费用 万元/年、面积 ㎡
- 数据文件里的数值不带单位,单位在字段名或注释里说明
- 示例:`unitPrice: 350000`(元),注释 `// 单位:元`

### A.5 审计列(预留)
- `_meta?: { version?: number; updatedBy?: string; updatedAt?: string }`
- Phase 1-3 不填,Phase 4 迁移 Supabase 时补
- 不用 `is_system`(用户数据/预置数据的区分在 Phase 5 中台时再加)

### A.6 文件头
每个新建 TS 文件必须有文件头:
```ts
/**
 * 数据来源: 模块2/机电系统能耗权重表.xlsx
 * 录入时间: 2026-07-11
 * Excel hash: <sha1>  // 锁定版本,见 excel-version-lock.md
 * 数据年份: 2023 年(如适用,如碳排放因子)
 */
```

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
