# Step 1 表单字段差异报告

> 对比基准: `/Users/plus0/Desktop/技术交底-20260701/模块1：建筑基本信息/医院建筑基本信息表.xlsx`(主 sheet「医院建筑基本信息表」)
> 代码位置: `src/steps/step1-basic-info/components/SubStep*.tsx` + `src/shared/stores/projectStore.ts` 的 `Step1Data`(开放 interface) + `src/data/seedProject.ts` 的 `getSeedStep1Data()`
> 生成时间: 2026-07-11(Phase 1.0)

## 概览

Excel 主表 47 个字段(B4-B72),分 5 页:
- 第 1 页(填写人): B4-B8(5 字段)
- 第 2 页(客户): B10-B16(7 字段)
- 第 3 页(医院): B18-B28(11 字段)
- 第 4 页(机电系统,6 个 tab): B29-B66(38 字段)
- 第 5 页(市政能源): B69-B72(4 字段)

代码 5 个 SubStep 组件 + seed 对应。`Step1Data` 是开放 interface(`[key: string]: unknown`),字段实际由 seed + Form.Item name 定义。

## 影响计算字段清单

以下字段的差异会影响 Step 2/3/4/5 计算,必须当场改代码/seed 对齐(spec §2.3):

| 字段 | 用途 | 影响哪个 Step |
|---|---|---|
| hospitalType | 医院类型,查能耗限额/医院整体修正 | Step 2/4 |
| buildingType | 建筑类型 | Step 2/4 |
| hospitalScale | 医院规模 | Step 2/4 |
| hospitalLevel | 医院等级 | Step 2/4 |
| normalBeds/icuBeds/operatingRooms | 床位/手术室数 | Step 2/4 |
| totalArea/aboveGroundArea/cleanArea | 面积 | Step 2/4 |
| location | 所在地,查碳排放因子/能源价格 | Step 4 |
| mep.hvac.* | 机电系统选择,查能耗权重 | Step 4 |
| mep.lighting* / mep.annualPower | 照明 + 年用电量 | Step 4 |
| energyPeakValley.peakValleyDiff/valleyHours | 峰谷差/谷电时长 | Step 4 |

## 1. 字段名不一致

| Excel 字段名 | 代码字段名(Form.Item name) | seed 字段名 | SubStep | 处理 |
|---|---|---|---|---|
| 项目地点(省/市/区) | `location` (string[]) | `location` ✓ | SubStep3 | seed 和代码一致,但 Excel 还有"具体地址"字段,代码有 `address` 但 seed 没填 |
| 建筑规模(总/地上/洁净面积) | `totalArea`/`aboveGroundArea`/`cleanArea` | ✓ 一致 | SubStep3 | 无差异 |
| 医疗规模(床位/手术室) | `normalBeds`/`icuBeds`/`operatingRooms` | ✓ 一致 | SubStep3 | 无差异 |
| 峰谷电政策(峰谷差/谷电时长) | `energyPeakValley.peakValleyDiff`/`energyPeakValley.valleyHours` | `energy.peakValleyDiff`/`energy.valleyHours` ❌ | SubStep5 | **seed 改为 `energyPeakValley.*`,对齐代码** |

## 2. 选项值不一致

| 字段 | Excel 选项 | 代码选项 | SubStep | 处理 |
|---|---|---|---|---|
| hospitalLevel | 甲等/乙等/丙等/特等 | (待 Task 8 读 SubStep3 确认) | SubStep3 | Task 8 核对 |
| hospitalScale | 三级/二级/一级 | (待 Task 8 确认) | SubStep3 | Task 8 核对 |
| hospitalType | 综合医院/专科医院/中医/民族/康复/疗养院/综合门诊部/急救中心/医学检验/社区 | (待 Task 8 确认) | SubStep3 | Task 8 核对 |
| hospitalNature | 公立/民营/军队/企业/外资/合资 | (待 Task 8 确认) | SubStep3 | Task 8 核对 |
| projectStage | 售前-商机挖掘/售前-方案概算/售前-图纸深化/招投标/签约/实施 | (待 Task 8 确认) | SubStep3 | Task 8 核对 |
| projectProperty | 新建/改造/扩建/运营/其他 | (待 Task 8 确认) | SubStep3 | Task 8 核对 |
| buildingType | 16 种建筑类型(办公/医疗/教育/商业/文化/体育/科研/通信/交通/民政/住宅/工业/能源站/区域/其他) | (待 Task 8 确认) | SubStep3 | Task 8 核对 |

> **注**: Task 7 只 grep 了 Form.Item name,没读 options。Task 8 改字段时需要逐个 SubStep 读 options 数组核对。这里先标注"待 Task 8 确认"。

