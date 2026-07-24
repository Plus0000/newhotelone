import { getTechBoundary, type BoundaryCondition } from '@/data/techBoundaries';
import { energyPriceReferences } from '@/data/materials';
import { getEnergyPriceInfo } from '@/data/policies';

export interface DimensionScoreDetail {
  dimension: string;
  weight: number;
  score: number;
  matchedCondition: string;
  isVeto: boolean;
}

export interface TechScoreResult {
  techName: string;
  score: number;
  isVetoed: boolean;
  vetoReasons: string[];
  dimensionScores: DimensionScoreDetail[];
}

const CURRENT_YEAR = new Date().getFullYear();

// ── helpers ──

function safeGet<T = unknown>(obj: unknown, path: string[]): T | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur as T | undefined;
}

/** Parse a comparison string like "≥80000" → { op: "≥", value: 80000 } */
function parseComparison(s: string): { op: string; value: number } | null {
  const m = s.match(/([≥≤＞＜])\s*([\d.]+)/);
  if (!m) return null;
  return { op: m[1], value: parseFloat(m[2]) };
}

/** Check if a numeric value satisfies a comparison */
function satisfies(value: number, op: string, threshold: number): boolean {
  switch (op) {
    case '≥':
      return value >= threshold;
    case '≤':
      return value <= threshold;
    case '＞':
      return value > threshold;
    case '＜':
      return value < threshold;
    default:
      return false;
  }
}

// ── dimension evaluators ──

type EvalContext = {
  step1Data: Record<string, unknown> | undefined;
  climateZone: string;
  project?: { totalArea?: number; hospitalScale?: string };
};

type EvalResult = { tierIndex: number; condition: string; isVeto: boolean };

