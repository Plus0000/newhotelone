# Phase 1 进度跟踪

> 每个 Session 开头先读本文件,结尾更新它。决策记录格式见 spec §8.7。

## 当前状态
- 进行中: 1.1(下一步)
- 已完成: 1.0

## 子阶段状态
| 子阶段 | 状态 | 计划工作量 | 实际工作量 | 备注 |
|---|---|---|---|---|
| 1.0 | done | 1.5 天 | 1 天 | 前置准备,发现 spec §5.6.3/5.6.4/5.9.6 语义错误 |
| 1.1 | pending | 0.5 天 | - | 技术卡片字段核对 |
| 1.2 | pending | 0.5 天 | - | 规范标准库基础部分 |
| 1.3 | pending | 3 天 | - | 模块2 计算表录入 |
| 1.4 | pending | 2 天 | - | 设备表替换 + Schema 扩展 |
| 1.5 | pending | 0.5 天 | - | 碳排放因子录入 |
| 1.6 | pending | 4 天 | - | Step 2 综合节能率接通(需先修 spec §5.9.6) |
| 1.7 | pending | 0.5 天 | - | Step 3 投资汇总验证 |
| 1.8 | pending | 4.5 天 | - | Step 4 能耗/碳排放接通 |
| 1.9 | pending | 4.5 天 | - | Step 5 数据流贯通(需先修 spec §5.6) |
| 1.10 | pending | 2.5 天 | - | 全链路联调 + UI 微调(seed mep 重写在此) |

## 决策记录
- 2026-07-11: 固定投资含运维费(用户确认)
  - 理由: 业务上"固定投资"包含运维初始投入
  - 备选: 不含运维(被否,用户确认含)
  - 影响: 1.7 验证公式 / Step 5 财务计算
- 2026-07-11: seed mep 结构重写延到 1.10(Task 8 决策)
  - 理由: spec §2.3 规定"不影响计算的字段 1.10 改",Step 2/4 不读 step1Data,mep 不影响计算
  - 副作用: 打开 seed 项目时 Step 1 SubStep4MEP 表单显示空(UI bug)
  - 1.10 修复: 重写 seed mep.hvac.* 结构 + 同步改 ReportView.tsx L337-338

## 遇到的问题(1.0 阶段发现)

### spec 与代码/Excel 的差异(1.6/1.9 开工前必须修 spec)

1. **spec §5.6.3 公式错**:`energyCost = originalCost - savingCost` 算的是节能金额,不是"节能后实际能源费"(注释错)。代码当前 `totalEnergyCost = savingCostRun` 语义正确。
2. **spec §5.6.4 公式错**:`annualEnergySaving = savingCostRun` 把"节能后能源费"当"节能金额"。代码当前 `totalAnnualSaving = originalCostRun - savingCostRun` 语义正确。
3. **spec §5.9.6 假设错**:4 个 Excel 表的实际结构和 spec 假设完全不同:
   - 重叠修正系数:一维表(数量->系数),非二维矩阵
   - 医院整体修正:按冷热源投产年份查,非医院类型
   - 能耗权重:三维(能耗维度×作用系统×气候分区),非技术ID
   - 能耗限额:多维(省份×等级×能源类型),非单一
4. **spec §5.4 枚举值**:用 `maintenanceCategory === '维保费用'`,Excel 实际是 `设备维保费用`(6 类枚举,非 2 类)

### memory 过时

- `supabase-mvp-deployment.md` 记 profiles 表有 `display_name`,实际是 `username`
- 1.4 阶段需确认 authStore.ts 读的字段名

### 数据流断点(已盘点,见 data-flow-audit.md)

- Step 2 -> Step 3: **设计性断点**(Step 3 独立选择,不继承 Step 2,符合产品逻辑)
- Step 3 -> Step 4: **已通**(equipment.powerKw/quantity/name 同步到 savingEquipments)
- Step 3 -> Step 5: **部分通**(用 costType 2 类拆分,spec 要求 maintenanceCategory 6 类,1.9 改)
- Step 4 -> Step 5: **已通**(代码语义正确,spec §5.6.3/5.6.4 公式错需先修)

## 下次 Session 接力点

### 1.1 阶段(技术卡片字段核对)开工前必读

1. `docs/superpowers/progress/excel-version-lock.md` - 33 个 Excel 的 sha1 锁
2. `docs/superpowers/progress/excel-structure-report.md` - 28 个 Excel 的结构探测
3. `docs/superpowers/progress/step1-field-diff.md` - Step 1 字段差异 + 1.10 待办(seed mep 重写)
4. `docs/superpowers/progress/data-flow-audit.md` - 4 条数据流断点 + Step 2 综合节能率 Excel 结构 + Supabase 现状

### 1.1 阶段任务

- 核对 `techEntries` 的 techId 和 `techDefaultInvestments` 的 techId 完全一致
- 核对 12 个设备表的"技术名称"和 techEntries 的 techName 一致
- 输出到 `docs/superpowers/progress/step2-tech-card-diff.md`

### 1.4 阶段注意事项(提前知会)

- `InvestmentRow` 加 `maintenanceCategory?: string`(枚举值用 Excel 的 6 类精确字符串)
- `costType` 字段保留(向后兼容,无线上数据需迁移)
- Supabase 0 条项目数据,无需迁移 SQL
- profiles 表字段名确认(`username` 非 `display_name`)

### 1.6 阶段开工前(必须先修 spec §5.9.6)

- 修 spec §5.9.6 的算法描述(基于实际 Excel 结构,非假设)
- 定组间求积/求和规则
- 定医院整体修正系数乘在哪个层级

### 1.9 阶段开工前(必须先修 spec §5.6)

- 修 spec §5.6.3:`energyCost = sum(savingCostRun)`
- 修 spec §5.6.4:`annualEnergySaving = sum(originalCostRun - savingCostRun)`
- 修 spec §5.4:`maintenanceCategory` 枚举值用 Excel 6 类

## 1.0 阶段产出清单

| 文件 | 用途 | 状态 |
|---|---|---|
| `docs/superpowers/progress/phase-1-progress.md` | 本文件,进度跟踪 | ✅ |
| `docs/superpowers/specs/excel-version-lock.md` | 33 个 Excel sha1 锁 | ✅ |
| `scripts/excel-structure-probe.py` | Excel 结构探测脚本 | ✅ |
| `docs/superpowers/progress/excel-structure-report.md` | 28 个 Excel 结构报告 | ✅ |
| `docs/superpowers/progress/step1-field-diff.md` | Step 1 字段差异报告 | ✅ |
| `docs/superpowers/progress/data-flow-audit.md` | 数据流盘点 + Step 2 Excel + Supabase | ✅ |

## 1.0 阶段代码改动

| 文件 | 改动 | commit |
|---|---|---|
| `src/data/seedProject.ts` | `energy` -> `energyPeakValley` + 加 `address` | 28ff398 |
| `.gitignore` | 移除 `scripts/` 行(允许 Python 工具脚本入库) | bd45d27 |