## 3. 代码缺字段(Excel 有,代码没有)

| Excel 字段 | 用途 | SubStep | 是否影响计算 | 处理 |
|---|---|---|---|---|
| 业务部门负责人是否审核 | 审核标记 | SubStep1 | 否(管理用) | 1.10 补 |
| 渠道方单位名称 | 渠道信息 | SubStep2 | 否 | 1.10 补(代码已有 `channelName`,但 seed 填"无") |
| 渠道方是否能直接对接客户 | 渠道信息 | SubStep2 | 否 | 1.10 补(代码已有 `channelDirect`) |
| 具体地址 | 项目地址补充 | SubStep3 | 否 | 1.10 补(代码已有 `address`,seed 没填) |
| 冷凝热回收(冷源/热源/洁净区各一个) | 机电系统细节 | SubStep4 | 间接(影响技术适配) | 代码已有 `mep.hvac.coldSourceMeta.*.heatRecovery` 等,seed 没填,Task 8 补 seed |
| 冷却塔供冷(冷源) | 机电系统细节 | SubStep4 | 间接 | 代码已有 `mep.hvac.coldSourceMeta.*.coolingTower`,seed 没填 |
| 蒸汽系统(集中/分散/区域 + 蒸汽锅炉投产年份 + 供汽范围 + 冷凝水回收) | 机电系统 | SubStep4 | 间接 | 代码有 `mep.hvac.steam*`,seed 没有,Task 8 补 seed |
| 洁净区冷热源系统 | 机电系统 | SubStep4 | 间接 | 代码有 `mep.hvac.cleanZone*`,seed 没有,Task 8 补 seed |
| 蒸汽冷凝水管路分区 | 机电系统 | SubStep4 | 间接 | 代码有 `mep.hvac.steamCondensatePartition`,seed 没有,Task 8 补 seed |
| 冷热源系统管理水平 | 机电系统 | SubStep4 | 间接(影响智能群控适配) | 代码有 `mep.hvac.hvacMgmtLevel`,seed 没有,Task 8 补 seed |
| 年用电量 | 用电规模 | SubStep4 | **是**(影响节能率计算) | 代码有 `mep.annualPower`,seed 有(`'300~1000万'`)✓ |

## 4. Excel 缺字段(代码有,Excel 没有)

| 代码字段 | 用途 | SubStep | 处理 |
|---|---|---|---|
| (无) | - | - | 代码字段都来自 Excel,无 Excel 缺失字段 |

## 5. seed 与代码结构不一致(重大,必须 Task 8 修)

**问题**: seed `getSeedStep1Data()` 的 `mep` 结构是老版本,代码 SubStep4MEP 已重构为 `mep.hvac.*` 命名空间,两者不匹配。

### 5.1 mep.coldSource vs mep.hvac.coldSourceCentralized/Decentralized/Regional

| seed(老) | 代码(新,和 Excel 对齐) | Excel 字段 |
|---|---|---|
| `mep.coldSource: ['离心式冷水机组']` | `mep.hvac.coldSourceCentralized` / `coldSourceDecentralized` / `coldSourceRegional` | B30 冷源系统类型(集中式/分散式/区域性) |
| `mep.heatSource: ['燃气锅炉']` | `mep.hvac.heatSourceCentralized` / `heatSourceDecentralized` / `heatSourceRegional` | B31 热源系统类型 |
| (无) | `mep.hvac.steamCentralizedTypes` / `steamDecentralized` / `steamRegional` + `steamCentralizedMeta.*` | B32 蒸汽系统类型 |
| (无) | `mep.hvac.cleanZoneType` / `cleanZoneYear` / `cleanZoneVfd` / `cleanZoneHeatRecovery` | B33 洁净区冷热源系统 |
| `mep.waterPartition: '已分区'` | `mep.hvac.waterPartition` | B34 空调水管路分区情况 |
| (无) | `mep.hvac.steamCondensatePartition` | B35 蒸汽冷凝水管路分区情况 |
| (无) | `mep.hvac.hvacMgmtLevel` | B36 冷热源系统管理水平 |

**处理**: Task 8 重写 seed 的 `mep` 部分,对齐代码结构(也就是 Excel 结构)。

### 5.2 mep.coldSourceMeta(冷源细节,代码有,seed 没有)

代码有 `mep.hvac.coldSourceMeta[record.name] = { year, vfd, heatRecovery, coolingTower }`,seed 没有。

**处理**: Task 8 补 seed 的 `mep.hvac.coldSourceMeta`,至少给 `离心式冷水机组` 和 `风冷热泵` 两个冷源填元数据(Excel C30 有投产年份/变频/冷凝热回收/冷却塔供冷)。

### 5.3 mep.heatSourceMeta(热源细节,代码有,seed 没有)