function evalMedicalScale(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  const totalArea = ctx.project?.totalArea ?? 0;

  // Check if condition is about 洁净区域 (for 洁净区域冷热源升级)
  const firstCond = conditions[0]?.condition ?? '';
  if (firstCond.includes('洁净区域')) {
    const cleanArea = safeGet<number>(ctx.step1Data, ['cleanArea']) ?? 0;
    const operatingRooms = safeGet<number>(ctx.step1Data, ['operatingRooms']) ?? 0;
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      const areaMatch = c.condition.match(/洁净区域总建筑面积[≥＜]\s*(\d+)\s*㎡/);
      const roomMatch = c.condition.match(/洁净手术室[≥＜]\s*(\d+)\s*间/);
      // Full comparison for tier 0: both area and rooms
      if (areaMatch && roomMatch) {
        const areaOk = satisfies(cleanArea, '≥', parseInt(areaMatch[1]));
        const roomOk = satisfies(operatingRooms, '≥', parseInt(roomMatch[1]));
        if (areaOk && roomOk) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      // Tier 1: range — both area AND room count must match
      const rangeMatch = c.condition.match(/洁净区域总建筑面积(\d+)~(\d+)㎡/);
      const roomRangeMatch = c.condition.match(/洁净手术室(\d+)~(\d+)间/);
      if (rangeMatch) {
        const lo = parseInt(rangeMatch[1]);
        const hi = parseInt(rangeMatch[2]);
        const areaOk = cleanArea >= lo && cleanArea < hi;
        const roomOk = roomRangeMatch
          ? operatingRooms >= parseInt(roomRangeMatch[1]) &&
            operatingRooms <= parseInt(roomRangeMatch[2])
          : true;
        if (areaOk && roomOk) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      // Tier 2: < 800
      if (areaMatch && c.condition.includes('＜')) {
        const m = c.condition.match(/洁净区域总建筑面积[＜]\s*(\d+)\s*㎡/);
        if (m && cleanArea < parseInt(m[1]))
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
    }
    return null;
  }

  // Check if condition is 光储充一体化 compound condition
  if (firstCond.includes('三级医院') || firstCond.includes('一级医院')) {
    const hospitalScale = ctx.project?.hospitalScale ?? '';
    const annualPower = safeGet<string>(ctx.step1Data, ['mep', 'annualPower']) ?? '';
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      if (c.condition.includes('三级医院')) {
        const isTier0 =
          hospitalScale === '三级' && (annualPower === '≥1000万' || totalArea >= 80000);
        if (isTier0) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      if (c.condition.includes('二级/三级医院')) {
        const isTier1 = hospitalScale !== '一级' && annualPower === '300~1000万';
        if (isTier1) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      if (c.condition.includes('一级医院')) {
        if (hospitalScale === '一级')
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
    }
    return null;
  }

  // Standard area-based: parse regex /建筑面积[≥＜]\s*(\d+)\s*㎡/
  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    // Handle range like "30000㎡≤建筑面积＜80000㎡"
    const rangeMatch = c.condition.match(/(\d+)㎡\s*[≤]\s*建筑面积\s*[＜]\s*(\d+)㎡/);
    if (rangeMatch) {
      const lo = parseInt(rangeMatch[1]);
      const hi = parseInt(rangeMatch[2]);
      if (totalArea >= lo && totalArea < hi)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }
    // Handle "建筑面积≥X" or "建筑面积＜X"
    const m = c.condition.match(/建筑面积\s*([≥＜])\s*(\d+)\s*㎡/);
    if (m) {
      const op = m[1];
      const val = parseInt(m[2]);
      if (satisfies(totalArea, op, val))
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

function evalClimateZone(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  // Check if this is actually solar hours (光储充一体化)
  if (conditions[0]?.condition.includes('光伏年等效利用小时数')) {
    return null; // Step 1 has no solar hours data, return null → score=1.0
  }

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    // Remove parenthetical notes
    const cleaned = c.condition.replace(/（[^）]*）/g, '').trim();
    const zones = cleaned.split('、');
    if (zones.includes(ctx.climateZone)) {
      return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

function evalPriceDiff(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  // 峰谷电价差和低谷时长从 policies 按所在地查（权威数据源）
  const location = safeGet<string[]>(ctx.step1Data, ['location']) ?? [];
  const priceInfo = getEnergyPriceInfo(location);
  const peakValleyDiff = priceInfo?.peakValleyPriceDiff ?? 0;
  const valleyHours = priceInfo?.valleyHours ?? 0;

  // 综合电价从 energyPriceReferences 按所在地查，权威文档明确写此值来自参考数据库
  const locationKey = location.length >= 2 ? `${location[0]}-${location[1]}` : '';
  // 模糊匹配：先精确匹配，再按省匹配（省会城市数据作为省内其他城市的 fallback）
  const priceRef =
    energyPriceReferences.find((r) => r.location === locationKey) ??
    energyPriceReferences.find((r) => r.location.startsWith(location[0] + '-'));
  const comprehensivePrice = priceRef?.comprehensivePrice;
  // comprehensivePrice 为 0 或 undefined → 无数据，返回 null（不扣分）

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];

    // 天然气价 — Step 1 no gas price data
    // 天然气价 - 从 energyPriceReferences 查 gasPrice
    if (c.condition.includes('天然气价')) {
      const gasPrice = priceRef?.gasPrice;
      if (!gasPrice) continue; // 无数据 -> 跳过，不扣分
      const rangeMatch = c.condition.match(/([\d.]+)元\/m³≤天然气价＜([\d.]+)元\/m³/);
      if (rangeMatch) {
        const lo = parseFloat(rangeMatch[1]);
        const hi = parseFloat(rangeMatch[2]);
        if (gasPrice >= lo && gasPrice < hi) {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      } else {
        const m = parseComparison(c.condition.replace(/天然气价/, ''));
        if (m && satisfies(gasPrice, m.op, m.value)) {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
      continue;
    }

    // 综合电价 — 从 energyPriceReferences 查 comprehensivePrice
    if (c.condition.includes('综合电价')) {
      if (!comprehensivePrice) continue; // 无数据 → 跳过，不扣分
      // Try range format first: 0.6元/kWh≤综合电价＜0.8元/kWh
      const rangeMatch = c.condition.match(/([\d.]+)元\/kWh≤综合电价＜([\d.]+)元\/kWh/);
      if (rangeMatch) {
        const lo = parseFloat(rangeMatch[1]);
        const hi = parseFloat(rangeMatch[2]);
        if (comprehensivePrice >= lo && comprehensivePrice < hi) {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      } else {
        const m = parseComparison(c.condition.replace(/综合电价/, ''));
        if (m && satisfies(comprehensivePrice, m.op, m.value)) {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
      continue;
    }

    // 峰谷电价差 (may have valley hours constraint)
    if (c.condition.includes('峰谷电价差')) {
      // Try simple format first: 峰谷电价差≥0.7元/kWh or 峰谷电价差＜0.5元/kWh
      const simpleMatch = c.condition.match(/峰谷电价差([≥＜])\s*([\d.]+)\s*元\/kWh/);
      let diffOk = false;
      if (simpleMatch) {
        diffOk = satisfies(peakValleyDiff, simpleMatch[1], parseFloat(simpleMatch[2]));
      } else {
        // Try range format: 0.5元/kWh≤峰谷电价差＜0.7元/kWh
        const rangeMatch = c.condition.match(/([\d.]+)元\/kWh≤峰谷电价差＜([\d.]+)元\/kWh/);
        if (rangeMatch) {
          const lo = parseFloat(rangeMatch[1]);
          const hi = parseFloat(rangeMatch[2]);
          diffOk = peakValleyDiff >= lo && peakValleyDiff < hi;
        }
      }
      if (!diffOk) {
        continue;
      }

      const hoursMatch = c.condition.match(/低谷电时长[≥＜]\s*(\d+)\s*h/);
      if (hoursMatch) {
        const hoursOk = satisfies(
          valleyHours,
          hoursMatch[0].includes('≥') ? '≥' : '＜',
          parseInt(hoursMatch[1]),
        );
        if (hoursOk) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      } else {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      continue;
    }
  }
  return null;
}

function evalInstallCondition(
  conditions: BoundaryCondition[],
  ctx: EvalContext,
): EvalResult | null {
  const install = safeGet<Record<string, unknown>>(ctx.step1Data, ['mep', 'install']) ?? {};

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];

    // Determine which field to check
    let fieldValue: string | undefined;
    // 优先级：机房 > 蓄冷 > 储能
    // 相变储热 condition 含"机房+储能"字样，但其场地是 mainStation（机房），不是 outdoorStorageCabin
    if (c.condition.includes('机房')) {
      fieldValue = install.mainStation as string | undefined;
    } else if (c.condition.includes('蓄冷')) {
      fieldValue = install.expansionStation as string | undefined;
    } else if (c.condition.includes('储能')) {
      fieldValue = install.outdoorStorageCabin as string | undefined;
    } else if (c.condition.includes('有线')) {
      fieldValue = install.autoControl as string | undefined;
    } else if (c.condition.includes('屋顶') || c.condition.includes('承重')) {
      fieldValue = install.rooftopLoadBearing as string | undefined;
    } else {
      // Default: check mainStation for generic "机房" conditions
      fieldValue = install.mainStation as string | undefined;
    }

    if (!fieldValue) continue;

    // Map field value to tier
    // Order matters: check most specific (veto) first, then tier 1, then tier 0.
    // "满足" is a substring of "不满足", so checking "满足" first would catch
    // "不满足要求，但可加固" and "不满足要求，且无法加固" in the wrong branch.
    if (
      c.condition.includes('不具备') ||
      c.condition.includes('无法') ||
      c.condition.includes('均无') ||
      c.condition.includes('空间紧凑')
    ) {
      if (
        fieldValue.includes('不具备') ||
        fieldValue.includes('无法') ||
        fieldValue.includes('均无') ||
        fieldValue.includes('空间紧凑')
      ) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
    } else if (
      c.condition.includes('不满足') ||
      c.condition.includes('有一定难度') ||
      c.condition.includes('有限') ||
      c.condition.includes('但可操作') ||
      c.condition.includes('可加固')
    ) {
      if (
        fieldValue.includes('有一定难度') ||
        fieldValue.includes('有限') ||
        fieldValue.includes('条件有限可操作') ||
        fieldValue.includes('可加固') ||
        fieldValue.includes('不满足')
      ) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
    } else if (
      c.condition.includes('充足') ||
      c.condition.includes('满足') ||
      c.condition.includes('可提供')
    ) {
      if (
        fieldValue.includes('充足') ||
        (fieldValue.includes('满足') && !fieldValue.includes('不满足')) ||
        fieldValue.includes('专用机房可改造') ||
        fieldValue.includes('可提供')
      ) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
    }
  }
  return null;
}

function evalManagementLevel(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  const isLighting = conditions.some((c) => c.condition.includes('照明'));

  if (isLighting) {
    const fieldValue = safeGet<string>(ctx.step1Data, ['mep', 'lightingMgmt']);
    if (!fieldValue) return null;

    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      if (c.condition.includes('无照明管理制度') && fieldValue.includes('无')) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      if (c.condition.includes('执行不足') && fieldValue.includes('执行不足')) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      if (c.condition.includes('精细化') && fieldValue.includes('精细化')) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
    }
    return null;
  }

  // hvac 管理水平：字段值是系统等级（基础群控/BAS完善/无自控），
  // 条件是人员配置（基础运维/无法独立支撑/专职暖通），语义映射
  const fieldValue = safeGet<string>(ctx.step1Data, ['mep', 'hvac', 'hvacMgmtLevel']);
  if (!fieldValue) return null;

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    if (fieldValue === '基础群控' && c.condition.includes('仅具备基础的机房群控系统')) {
      return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
    if (fieldValue === '无法支撑智能群控' && c.condition.includes('无法独立支撑')) {
      return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
    if (fieldValue === '专职团队可支撑智能群控' && c.condition.includes('专职暖通')) {
      return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

function evalEnergyStationType(
  conditions: BoundaryCondition[],
  ctx: EvalContext,
): EvalResult | null {
  const hvac = safeGet<Record<string, unknown>>(ctx.step1Data, ['mep', 'hvac']) ?? {};
  const coldSourceCentralized = (hvac.coldSourceCentralized as string[]) ?? [];
  const hasCentralCold = coldSourceCentralized.length > 0;
  const coldSourceMeta =
    (hvac.coldSourceMeta as Record<
      string,
      { year?: unknown; heatRecovery?: unknown; coolingTower?: unknown }
    >) ?? {};
  const coldSourceYears = Object.values(coldSourceMeta)
    .map((m) => Number(m?.year))
    .filter((y) => !isNaN(y) && y > 0);
  const earliestYear = coldSourceYears.length > 0 ? Math.min(...coldSourceYears) : CURRENT_YEAR;
  const coldSourceAge = CURRENT_YEAR - earliestYear;
  const hasHeatRecovery = Object.values(coldSourceMeta).some((m) => m?.heatRecovery === '有');
  const hasCoolingTower = Object.values(coldSourceMeta).some((m) => m?.coolingTower === '有');
  const steamTypes = (hvac.steamCentralizedTypes as string[]) ?? [];
  const hasSteam = steamTypes.length > 0 && steamTypes.some((s) => s !== '无');
  const cleanZoneType = hvac.cleanZoneType as string | undefined;
  const cleanZoneYear = Number(hvac.cleanZoneYear) || 0;
  const cleanZoneAge = cleanZoneYear > 0 ? CURRENT_YEAR - cleanZoneYear : 0;
  const cleanZoneHeatRecovery = hvac.cleanZoneHeatRecovery as string | undefined;
  const install = safeGet<Record<string, unknown>>(ctx.step1Data, ['mep', 'install']) ?? {};
  const rooftopPvArea = install.rooftopPvArea as string | undefined;

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];

    // 光伏面积比例 (光储充一体化)
    if (c.condition.includes('光伏面积')) {
      if (!rooftopPvArea) continue;
      // Parse actual PV area percentage from Step 1 string value
      let pct = 0;
      if (rooftopPvArea.includes('≥')) {
        pct = parseInt(rooftopPvArea.match(/(\d+)/)?.[1] ?? '0');
      } else if (rooftopPvArea.includes('~')) {
        // "5%~10%" → midpoint ~7.5% for matching
        const rangeM = rooftopPvArea.match(/(\d+)\s*~\s*(\d+)\s*%/);
        if (rangeM) pct = (parseInt(rangeM[1]) + parseInt(rangeM[2])) / 2;
      }
      // "<5%" → pct stays 0

      if (c.condition.includes('≥10%') && pct >= 10)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('5%~10%') && pct >= 5 && pct < 10)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('＜5%') && pct < 5)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }

    // 冷却塔供冷 (no Step 1 field for "是否已有冷却塔供冷")
    // 但复合条件"无集中式冷水系统，或有冷却塔供冷"前半部分可检查
    if (c.condition.includes('冷却塔供冷') && !c.condition.includes('无冷却塔供冷')) {
      if (c.condition.includes('无集中式冷水系统') && !hasCentralCold) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      return null;
    }

    // 蓄冷 (no Step 1 field for 蓄冷系统本身，但否决条件「无集中式空调系统」需检查)
    if (c.condition.includes('蓄冷系统') && !c.condition.includes('非蓄冷')) {
      // 条件可能含「无集中式空调系统」否决条件
      if (c.condition.includes('无集中式') && !hasCentralCold) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      // 蓄冷系统本身无 Step 1 字段，跳过当前条件继续检查后续
      continue;
    }

    // 投产年份 — 复合条件"无集中式冷水系统，或投产年份＜5年"需先检查前者
    if (c.condition.includes('投产年份')) {
      if (c.condition.includes('无集中式冷水系统') && !hasCentralCold) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      // 冷凝热回收约束：条件要求"无冷凝热回收"但实际有热回收 → 不匹配
      if (
        (c.condition.includes('无冷凝热回收') || c.condition.includes('无热回收')) &&
        hasHeatRecovery
      ) {
        continue;
      }
      if (c.condition.includes('＞15年') && coldSourceAge > 15)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('≥15年') && coldSourceAge >= 15)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('5~15年') && coldSourceAge >= 5 && coldSourceAge < 15)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('≤15年') && coldSourceAge <= 15)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('＜5年') && coldSourceAge < 5)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }

    // 无集中式冷水系统
    if (c.condition.includes('无集中式冷水系统')) {
      if (!hasCentralCold) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }

    // 蒸汽
    if (c.condition.includes('蒸汽')) {
      if (c.condition.includes('无集中式蒸汽')) {
        if (!hasSteam) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      } else if (
        c.condition.includes('集中式蒸汽系统完善') ||
        c.condition.includes('集中式蒸汽系统基本完善')
      ) {
        if (hasSteam) {
          if (c.condition.includes('完善') && !c.condition.includes('基本完善'))
            return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
          if (c.condition.includes('基本完善'))
            return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
      continue;
    }

    // 洁净区域
    if (c.condition.includes('洁净区域')) {
      if (c.condition.includes('无洁净区域') || c.condition.includes('无独立的冷热源')) {
        if (!cleanZoneType || cleanZoneType === 'none')
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      } else if (c.condition.includes('带热回收')) {
        if (cleanZoneHeatRecovery === '有')
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      } else if (c.condition.includes('无热回收')) {
        if (cleanZoneType && cleanZoneType !== 'none' && cleanZoneHeatRecovery === '无') {
          if (c.condition.includes('≥10年') && cleanZoneAge >= 10)
            return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
          if (c.condition.includes('＜10年') && cleanZoneAge < 10)
            return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
      continue;
    }

    // 冷凝热回收 / 热回收
    if (c.condition.includes('冷凝热回收') || c.condition.includes('热回收')) {
      if (c.condition.includes('无冷凝热回收') || c.condition.includes('无热回收')) {
        if (!hasHeatRecovery) {
          if (c.condition.includes('＞15年') && coldSourceAge > 15)
            return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
          if (c.condition.includes('≤15年') && coldSourceAge <= 15)
            return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
      continue;
    }

    // 冷却塔（排除冷却塔供冷技术自有条件，但允许"无冷却塔供冷"通过）
    if (
      c.condition.includes('冷却塔') &&
      (!c.condition.includes('冷却塔供冷') || c.condition.includes('无冷却塔供冷'))
    ) {
      if (c.condition.includes('有冷却塔') && c.condition.includes('无冷却塔供冷')) {
        if (hasCoolingTower) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      if (c.condition.includes('无冷却塔')) {
        if (!hasCoolingTower) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      continue;
    }

    // 蓄冷技术自有条件：有集中式冷水系统，但非蓄冷系统
    // 非蓄冷 = 无蓄冷系统，Step 1 无此字段，只检查"有集中式冷水系统"
    if (c.condition.includes('非蓄冷')) {
      if (hasCentralCold) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }

    // 有集中式冷水系统 (generic check)
    if (
      c.condition.includes('有集中式冷水系统') &&
      !c.condition.includes('冷却塔') &&
      !c.condition.includes('投产年份')
    ) {
      if (hasCentralCold) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }
  }
  return null;
}

function evalAutomationLevel(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  const smart = safeGet<Record<string, unknown>>(ctx.step1Data, ['mep', 'smart']) ?? {};
  const smartLevel = (smart.level as string) ?? '';
  // 冷却水泵 = condenserPumpVfd（不是 chillerPumpVfd/冷水泵）
  const condenserPumpVfd = (smart.condenserPumpVfd as string) ?? '';
  const coolingTowerFanVfd = (smart.coolingTowerFanVfd as string) ?? '';

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];

    // 冷却水泵/冷却塔风机 VFD check
    if (c.condition.includes('冷却水泵')) {
      if (c.condition.includes('定频运行') && !c.condition.includes('变频')) {
        if (condenserPumpVfd === '定频' && coolingTowerFanVfd === '定频')
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      } else if (c.condition.includes('定频') && c.condition.includes('变频')) {
        if (condenserPumpVfd === '定频' && coolingTowerFanVfd === '变频')
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      } else if (c.condition.includes('变频运行')) {
        if (condenserPumpVfd === '变频' && coolingTowerFanVfd === '变频')
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
      continue;
    }

    // Smart level check
    if (c.condition.includes('无数据采集') || c.condition.includes('靠人工')) {
      if (smartLevel === '无自控')
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('仅具备基础') || c.condition.includes('基础数据采集')) {
      if (smartLevel === '基础群控')
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('BAS') || c.condition.includes('完善的楼宇自控')) {
      if (smartLevel === 'BAS完善')
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

function evalPipePartition(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  // 蒸汽冷凝水条件：Step 1 无冷凝水分质收集字段
  if (conditions.some((c) => c.condition.includes('冷凝水'))) {
    return null;
  }

  const isLighting = conditions.some((c) => c.condition.includes('照明'));
  const hvac = safeGet<Record<string, unknown>>(ctx.step1Data, ['mep', 'hvac']) ?? {};
  const fieldValue = isLighting
    ? safeGet<string>(ctx.step1Data, ['mep', 'lightingPartition'])
    : (hvac.waterPartition as string | undefined);

  if (!fieldValue) return null;

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];

    if (c.condition.includes('已按医疗区域分区') || c.condition.includes('集中式照明回路完善')) {
      if (fieldValue.includes('已按医疗区域分区') || fieldValue.includes('分区回路完善')) {
        // Check for additional constraints like "独立的内区环路"
        if (c.condition.includes('独立的内区环路')) {
          if (fieldValue.includes('独立的内区环路'))
            return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        } else {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
    } else if (c.condition.includes('有分区') || c.condition.includes('有基本的分回路')) {
      if (fieldValue.includes('有分区') || fieldValue === '基本分回路') {
        if (c.condition.includes('洁净区未独立') && fieldValue === '有分区洁净区未独立') {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        } else if (
          c.condition.includes('洁净区已独立') &&
          c.condition.includes('内区未独立') &&
          fieldValue === '有分区内区未独立'
        ) {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        } else if (c.condition.includes('有基本的分回路') && fieldValue === '基本分回路') {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
    } else if (c.condition.includes('未按医疗区域分区') || c.condition.includes('无集中分回路')) {
      if (
        fieldValue.includes('未分区') ||
        fieldValue.includes('无集中分回路') ||
        fieldValue.includes('无分回路')
      ) {
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      }
    }
  }
  return null;
}

function evalHospitalType(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  const hospitalType = safeGet<string>(ctx.step1Data, ['hospitalType']) ?? '';

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    const cleaned = c.condition.replace(/[（(][^)）]*[)）]/g, '').trim();
    const types = cleaned.split('、');
    if (types.some((t) => hospitalType.includes(t))) {
      return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

function evalGridExpansion(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  const install = safeGet<Record<string, unknown>>(ctx.step1Data, ['mep', 'install']) ?? {};
  const isPv = conditions.some((c) => c.condition.includes('光伏'));
  const fieldValue = isPv
    ? (install.gridExpansionPv as string | undefined)
    : (install.gridExpansionStorage as string | undefined);

  if (!fieldValue) return null;

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];

    // 光储充一体化: 变压器负荷率 (no Step 1 field)
    if (c.condition.includes('变压器负荷率')) {
      return null;
    }

    if (c.condition.includes('容量富余') || c.condition.includes('无需增容')) {
      if (fieldValue.includes('容量富余'))
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('无法增容')) {
      if (fieldValue.includes('无法增容'))
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('可增容') || c.condition.includes('过载风险')) {
      if (fieldValue.includes('过载风险可增容') || fieldValue.includes('负荷率＞90%无法增容')) {
        if (!fieldValue.includes('无法增容')) {
          return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
        }
      }
    }
  }
  return null;
}

function evalEnergyPolicy(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  const energyPolicies = safeGet<string[]>(ctx.step1Data, ['energyPolicies']) ?? [];
  const renewableSubsidies = safeGet<string[]>(ctx.step1Data, ['renewableSubsidies']) ?? [];
  const hasPolicy = energyPolicies.length > 0;
  const hasSubsidy = renewableSubsidies.length > 0;

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    // Order matters: "暂无财政专项补贴" contains "财政专项补贴" as substring,
    // so check "暂无" first to avoid matching tier 0 for tier 1 conditions.
    if (c.condition.includes('暂无')) {
      if (hasPolicy && !hasSubsidy)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('财政专项补贴')) {
      if (hasPolicy && hasSubsidy)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (
      c.condition.includes('无') &&
      (c.condition.includes('政策') || c.condition.includes('能源'))
    ) {
      if (!hasPolicy) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

function evalOutdoorArea(conditions: BoundaryCondition[], ctx: EvalContext): EvalResult | null {
  const totalArea = ctx.project?.totalArea ?? 1;
  const install = safeGet<Record<string, unknown>>(ctx.step1Data, ['mep', 'install']) ?? {};

  const isGeo = conditions.some((c) => c.condition.includes('地源'));
  const isPv = conditions.some((c) => c.condition.includes('光伏'));

  let fieldValue: number | undefined;
  if (isGeo) {
    fieldValue = install.geoHeatExchangerArea as number | undefined;
  } else if (isPv) {
    const pvStr = install.rooftopPvArea as string | undefined;
    const pct = parseInt(pvStr?.match(/(\d+)/)?.[1] ?? '0');
    fieldValue = (pct / 100) * totalArea;
  } else {
    // 储能舱距离
    const outdoorStr = install.outdoorStorageCabin as string | undefined;
    if (!outdoorStr) {
      // 无数据 -> 匹配最后一个 tier（与地源/光伏一致，通常是"无法满足"否决条件）
      const lastIdx = conditions.length - 1;
      return {
        tierIndex: lastIdx,
        condition: conditions[lastIdx].condition,
        isVeto: conditions[lastIdx].isVeto,
      };
    }
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      if (c.condition.includes('≥50m') && outdoorStr.includes('≥50m'))
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('25~50m') && outdoorStr.includes('25~50m'))
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      if (c.condition.includes('无法满足') && outdoorStr.includes('无法满足'))
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
    return null;
  }

  if (fieldValue === undefined) {
    // 无场地数据 -> 匹配最后一个 tier（"无室外场地条件"）
    const lastIdx = conditions.length - 1;
    return {
      tierIndex: lastIdx,
      condition: conditions[lastIdx].condition,
      isVeto: conditions[lastIdx].isVeto,
    };
  }

  const ratio = fieldValue / totalArea;

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];

    // "~" range format: "5%~10%" (光伏) or "8%~18%" (地源)
    const tildeMatch = c.condition.match(/(\d+)\s*~\s*(\d+)\s*%/);
    if (tildeMatch) {
      const lo = parseInt(tildeMatch[1]) / 100;
      const hi = parseInt(tildeMatch[2]) / 100;
      if (ratio >= lo && ratio < hi)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }

    // "≤...＜" range format: "8%≤面积＜18%"
    const rangeMatch = c.condition.match(/(\d+)%\s*[≤]\s*面积\s*[＜]\s*(\d+)%/);
    if (rangeMatch) {
      const lo = parseInt(rangeMatch[1]) / 100;
      const hi = parseInt(rangeMatch[2]) / 100;
      if (ratio >= lo && ratio < hi)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
      continue;
    }

    // Simple comparison: "≥18%" or "＜8%"
    const m = c.condition.match(/[≥＜]\s*(\d+)\s*%/);
    if (!m) continue;
    const threshold = parseInt(m[1]) / 100;

    if (c.condition.includes('≥')) {
      if (ratio >= threshold) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('＜')) {
      if (ratio < threshold) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

// 仅智能照明
function evalProjectAttribute(
  conditions: BoundaryCondition[],
  ctx: EvalContext,
): EvalResult | null {
  const lightingEnergy = safeGet<string[]>(ctx.step1Data, ['mep', 'lightingEnergy']) ?? [];
  const smartLighting = safeGet<string>(ctx.step1Data, ['mep', 'smartLighting']) ?? '';
  const hasEnergySavingLamp = lightingEnergy.some((l) => l.includes('LED') || l.includes('节能'));

  // Tier 0: 节能灯具 + 未采用智能照明 (score 1)
  if (hasEnergySavingLamp && smartLighting !== '已采用') {
    return { tierIndex: 0, condition: conditions[0].condition, isVeto: conditions[0].isVeto };
  }
  // Tier 1: 非节能灯具 + 未采用智能照明 (score 0.75)
  if (!hasEnergySavingLamp && smartLighting !== '已采用') {
    return { tierIndex: 1, condition: conditions[1].condition, isVeto: conditions[1].isVeto };
  }
  // Tier 3: 节能灯具 + 已采用 (score 0.25)
  // NOTE: tier 2 (conditions[2]) "节能灯具，但未采用智能照明" is semantically identical to tier 0,
  // first-match-wins means tier 2 is never reached. Data bug preserved.
  if (hasEnergySavingLamp && smartLighting === '已采用') {
    return { tierIndex: 3, condition: conditions[3].condition, isVeto: conditions[3].isVeto };
  }
  return null;
}

// 仅智能照明
function evalImplementableArea(
  conditions: BoundaryCondition[],
  ctx: EvalContext,
): EvalResult | null {
  const smartLevel1 = safeGet<string[]>(ctx.step1Data, ['mep', 'smartLevel1']) ?? [];
  const smartLevel2 = safeGet<string[]>(ctx.step1Data, ['mep', 'smartLevel2']) ?? [];
  const allImplemented = new Set([...smartLevel1, ...smartLevel2]);
  const implementedCount = allImplemented.size;

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    if (c.condition.includes('均未实现')) {
      if (implementedCount === 0) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('小于一半')) {
      if (implementedCount >= 1 && implementedCount <= 5)
        return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    } else if (c.condition.includes('超过一半')) {
      if (implementedCount >= 6) return { tierIndex: i, condition: c.condition, isVeto: c.isVeto };
    }
  }
  return null;
}

// ── dimension name → evaluator mapping ──

const DIMENSION_EVALUATORS: Record<
  string,
  (conditions: BoundaryCondition[], ctx: EvalContext) => EvalResult | null
> = {
  '医疗/建筑规模': evalMedicalScale,
  气候分区: evalClimateZone,
  '峰谷电价差（或综合电价/气价/水价）': evalPriceDiff,
  '机电安装条件（包括：机电站房安装条件、自控系统安装条件）': evalInstallCondition,
  '管理水平（包括：冷热源系统管理水平、照明系统管理水平）': evalManagementLevel,
  '能源站系统类型（包括：冷源系统类型、热源系统类型）': evalEnergyStationType,
  系统自动化基础: evalAutomationLevel,
  '机电管路系统分区（包括：空调水管路分区情况、蒸汽冷凝水管路分区情况、照明系统分区情况）':
    evalPipePartition,
  医院类型: evalHospitalType,
  电网增容: evalGridExpansion,
  当地能源政策: evalEnergyPolicy,
  室外场地面积条件: evalOutdoorArea,
  项目属性: evalProjectAttribute,
  可实施医疗区域范围: evalImplementableArea,
};

// ── main export ──

export function scoreTechBoundary(
  techName: string,
  step1Data: Record<string, unknown> | undefined,
  climateZone: string,
  project?: { totalArea?: number; hospitalScale?: string },
): TechScoreResult {
  const boundary = getTechBoundary(techName);

  if (!boundary || !boundary.dimensions.length) {
    return {
      techName,
      score: 1.0,
      isVetoed: false,
      vetoReasons: [],
      dimensionScores: [],
    };
  }

  const ctx: EvalContext = { step1Data, climateZone, project };
  const dimensionScores: DimensionScoreDetail[] = [];
  const vetoReasons: string[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const dim of boundary.dimensions) {
    const evaluator = DIMENSION_EVALUATORS[dim.dimension];
    let result: EvalResult | null = null;

    if (evaluator) {
      result = evaluator(dim.conditions, ctx);
    }

    if (result) {
      const tierScore = dim.conditions[result.tierIndex]?.score ?? 1;
      dimensionScores.push({
        dimension: dim.dimension,
        weight: dim.weight,
        score: tierScore,
        matchedCondition: result.condition,
        isVeto: result.isVeto,
      });
      totalWeightedScore += dim.weight * tierScore;
      totalWeight += dim.weight;
      if (result.isVeto) {
        vetoReasons.push(`${dim.dimension}: ${result.condition}`);
      }
    } else {
      // No match → default score 1.0 (no penalty)
      dimensionScores.push({
        dimension: dim.dimension,
        weight: dim.weight,
        score: 1.0,
        matchedCondition: '(未匹配)',
        isVeto: false,
      });
      totalWeightedScore += dim.weight * 1.0;
      totalWeight += dim.weight;
    }
  }

  const score = totalWeight > 0 ? totalWeightedScore / totalWeight : 1.0;
  const isVetoed = vetoReasons.length > 0;

  return {
    techName,
    score: Math.round(score * 10000) / 10000,
    isVetoed,
    vetoReasons,
    dimensionScores,
  };
}
