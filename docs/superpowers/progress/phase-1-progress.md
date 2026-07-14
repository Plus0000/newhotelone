# Phase 1 进度跟踪

> 每个 Session 开头先读本文件,结尾更新它。决策记录格式见 spec §8.7。

## 当前状态
- 进行中: 无
- 已完成: 1.0, 1.1, 1.2, 1.3, 1.5, 1.7, 部分 1.4

## 子阶段状态
| 子阶段 | 状态 | 计划工作量 | 实际工作量 | 备注 |
|---|---|---|---|---|
| 1.0 | done | 1.5 天 | 1 天 | 前置准备,发现 spec §5.6.3/5.6.4/5.9.6 语义错误 |
| 1.1 | done | 0.5 天 | - | 技术卡片字段核对 (commit a804f64) |
| 1.2 | done | 0.5 天 | - | 规范标准库 160 条录入 + 4 bug 修复 + 21 处差异修正 |
| 1.3 | done | 3 天 | - | 模块2 计算表录入 6 个 TS 文件 (commit d554330) |
| 1.4 | partial | 2 天 | - | 设备表替换 + Schema 扩展 (commit 0351cc1, 814行) |
| 1.5 | done | 0.5 天 | - | 碳排放因子录入（32 省 + 5 化石能源，查表函数 + helpers/ReportView 接通） |
| 1.6 | pending | 4 天 | - | Step 2 综合节能率接通(需先修 spec §5.9.6) |
| 1.7 | done | 0.5 天 | - | Step 3 投资汇总验证（代码逻辑通过，修复 techId=2 运维表 4 行录入错误） |
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
- 2026-07-13: Phase 1.5 碳排放因子查表（不破坏向后兼容）
  - 理由: 单一常量 5.81 不准，Excel 有 32 省级电网因子；保留旧常量作 fallback 便于回退和未传 province 的旧调用
  - 改动: 新增 electricityCarbonFactor.ts（32 省 + 新疆兵团）+ fossilCarbonFactor.ts（5 化石能源）；helpers.ts calcCarbonSaving/calcRemainingCarbon 加可选 province 参数；ReportView.tsx 改用 getElectricityCarbonFactor(step1Data.location[0])
  - 单位换算: Excel tCO₂/MWh × 10 = tCO₂/万kWh（与现有 COAL_FACTOR 单位一致）
  - 未做: GAS_CARBON_FACTOR 在代码中未被引用（Step 4 暂无天然气碳排计算），仅作 fallback 保留
- 2026-07-13: ReportView 4.3.2 表单位错配修复（对抗审查发现）
  - 理由: L189 `annualSaving = originalCostRun - savingCostRun` 是费用（万元），但 L191 `coal = annualSaving × COAL_FACTOR` 把它当能耗（万kWh）用，导致 L597 标煤量、L770 年节碳量、L778 年节电量三处数值全错
  - 修复: 新增 `annualEnergySaving = originalEnergyRun - savingEnergyRun`（万kWh），`coal` 改用它计算；L778 改显 `annualEnergySaving`；`annualSaving`（万元）保留给回收期/面积收益/运维占比等费用类计算
  - 影响: 4.3.2 表"年节电量"和"年节碳量"两列数值会变（之前是费用×因子的错值，现在是真实电量×因子）；4.1.1 标煤量表和"万元投资节能量"列也同步修正；合计行原本就用 energy 字段，不受影响
- 2026-07-13: Phase 1.7 Step 3 投资汇总验证 + techId=2 运维表录入错误修复
  - 验证: 代码逻辑（calcFixedFromAll/calcInitialFromAll/calcMaintenanceFromAll/projectTotals）全部通过 spec 1230-1232 验收标准 1 和 2，无需改代码
  - 数据修复: techId=2 运维表 4 行 Excel "数量"列是错误值（46025/46024/46027/不限），1.4 录入按 `quantity × unitPrice` 算 subtotal 导致 55 万倍偏差（运维费 552325 万 vs 应为 39 万）
  - 修复方法: 用 Excel "年度总价"列值重设 quantity=1, unitPrice=年度总价（万元），subtotal = 年度总价；4 行（故障响应/传感器电池/软件大版本/易损件）修复后 techId=2 运维费 = 39 万 ✓，固定投资 = 802.21 万
  - 教训: 录入时只算 `quantity × unitPrice` 没交叉验证"年度总价"列；Excel 原始数据"数量"列有错误值，"年度总价"列是对的；后续录入需加"年度总价 vs subtotal"一致性检查
  - 验证报告: `docs/superpowers/progress/step3-summary-verification.md`
- 2026-07-14: Phase 1.3 模块2 计算表录入完成
  - 6 个 TS 文件: overlapCorrection / hospitalCorrection / energyConversion / techBoundaries / energyWeight / energyQuota
  - 数据验证: 11 个技术权重合计=1.0(洁净区域=0.9 符合 Excel 原文)；能耗权重每个气候分区 sum=1.0；energyQuota 6 数据行 + 79 备注行(其他省份"无数据")
  - 计算验证: 北京三甲 20000㎡ 综合节能率=31.0%(与 docs/step2-综合节能率计算逻辑说明.md 一致)；12 技术评分推荐 7 项(与文档一致)
  - 待 PM 确认: "高效空调制冷机房技术"评分矛盾 - Excel 评分=77.5(不推荐),文档=92.5(★★★)；根因 "系统自动化基础"维度 Excel 给"具备BAS"打 0 分(基础好=改进空间小),文档打 15 分
  - 提交: commit d554330

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