代码有 `mep.hvac.heatSourceMeta[o] = { year }`,seed 没有。

**处理**: Task 8 补 seed 的 `mep.hvac.heatSourceMeta`,给 `燃气热水锅炉` 填年份(Excel C31 有 2015)。

### 5.4 energyPeakValley vs energy

| seed(老) | 代码(新) | Excel 字段 |
|---|---|---|
| `energy: { peakValleyDiff: 0.8, valleyHours: 8 }` | `energyPeakValley: { peakValleyDiff, valleyHours }` | B69 峰谷电政策(系统自动关联) |

**处理**: Task 8 改 seed 的 `energy` 为 `energyPeakValley`,对齐代码。

## 影响计算字段对齐计划(Task 8)

> **Task 8 完成情况(2026-07-11)**:
> - ✅ SubStep3 选项值核对: 所有 10 个 constants 数组与 Excel 完全一致,无需改动
> - ✅ seed `energy` -> `energyPeakValley`: 字段名对齐代码(SubStep5Policy.tsx)
> - ✅ seed 补 `address` 字段: 对齐 Excel "具体地址" + 代码 Form.Item
> - ⏸️ seed `mep` 结构重写: **延到 1.10**(见下文"1.10 待处理"说明)
> - ⏸️ ReportView.tsx L337-338 读老 mep 结构: **延到 1.10**(与 seed mep 重写一起改)

### 关键发现: Step 2/4 不读 step1Data

grep `step1Data` 在 step2-solution/ 和 step4-energy/ 下 **零命中**。只有 step5-decision/report/ReportView.tsx 读 step1Data 用于显示。

**含义**: Step 1 字段对 Step 2/4 计算 **无影响**。"影响计算字段对齐"对 Step 1 而言实际上是 no-op。Step 5 ReportView 读 mep.coldSource/heatSource 仅用于报告展示。

### SubStep3 选项值核对结果(已验证)

| 字段 | Excel 选项数 | 代码 constants | 一致性 |
|---|---|---|---|
| hospitalType | 10 | HOSPITAL_TYPES(10) | ✅ 一致 |
| hospitalNature | 6 | HOSPITAL_NATURES(6) | ✅ 一致 |
| hospitalLevel | 4 | HOSPITAL_LEVELS(4) | ✅ 一致 |
| hospitalScale | 3 | HOSPITAL_SCALES(3) | ✅ 一致 |
| projectStage | 6 | PROJECT_STAGES(6) | ✅ 一致 |
| projectProperty | 5 | PROJECT_PROPERTIES(5) | ✅ 一致 |
| buildingType | 15 | BUILDING_TYPES(15) | ✅ 一致 |
| unitNature | 8 | UNIT_NATURES(8) | ✅ 一致 |
| contactLevel | 7 | CONTACT_LEVELS(7) | ✅ 一致 |
| projectSource | 4 | PROJECT_SOURCES(4) | ✅ 一致 |

**结论**: SubStep3 无需改动,所有选项值已与 Excel 对齐。

## 1.10 待处理(不影响计算,UI/文案差异)

- **seed `mep` 结构重写**(大): seed 用老结构 `mep.coldSource/heatSource`,代码 SubStep4MEP 已重构为 `mep.hvac.coldSourceCentralized/Decentralized/Regional` + `coldSourceMeta` + `heatSourceMeta` + `steamCentralizedTypes/Meta` + `cleanZoneType/Year/Vfd/HeatRecovery` + `waterPartition` + `steamCondensatePartition` + `hvacMgmtLevel`。导致打开 seed 项目时 Step 1 SubStep4MEP 表单显示空。1.10 需重写 seed mep 对齐代码结构,详见上文 §5.1-5.4。
- **ReportView.tsx L337-338 适配新 mep 结构**: 当前读 `mep.coldSource`/`mep.heatSource`(老结构),seed mep 重写后需同步改为读 `mep.hvac.coldSourceCentralized/Decentralized/Regional` + `heatSourceCentralized/Decentralized/Regional`。
- SubStep1 补"业务部门负责人是否审核"字段(管理用,不影响计算)
- UI 文案差异(如 Excel 用"R是 £否",代码用 Radio"是/否")- 这是 Excel 的标记符号,不需要对齐
- 字段顺序差异(Excel 的字段顺序和代码 Form.Item 顺序可能不同)- 不影响功能,1.10 视情况调整

## 验证(Task 8 完成后)

- `npm run lint` 通过
- `npm run build` 通过
- `npm run dev` 打开 seed 项目,Step 1 五个子步骤表单显示正常,默认值正确
- Step 2/4 读 Step 1 字段(如 hospitalType/location/mep.*)不报 undefined
