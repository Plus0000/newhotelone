import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Card, Table, Select, Typography, Tag, Button, Space } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { SavingEquipment, OriginalEquipment, ZoneConfig, InvestmentRow } from '@/shared/stores/projectStore';
import { useProjectStore } from '@/shared/stores/projectStore';
import { StableInputNumber } from '@/shared/components/StableInputNumber';
import { useMergedTechEntries } from '@/features/knowledge-base/store';
import { getSimultaneousCoeff, calcAnnualHours } from './helpers';
import { EquipmentPickerModal } from './EquipmentPickerModal';

const { Text } = Typography;

// ── Constants ──────────────────────────────────────────────────────────

const SYSTEM_OPTIONS = [
  { label: '空调制冷系统', value: '空调制冷系统' },
  { label: '空调通风系统', value: '空调通风系统' },
  { label: '供暖系统', value: '供暖系统' },
  { label: '照明系统', value: '照明系统' },
  { label: '生活热水系统', value: '生活热水系统' },
  { label: '给排水系统', value: '给排水系统' },
  { label: '电梯系统', value: '电梯系统' },
  { label: '弱电系统', value: '弱电系统' },
  { label: '科室用电（办公设备）', value: '科室用电（办公设备）' },
  { label: '医疗设备系统', value: '医疗设备系统' },
  { label: '重点机房系统', value: '重点机房系统' },
];

// 面积权重：优先读 zoneConfigs[zone].buildingArea，全部未填时退回等权 1
// (calcAnnualHours / SYSTEM_PERIOD_MAP / getDaysInRange / countWeekendDays 已移至 helpers.ts)

// ── Delayed Multiple Select ──

function DelayedMultipleSelect({ value, onChange, options, tagRender, ...rest }: any) {
  const [buffered, setBuffered] = useState(value);
  const bufferedRef = useRef(value);
  const isOpenRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!isOpenRef.current) {
      setBuffered(value);
      bufferedRef.current = value;
    }
  }, [value]);

  const commitBuffer = () => {
    if (bufferedRef.current !== valueRef.current) {
      onChange(bufferedRef.current);
    }
  };

  return (
    <Select
      mode="multiple"
      value={buffered}
      onChange={(val) => {
        setBuffered(val);
        bufferedRef.current = val;
      }}
      onDropdownVisibleChange={(visible) => {
        if (visible) {
          // 打开新下拉前，提交其他可能开着的下拉的 buffer
          commitBuffer();
        }
        isOpenRef.current = visible;
        if (!visible) {
          onChange(bufferedRef.current);
        }
      }}
      onFocus={() => {
        // 获得焦点时也提交，防止快速切换
        commitBuffer();
      }}
      options={options}
      tagRender={tagRender}
      {...rest}
    />
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

// 单位 → kWh 换算系数（用于计算运行能耗时统一换算为 kWh）
const UNIT_TO_KWH: Record<string, number> = {
  kW: 1,
  kWh: 1,
  MW: 1000,
  GJ: 277.778,
  万kWh: 10000,
  万kJ: 2.77778,
  t: 627, // 蒸吨 -> kWh（按蒸汽焓值 2257 kJ/kg × 1000kg / 3600 ≈ 627 kWh）
  'm³': 10.55, // 天然气 m³ -> kWh（按热值，HHV）
  kg: 8.14, // 标煤 kg -> kWh（1 kgce = 29.27 MJ = 8.14 kWh）
};

function toKwh(value: number, unit: string): number {
  const factor = UNIT_TO_KWH[unit] ?? 1;
  return value * factor;
}

function calcEnergyConsumption(
  powerKw: number,
  quantity: number,
  hours: number,
  coeff: number,
  unit?: string,
): number {
  const p = toKwh(Number(powerKw) || 0, unit || 'kW');
  const q = Number(quantity) || 0;
  const h = Number(hours) || 0;
  const c = Number(coeff) || 0;
  return (p * q * h * c) / 10000;
}

function calcOperatingCost(energy: number, price: number): number {
  const e = Number(energy) || 0;
  const pr = Number(price) || 0;
  return e * pr;
}

// 按设备单位选对应能源价：m³ 用气价（÷10.55 转为元/万kWh 等价单位），其他用综合电价
// energy 字段单位是万kWh，price 字段单位是元/kWh，相乘结果 = 万元
// 气价元/Nm³，1 Nm³ = 10.55 kWh，1 万kWh = 10000/10.55 Nm³，气费(万元) = 万kWh × gasPrice / 10.55
function getPriceByUnit(
  unit: string | undefined,
  prices: { comprehensivePrice: number; gasPrice: number },
): number {
  if (unit === 'm³') return prices.gasPrice / 10.55;
  return prices.comprehensivePrice;
}

// ── Props ──────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  savingEquipments: Record<string, SavingEquipment[]>;
  originalEquipments: OriginalEquipment[];
  onChangeSaving: React.Dispatch<React.SetStateAction<Record<string, SavingEquipment[]>>>;
  onChangeOriginal: React.Dispatch<React.SetStateAction<OriginalEquipment[]>>;
  zoneConfigs: Record<string, ZoneConfig> | undefined;
  comprehensivePrice: number;
  gasPrice?: number;
}

// ── Component ──────────────────────────────────────────────────────────

export default function StepCalculation({
  projectId,
  savingEquipments,
  originalEquipments,
  onChangeSaving,
  onChangeOriginal,
  zoneConfigs,
  comprehensivePrice,
  gasPrice,
}: Props) {
  const techEntries = useMergedTechEntries();
  const [collapsedTechs, setCollapsedTechs] = useState<Set<string>>(new Set());
  const [selectedOriginalIds, setSelectedOriginalIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerIdx, setPickerIdx] = useState<number>(-1);

  // Refs to stabilize callbacks (prevent Select dropdown close on state change)
  const savingEquipmentsRef = useRef(savingEquipments);
  savingEquipmentsRef.current = savingEquipments;
  const originalEquipmentsRef = useRef(originalEquipments);
  originalEquipmentsRef.current = originalEquipments;
  const zoneConfigsRef = useRef(zoneConfigs);
  zoneConfigsRef.current = zoneConfigs;
  const priceRef = useRef({ comprehensivePrice, gasPrice: gasPrice ?? 0 });
  priceRef.current = { comprehensivePrice, gasPrice: gasPrice ?? 0 };

  // 根据 zoneConfigs 的 enabled 状态动态生成服务对象选项
  const serviceTargetOptions = useMemo(() => {
    const ALL_ZONES = ['门诊', '急诊', '医技', '病房和感染', '行政后勤', '教学科研', '健康管理'];
    const enabled = ALL_ZONES.filter((z) => zoneConfigs?.[z]?.enabled !== false);
    return enabled.map((z) => ({ label: z, value: z }));
  }, [zoneConfigs]);

  // 当综合电价或气价变化时，重算所有设备的运行费用（按设备单位选对应能源价）
  const prevPriceRef = useRef({ comprehensivePrice, gasPrice: gasPrice ?? 0 });
  useEffect(() => {
    const cur = { comprehensivePrice, gasPrice: gasPrice ?? 0 };
    if (
      prevPriceRef.current.comprehensivePrice === cur.comprehensivePrice &&
      prevPriceRef.current.gasPrice === cur.gasPrice
    )
      return;
    prevPriceRef.current = cur;

    onChangeSaving((prev) => {
      const updated: Record<string, SavingEquipment[]> = {};
      for (const [techId, list] of Object.entries(prev)) {
        updated[techId] = list.map((eq) => ({
          ...eq,
          operatingCost: calcOperatingCost(eq.energyConsumption, getPriceByUnit(eq.unit, cur)),
        }));
      }
      return updated;
    });

    onChangeOriginal((prev) =>
      prev.map((eq) => ({
        ...eq,
        operatingCost: calcOperatingCost(eq.energyConsumption, getPriceByUnit(eq.unit, cur)),
      })),
    );
  }, [comprehensivePrice, gasPrice, onChangeSaving, onChangeOriginal]);

  // 当 zoneConfigs（时段/面积）变化时，重算所有设备的运行时间/能耗/费用
  const prevZoneRef = useRef(zoneConfigs);
  useEffect(() => {
    if (prevZoneRef.current === zoneConfigs) return;
    prevZoneRef.current = zoneConfigs;

    onChangeSaving((prev) => {
      const updated: Record<string, SavingEquipment[]> = {};
      for (const [techId, list] of Object.entries(prev)) {
        updated[techId] = list.map((eq) => {
          const systems = eq.systems ?? [];
          const operatingHours =
            systems.length > 0
              ? calcAnnualHours(zoneConfigs, systems, eq.serviceTargets ?? [])
              : (eq.operatingHours ?? 0);
          const energyConsumption = calcEnergyConsumption(
            eq.ratedPower ?? 0,
            eq.quantity ?? 1,
            operatingHours,
            eq.simultaneousCoeff,
            eq.unit,
          );
          return {
            ...eq,
            operatingHours,
            energyConsumption,
            operatingCost: calcOperatingCost(
              energyConsumption,
              getPriceByUnit(eq.unit, priceRef.current),
            ),
          };
        });
      }
      return updated;
    });

    onChangeOriginal((prev) =>
      prev.map((eq) => {
        const systems = (eq.systemCategory as string[]) ?? [];
        // 用户手动改过运行时间则不覆盖
        const operatingHours = eq.operatingHoursManual
          ? (eq.operatingHours ?? 0)
          : systems.length > 0
            ? calcAnnualHours(zoneConfigs, systems, eq.serviceTargets ?? [])
            : (eq.operatingHours ?? 0);
        const energyConsumption = calcEnergyConsumption(
          eq.ratedPower ?? 0,
          eq.quantity ?? 1,
          operatingHours,
          eq.simultaneousCoeff,
          eq.unit,
        );
        return {
          ...eq,
          operatingHours,
          energyConsumption,
          operatingCost: calcOperatingCost(
            energyConsumption,
            getPriceByUnit(eq.unit, priceRef.current),
          ),
        };
      }),
    );
  }, [zoneConfigs, onChangeSaving, onChangeOriginal]);

  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const projectsStep3SelectedTechs = useProjectStore((s) => s.projectsStep3SelectedTechs);

  const techIds = projectsStep3SelectedTechs[projectId] ?? [];

  // ── Group by tech ──

  const techGroups = useMemo(() => {
    const result: Array<{
      techId: string;
      techName: string;
      mainEquipments: InvestmentRow[];
      savedEquipments: SavingEquipment[];
    }> = [];
    for (const techId of techIds) {
      const tech = techEntries.find((t) => t.id === techId);
      if (tech?.isDependentTech) continue; // 附属技术单独处理
      const mainEquipments = Object.values(
        projectsStep3Data[projectId]?.[techId]?.equipment ?? [],
      ).filter((r) => r.isMainEquipment);
      if (mainEquipments.length === 0) continue;
      const saved = savingEquipments[techId] ?? [];
      result.push({ techId, techName: tech?.name ?? techId, mainEquipments, savedEquipments: saved });
    }
    return result;
  }, [techIds, projectId, projectsStep3Data, savingEquipments, techEntries]);

  // 附属技术分组：已选的附属技术单独展示（不参与节能/原方案计算）
  const dependentGroups = useMemo(() => {
    const result: Array<{ techId: string; techName: string }> = [];
    for (const techId of techIds) {
      const tech = techEntries.find((t) => t.id === techId);
      if (!tech?.isDependentTech) continue;
      result.push({ techId, techName: tech.name });
    }
    return result;
  }, [techIds, techEntries]);

  // ── Global totals ──

  const globalTotals = useMemo(() => {
    let savingEnergy = 0,
      savingCost = 0;
    let originalEnergy = 0,
      originalCost = 0;
    for (const list of Object.values(savingEquipments)) {
      for (const eq of list) {
        savingEnergy += eq.energyConsumption || 0;
        savingCost += eq.operatingCost || 0;
      }
    }
    for (const eq of originalEquipments) {
      originalEnergy += eq.energyConsumption || 0;
      originalCost += eq.operatingCost || 0;
    }
    return { savingEnergy, savingCost, originalEnergy, originalCost };
  }, [savingEquipments, originalEquipments]);

  // ── Toggle collapse ──

  const toggleCollapse = (techId: string) => {
    setCollapsedTechs((prev) => {
      const next = new Set(prev);
      next.has(techId) ? next.delete(techId) : next.add(techId);
      return next;
    });
  };

  // ── Saving: update field (recalc everything) ──

  const recalcAndUpdate = useCallback(
    (techId: string, equipId: string, patch: Partial<SavingEquipment>) => {
      const zc = zoneConfigsRef.current;
      const prices = priceRef.current;

      onChangeSaving((prev) => {
        const list = [...(prev[techId] ?? [])];
        const idx = list.findIndex((e) => e.id === equipId);
        if (idx === -1) return prev;

        const updated = { ...list[idx], ...patch };

        if ('systems' in patch || 'serviceTargets' in patch) {
          updated.operatingHours = calcAnnualHours(zc, updated.systems, updated.serviceTargets);
        }

        if ('systems' in patch) {
          // 只在用户没手动改过 simultaneousCoeff 时自动覆盖，避免覆盖用户手填值
          if (!list[idx].simultaneousCoeffManual) {
            updated.simultaneousCoeff = getSimultaneousCoeff(updated.systems);
          }
        }

        const power = updated.ratedPower ?? 0;
        const qty = updated.quantity ?? 1;
        updated.energyConsumption = calcEnergyConsumption(
          power,
          qty,
          updated.operatingHours,
          updated.simultaneousCoeff,
          updated.unit,
        );
        updated.operatingCost = calcOperatingCost(
          updated.energyConsumption,
          getPriceByUnit(updated.unit, prices),
        );

        list[idx] = updated;
        return { ...prev, [techId]: list };
      });
    },
    [onChangeSaving],
  );

  // ── Saving Columns ──

  const savingColumns = useMemo<ColumnsType<SavingEquipment>>(
    () => [
      {
        title: '主要用能设备',
        dataIndex: 'equipmentName',
        key: 'equipmentName',
        onHeaderCell: () => ({ style: { borderLeft: '3px solid #52c41a' } }),
        onCell: () => ({ style: { borderLeft: '3px solid #52c41a' } }),
        render: (name: string) => (
          <Text strong style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
            {name}
          </Text>
        ),
      },
      {
        title: '作用系统',
        dataIndex: 'systems',
        key: 'systems',
        onCell: () => ({
          style: { padding: '5px 12px', verticalAlign: 'middle', whiteSpace: 'normal' },
        }),
        render: (v: string[], record: SavingEquipment) => (
          <DelayedMultipleSelect
            value={v}
            onChange={(val: string[]) =>
              recalcAndUpdate(record.techId, record.id, { systems: val })
            }
            options={SYSTEM_OPTIONS}
            size="small"
            style={{ width: '100%', minHeight: 30 }}
            variant="borderless"
            className="ra-select"
            placeholder="选择作用系统"
            getPopupContainer={() => document.body}
            tagRender={(props: any) => (
              <Tag
                closable
                onClose={props.onClose}
                closeIcon={<span style={{ color: '#1677ff' }}>×</span>}
                style={{
                  margin: 0,
                  fontSize: 11,
                  lineHeight: '20px',
                  padding: '0 4px 0 8px',
                  background: '#e6f4ff',
                  border: '1px solid #91caff',
                  color: '#1677ff',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {props.label}
              </Tag>
            )}
          />
        ),
      },
      {
        title: '能耗',
        dataIndex: 'ratedPower',
        key: 'ratedPower',
        width: 100,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right' } }),
        render: (v: number) => (
          <Text style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, color: '#8c8c8c' }}>
            {v ? v.toFixed(1) : '-'}
          </Text>
        ),
      },
      {
        title: '能耗单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 60,
        onHeaderCell: () => ({ style: { textAlign: 'center' } }),
        onCell: () => ({ style: { textAlign: 'center' } }),
        render: (v: string) => <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{v || '-'}</Text>,
      },
      {
        title: '台数',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 80,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right' } }),
        render: (v: number, record: SavingEquipment) => (
          <StableInputNumber
            value={v}
            onValueChange={(val) => recalcAndUpdate(record.techId, record.id, { quantity: val })}
            variant="borderless"
            size="small"
            min={1}
            step={1}
            precision={0}
            style={{ width: '100%' }}
            className="ra-input"
          />
        ),
      },
      {
        title: '服务对象',
        dataIndex: 'serviceTargets',
        key: 'serviceTargets',
        onCell: () => ({
          style: { padding: '5px 12px', verticalAlign: 'middle', whiteSpace: 'normal' },
        }),
        render: (v: string[], record: SavingEquipment) => (
          <DelayedMultipleSelect
            value={v}
            onChange={(val: string[]) =>
              recalcAndUpdate(record.techId, record.id, { serviceTargets: val })
            }
            options={serviceTargetOptions}
            size="small"
            style={{ width: '100%', minHeight: 30 }}
            variant="borderless"
            className="ra-select"
            placeholder="选择服务对象"
            getPopupContainer={() => document.body}
            tagRender={(props: any) => (
              <Tag
                closable
                onClose={props.onClose}
                closeIcon={<span style={{ color: '#1677ff' }}>×</span>}
                style={{
                  margin: 0,
                  fontSize: 11,
                  lineHeight: '20px',
                  padding: '0 4px 0 8px',
                  background: '#e6f4ff',
                  border: '1px solid #91caff',
                  color: '#1677ff',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {props.label}
              </Tag>
            )}
          />
        ),
      },
      {
        title: '运行时间(h/年)',
        dataIndex: 'operatingHours',
        key: 'operatingHours',
        width: 110,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right' } }),
        render: (v: number) => (
          <Text style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 500 }}>
            {v > 0 ? v.toLocaleString() : '-'}
          </Text>
        ),
      },
      {
        title: '同时使用系数',
        dataIndex: 'simultaneousCoeff',
        key: 'simultaneousCoeff',
        width: 100,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right' } }),
        render: (v: number) => (
          <Text style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{v.toFixed(2)}</Text>
        ),
      },
      {
        title: '运行能耗(万kWh/年)',
        dataIndex: 'energyConsumption',
        key: 'energyConsumption',
        width: 130,
        onHeaderCell: () => ({ style: { textAlign: 'right', background: '#f5f9ff' } }),
        onCell: () => ({ style: { textAlign: 'right', background: '#f5f9ff' } }),
        render: (v: number) => (
          <Text
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: 12,
              color: '#1677ff',
              fontWeight: 500,
            }}
          >
            {v !== undefined && v !== null ? v.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: '运行费用(万元/年)',
        dataIndex: 'operatingCost',
        key: 'operatingCost',
        width: 120,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right' } }),
        render: (v: number) => (
          <Text
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: 12,
              color: '#1677ff',
              fontWeight: 500,
            }}
          >
            {v !== undefined && v !== null ? v.toFixed(2) : '-'}
          </Text>
        ),
      },
    ],
    [recalcAndUpdate],
  );

  // ── Original equipment Select options ──

  const ORIGINAL_SYSTEM_OPTIONS = [
    { label: '空调制冷系统', value: '空调制冷系统' },
    { label: '空调通风系统', value: '空调通风系统' },
    { label: '供暖系统', value: '供暖系统' },
    { label: '照明系统', value: '照明系统' },
    { label: '生活热水系统', value: '生活热水系统' },
    { label: '给排水系统', value: '给排水系统' },
    { label: '电梯系统', value: '电梯系统' },
    { label: '弱电系统', value: '弱电系统' },
    { label: '科室用电（办公设备）', value: '科室用电（办公设备）' },
    { label: '医疗设备系统', value: '医疗设备系统' },
    { label: '重点机房系统', value: '重点机房系统' },
  ];

  // ── Original handlers ──

  const updateOriginalField = useCallback(
    (idx: number, field: keyof OriginalEquipment, value: number | string | string[]) => {
      const zc = zoneConfigsRef.current;
      const prices = priceRef.current;

      onChangeOriginal((prev) => {
        const list = [...prev];
        const updated = { ...list[idx], [field]: value };

        if (field === 'operatingHours') {
          // 用户手动改了运行时间，标记为手动，后续 zoneConfigs 变化不覆盖
          updated.operatingHoursManual = true;
        } else if (field === 'simultaneousCoeff') {
          // 用户手动改了同时使用系数，标记为手动，后续 systems 变化不覆盖
          updated.simultaneousCoeffManual = true;
        } else if (field === 'serviceTargets' || field === 'systemCategory') {
          const systems = updated.systemCategory as string[];
          updated.operatingHours = calcAnnualHours(zc, systems, updated.serviceTargets as string[]);
          updated.operatingHoursManual = false;
          if (field === 'systemCategory') {
            // 只在用户没手动改过 simultaneousCoeff 时自动覆盖，避免覆盖用户手填值
            if (!list[idx].simultaneousCoeffManual) {
              updated.simultaneousCoeff = getSimultaneousCoeff(systems);
            }
          }
        }

        const energy = calcEnergyConsumption(
          updated.ratedPower,
          updated.quantity,
          updated.operatingHours,
          updated.simultaneousCoeff,
          updated.unit,
        );
        updated.energyConsumption = energy;
        updated.operatingCost = calcOperatingCost(energy, getPriceByUnit(updated.unit, prices));

        list[idx] = updated;
        return list;
      });
    },
    [onChangeOriginal],
  );

  const handlePickerSelect = useCallback(
    (data: {
      systemLargeClass: string;
      deviceType: string;
      deviceName: string;
      equipmentName: string;
      ratedPower: number;
      unit: string;
    }) => {
      const zc = zoneConfigsRef.current;
      const prices = priceRef.current;

      onChangeOriginal((prev) => {
        const list = [...prev];
        const updated = {
          ...list[pickerIdx],
          systemLargeClass: data.systemLargeClass,
          deviceType: data.deviceType,
          deviceName: data.deviceName,
          equipmentName: data.equipmentName,
          ratedPower: data.ratedPower,
          unit: data.unit,
        };

        const systems = updated.systemCategory as string[];
        if (systems.length > 0 && !updated.operatingHoursManual) {
          updated.operatingHours = calcAnnualHours(zc, systems, updated.serviceTargets as string[]);
        }

        const energy = calcEnergyConsumption(
          updated.ratedPower,
          updated.quantity,
          updated.operatingHours,
          updated.simultaneousCoeff,
          updated.unit,
        );
        updated.energyConsumption = energy;
        updated.operatingCost = calcOperatingCost(energy, getPriceByUnit(updated.unit, prices));

        list[pickerIdx] = updated;
        return list;
      });
      setPickerOpen(false);
    },
    [pickerIdx, onChangeOriginal],
  );

  const addOriginalRow = (benchmarkTechId: string) => {
    onChangeOriginal((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        benchmarkTechId,
        systemCategory: [] as string[],
        systemLargeClass: '',
        deviceType: '',
        deviceName: '',
        equipmentName: '',
        ratedPower: 0,
        unit: 'kW',
        quantity: 1,
        serviceTargets: [] as string[],
        operatingHours: 0,
        simultaneousCoeff: 0.8,
        energyConsumption: 0,
        operatingCost: 0,
      },
    ]);
  };

  // ── Original Columns (memoized) ──

  const openPicker = useCallback((idx: number) => {
    setPickerIdx(idx);
    setPickerOpen(true);
  }, []);

  const originalColumns = useMemo<ColumnsType<any>>(
    () => [
      {
        title: '作用系统',
        dataIndex: 'systemCategory',
        width: 170,
        onCell: () => ({
          style: { padding: '5px 12px', verticalAlign: 'middle', whiteSpace: 'normal' },
        }),
        render: (v: string[], record: any) => (
          <DelayedMultipleSelect
            value={v || []}
            onChange={(val: string[]) =>
              updateOriginalField(record._globalIdx, 'systemCategory', val)
            }
            options={ORIGINAL_SYSTEM_OPTIONS}
            size="small"
            style={{ width: '100%', minHeight: 30 }}
            variant="borderless"
            className="ra-select"
            placeholder="选择"
            getPopupContainer={() => document.body}
            tagRender={(props: any) => (
              <Tag
                closable
                onClose={(e) => {
                  e.stopPropagation();
                  props.onClose();
                }}
                closeIcon={<span style={{ color: '#1677ff' }}>×</span>}
                style={{
                  margin: 0,
                  fontSize: 11,
                  lineHeight: '20px',
                  padding: '0 4px 0 8px',
                  background: '#e6f4ff',
                  border: '1px solid #91caff',
                  color: '#1677ff',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {props.label}
              </Tag>
            )}
          />
        ),
      },
      {
        title: '系统 / 设备类型 / 主要设备 / 设备名称',
        dataIndex: 'systemLargeClass',
        width: 320,
        onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
        render: (_v: string, record: any) => {
          const hasNoData = (record.systemCategory || []).every(
            (s: string) => s === '科室用电（办公设备）' || s === '医疗设备系统',
          );
          const parts = [
            record.systemLargeClass,
            record.deviceType,
            record.deviceName,
            record.equipmentName,
          ].filter(Boolean);
          const display = parts.length > 0 ? parts.join(' / ') : '';
          return (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasNoData) openPicker(record._globalIdx);
              }}
              style={{
                cursor: hasNoData ? 'default' : 'pointer',
                minHeight: 22,
                padding: '2px 8px',
                borderRadius: 4,
                color: display ? '#1a1a1a' : '#bfbfbf',
                fontSize: 12,
                background: hasNoData ? '#f5f5f5' : '#fafafa',
                border: '1px solid #f0f0f0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {display || '点击选择设备'}
            </div>
          );
        },
      },
      {
        title: '能耗',
        dataIndex: 'ratedPower',
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right', whiteSpace: 'nowrap', padding: '4px 8px' } }),
        render: (v: number, record: any) => (
          <div onMouseDown={(e) => e.stopPropagation()}>
            <StableInputNumber
              value={v || undefined}
              onValueChange={(val) => updateOriginalField(record._globalIdx, 'ratedPower', val)}
              variant="borderless"
              size="small"
              min={0}
              step={1}
              precision={1}
              style={{ width: '100%' }}
              className="ra-input"
              placeholder="能耗"
            />
          </div>
        ),
      },
      {
        title: '能耗单位',
        dataIndex: 'unit',
        width: 70,
        onHeaderCell: () => ({ style: { textAlign: 'center' } }),
        onCell: () => ({
          style: { textAlign: 'center', whiteSpace: 'nowrap', padding: '4px 4px' },
        }),
        render: (v: string) => <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{v || '-'}</Text>,
      },
      {
        title: '台数',
        dataIndex: 'quantity',
        width: 70,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right', whiteSpace: 'nowrap', padding: '4px 8px' } }),
        render: (v: number, record: any) => (
          <div onMouseDown={(e) => e.stopPropagation()}>
            <StableInputNumber
              value={v}
              onValueChange={(val) => updateOriginalField(record._globalIdx, 'quantity', val)}
              variant="borderless"
              size="small"
              min={1}
              step={1}
              precision={0}
              style={{ width: '100%' }}
              className="ra-input"
            />
          </div>
        ),
      },
      {
        title: '服务对象',
        dataIndex: 'serviceTargets',
        onCell: () => ({
          style: { padding: '5px 8px', verticalAlign: 'middle', whiteSpace: 'normal' },
        }),
        render: (v: string[], record: any) => (
          <DelayedMultipleSelect
            value={v || []}
            onChange={(val: string[]) =>
              updateOriginalField(record._globalIdx, 'serviceTargets', val)
            }
            options={serviceTargetOptions}
            size="small"
            style={{ width: '100%', minHeight: 30 }}
            variant="borderless"
            className="ra-select"
            placeholder="选择"
            getPopupContainer={() => document.body}
            tagRender={(props: any) => (
              <Tag
                closable
                onClose={(e) => {
                  e.stopPropagation();
                  props.onClose();
                }}
                closeIcon={<span style={{ color: '#1677ff' }}>×</span>}
                style={{
                  margin: 0,
                  fontSize: 11,
                  lineHeight: '20px',
                  padding: '0 4px 0 8px',
                  background: '#e6f4ff',
                  border: '1px solid #91caff',
                  color: '#1677ff',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {props.label}
              </Tag>
            )}
          />
        ),
      },
      {
        title: '运行时间(h/年)',
        dataIndex: 'operatingHours',
        width: 110,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right', whiteSpace: 'nowrap', padding: '4px 8px' } }),
        render: (v: number, record: any) => (
          <div onMouseDown={(e) => e.stopPropagation()}>
            <StableInputNumber
              value={v || undefined}
              onValueChange={(val) => updateOriginalField(record._globalIdx, 'operatingHours', val)}
              variant="borderless"
              size="small"
              min={0}
              step={100}
              precision={0}
              style={{ width: '100%' }}
              className="ra-input"
            />
          </div>
        ),
      },
      {
        title: '同时使用系数',
        dataIndex: 'simultaneousCoeff',
        width: 90,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right', whiteSpace: 'nowrap', padding: '4px 8px' } }),
        render: (v: number, record: any) => (
          <div onMouseDown={(e) => e.stopPropagation()}>
            <StableInputNumber
              value={v}
              onValueChange={(val) =>
                updateOriginalField(record._globalIdx, 'simultaneousCoeff', val)
              }
              variant="borderless"
              size="small"
              min={0}
              max={1}
              step={0.05}
              precision={2}
              style={{ width: '100%' }}
              className="ra-input"
            />
          </div>
        ),
      },
      {
        title: '运行能耗(万kWh/年)',
        dataIndex: 'energyConsumption',
        width: 130,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right', whiteSpace: 'nowrap' } }),
        render: (v: number) => (
          <Text
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: 12,
              color: '#1677ff',
              fontWeight: 500,
            }}
          >
            {v > 0 ? v.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: '运行费用(万元/年)',
        dataIndex: 'operatingCost',
        width: 120,
        onHeaderCell: () => ({ style: { textAlign: 'right' } }),
        onCell: () => ({ style: { textAlign: 'right', whiteSpace: 'nowrap' } }),
        render: (v: number) => (
          <Text
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: 12,
              color: '#1677ff',
              fontWeight: 500,
            }}
          >
            {v > 0 ? v.toFixed(2) : '-'}
          </Text>
        ),
      },
    ],
    [updateOriginalField, openPicker],
  );

  // ── Render ──

  const tableComponents = {
    header: {
      cell: (props: any) => {
        const colStyle = { ...(props.style || {}) };
        if (!colStyle.textAlign) colStyle.textAlign = 'left';
        return (
          <th
            {...props}
            style={{
              background: '#f0f2f5',
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: 'nowrap',
              padding: '8px 12px',
              verticalAlign: 'middle',
              ...colStyle,
            }}
          />
        );
      },
    },
    body: {
      cell: (props: any) => {
        const colStyle = { ...(props.style || {}) };
        if (!colStyle.textAlign) colStyle.textAlign = 'left';
        return (
          <td
            {...props}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              verticalAlign: 'middle',
              ...colStyle,
            }}
          />
        );
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .ra-input { width: 100% !important; }
        .ra-input .ant-input-number { width: 100% !important; }
        .ra-input .ant-input-number-input { text-align: right !important; width: 100% !important; padding-left: 4px !important; padding-right: 4px !important; }
        .ra-input .ant-input-number-handler-wrap { display: none !important; }
        .ra-select .ant-select-selector { padding: 3px 28px 3px 4px !important; font-size: 12px !important; }
        .ra-select .ant-select-selection-overflow { flex-wrap: wrap !important; gap: 1px 2px !important; align-self: stretch !important; align-items: center !important; align-content: center !important; }
        .ra-select { font-size: 12px !important; }
        .ra-select .ant-select-selection-overflow-item { flex: none !important; }
        .ra-select .ant-select-selection-overflow-item-suffix { flex: none !important; }
        .origin-eq-select-dropdown { min-width: 220px !important; }
        .origin-eq-select-dropdown .ant-select-item { padding: 5px 12px !important; font-size: 13px !important; }
      `}</style>
      {techGroups.length === 0 && dependentGroups.length === 0 ? (
        <Card
          size="small"
          style={{ border: '1px solid #e8ecf0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
            暂无主要设备数据，请在 Step 3 中为技术标记主要设备
          </div>
        </Card>
      ) : (
        techGroups.map((group) => {
          const collapsed = collapsedTechs.has(group.techId);
          const originalIndices = originalEquipments
            .map((o, i) => (o.benchmarkTechId === group.techId ? i : -1))
            .filter((i) => i !== -1);
          const originalTableData = originalIndices.map((globalIdx) => ({
            ...originalEquipments[globalIdx],
            _globalIdx: globalIdx,
          }));

          return (
            <Card
              key={group.techId}
              size="small"
              styles={{
                header: {
                  padding: '12px 20px',
                  minHeight: 0,
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: '#f0f5ff',
                  borderBottom: collapsed ? 'none' : '1px solid #e8ecf0',
                },
                body: collapsed ? { display: 'none', padding: 0 } : { padding: '16px 20px' },
              }}
              title={
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  onClick={() => toggleCollapse(group.techId)}
                >
                  {collapsed ? (
                    <RightOutlined style={{ color: '#8c8c8c', fontSize: 11 }} />
                  ) : (
                    <DownOutlined style={{ color: '#8c8c8c', fontSize: 11 }} />
                  )}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#52c41a',
                      flexShrink: 0,
                      boxShadow: '0 0 0 3px rgba(82,196,26,0.15)',
                    }}
                  />
                  <Text strong style={{ fontSize: 14, color: '#1a1a1a' }}>
                    {group.techName}
                  </Text>
                  <Tag color="green" style={{ fontSize: 11, marginLeft: 0, lineHeight: '20px' }}>
                    节能方案
                  </Tag>
                  {collapsed && (
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {group.mainEquipments.length} 个主要设备
                    </Text>
                  )}
                </div>
              }
            >
              {/* ── Saving Plan Title ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 18,
                    borderRadius: 2,
                    background: '#52c41a',
                    flexShrink: 0,
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>节能方案</Text>
              </div>

              {/* ── Saving Plan Table ── */}
              <Table
                rowKey="id"
                dataSource={group.mainEquipments.map((eq) => {
                  const saved = group.savedEquipments.find((s) => s.id === eq.id);
                  const ratedPower = saved?.ratedPower ?? eq.powerKw ?? 0;
                  const unit = saved?.unit ?? eq.powerUnit ?? 'kW';
                  const quantity = saved?.quantity ?? eq.quantity ?? 1;
                  const energyConsumption = saved?.energyConsumption ?? 0;
                  const operatingCost = saved?.operatingCost ?? 0;
                  return {
                    id: eq.id,
                    techId: group.techId,
                    equipmentName: eq.name,
                    systems: saved?.systems ?? [],
                    ratedPower,
                    unit,
                    quantity,
                    serviceTargets: saved?.serviceTargets ?? [],
                    operatingHours: saved?.operatingHours ?? 0,
                    simultaneousCoeff:
                      saved?.simultaneousCoeff ?? getSimultaneousCoeff(saved?.systems ?? []),
                    energyConsumption,
                    operatingCost,
                  };
                })}
                columns={savingColumns}
                pagination={false}
                size="small"
                tableLayout="auto"
                scroll={{ x: 'max-content' }}
                bordered
                components={tableComponents}
                summary={() => {
                  const totalEnergy = group.savedEquipments.reduce(
                    (s, r) => s + (r.energyConsumption ?? 0),
                    0,
                  );
                  const totalCost = group.savedEquipments.reduce(
                    (s, r) => s + (r.operatingCost ?? 0),
                    0,
                  );
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={6} align="right">
                          <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959' }}>
                            节能方案小计
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="right">
                          <Text style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                            -
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7} align="right" />
                        <Table.Summary.Cell index={8} align="right">
                          <Text
                            style={{
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: 12,
                              color: '#1677ff',
                              fontWeight: 600,
                            }}
                          >
                            {totalEnergy > 0 ? totalEnergy.toFixed(2) : '-'}
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9} align="right">
                          <Text
                            style={{
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: 12,
                              color: '#1677ff',
                              fontWeight: 600,
                            }}
                          >
                            {totalCost > 0 ? totalCost.toFixed(2) : '-'}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />

              {/* ── Divider ── */}
              <div style={{ margin: '16px 0', borderTop: '1px dashed #d9d9d9' }} />

              {/* ── Original Section ── */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 4,
                        height: 18,
                        borderRadius: 2,
                        background: '#fa8c16',
                        flexShrink: 0,
                      }}
                    />
                    <Text style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                      原方案/现有系统
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>对标：{group.techName}</Text>
                  </div>
                  <Space size={4}>
                    <Button
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => addOriginalRow(group.techId)}
                      style={{ fontSize: 12 }}
                    >
                      新增
                    </Button>
                    <Button
                      type="dashed"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={
                        !originalTableData.some((d) => selectedOriginalIds.has(d.id))
                      }
                      onClick={() => {
                        // 只删除当前技术 Card 里选中的行，保留其他技术的勾选
                        const currentIds = originalTableData
                          .filter((d) => selectedOriginalIds.has(d.id))
                          .map((d) => d.id);
                        if (currentIds.length === 0) return;
                        const currentIdSet = new Set(currentIds);
                        const filtered = originalEquipments.filter(
                          (o) => !currentIdSet.has(o.id),
                        );
                        onChangeOriginal(filtered);
                        setSelectedOriginalIds((prev) => {
                          const next = new Set(prev);
                          currentIds.forEach((id) => next.delete(id));
                          return next;
                        });
                      }}
                      style={{ fontSize: 12 }}
                    >
                      删除
                    </Button>
                  </Space>
                </div>

                {originalTableData.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 0',
                      textAlign: 'center',
                      color: '#bfbfbf',
                      fontSize: 13,
                      border: '1px dashed #d9d9d9',
                      borderRadius: 6,
                      background: '#fafafa',
                    }}
                  >
                    暂无原方案设备数据，点击「新增」添加
                  </div>
                ) : (
                  <Table
                    rowKey="id"
                    dataSource={originalTableData}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                    scroll={{ x: 1360 }}
                    bordered
                    components={tableComponents}
                    rowSelection={{
                      selectedRowKeys: Array.from(selectedOriginalIds).filter((id) =>
                        originalTableData.some((d) => d.id === id),
                      ),
                      onSelect: (record) => {
                        setSelectedOriginalIds((prev) => {
                          const next = new Set(prev);
                          next.has(record.id) ? next.delete(record.id) : next.add(record.id);
                          return next;
                        });
                      },
                      onSelectAll: (selected) => {
                        // 基于 prev 增删当前技术的行，保留其他技术的勾选状态
                        setSelectedOriginalIds((prev) => {
                          const next = new Set(prev);
                          const currentIds = originalTableData.map((d) => d.id);
                          if (selected) {
                            currentIds.forEach((id) => next.add(id));
                          } else {
                            currentIds.forEach((id) => next.delete(id));
                          }
                          return next;
                        });
                      },
                    }}
                    columns={originalColumns}
                  />
                )}
                {/* ── 原方案小计 ── */}
                {originalTableData.length > 0 &&
                  (() => {
                    const totalEnergy = originalTableData.reduce(
                      (s, r) => s + (r.energyConsumption || 0),
                      0,
                    );
                    const totalCost = originalTableData.reduce(
                      (s, r) => s + (r.operatingCost || 0),
                      0,
                    );
                    return (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 40,
                          marginTop: 8,
                          padding: '8px 16px',
                          background: '#fffbe6',
                          borderRadius: 6,
                          border: '1px solid #ffe58f',
                        }}
                      >
                        <div>
                          <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                            原方案小计 · 运行能耗
                          </Text>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: '#fa8c16',
                              marginLeft: 8,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {totalEnergy > 0 ? totalEnergy.toFixed(2) : '-'}
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 400,
                                color: '#8c8c8c',
                                marginLeft: 4,
                              }}
                            >
                              万kWh/年
                            </span>
                          </span>
                        </div>
                        <div>
                          <Text style={{ fontSize: 12, color: '#8c8c8c' }}>运行费用</Text>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: '#fa8c16',
                              marginLeft: 8,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {totalCost > 0 ? totalCost.toFixed(2) : '-'}
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 400,
                                color: '#8c8c8c',
                                marginLeft: 4,
                              }}
                            >
                              万元/年
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </Card>
          );
        })
      )}

      {dependentGroups.map((dep) => (
        <Card
          key={dep.techId}
          size="small"
          styles={{
            header: {
              padding: '12px 20px',
              minHeight: 0,
              background: '#f0f5ff',
              borderBottom: '1px solid #e8ecf0',
            },
            body: { padding: '20px' },
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#722ed1',
                  flexShrink: 0,
                  boxShadow: '0 0 0 3px rgba(114,46,209,0.15)',
                }}
              />
              <Text strong style={{ fontSize: 14, color: '#1a1a1a' }}>
                {dep.techName}
              </Text>
              <Tag color="purple" style={{ fontSize: 11, marginLeft: 0, lineHeight: '20px' }}>
                附属技术
              </Tag>
            </div>
          }
        >
          <div
            style={{
              padding: '20px',
              background: '#fff',
              borderRadius: 4,
              textAlign: 'center',
              color: '#595959',
              fontSize: 13,
              lineHeight: 1.8,
            }}
          >
            此项为附属技术，节能计算挂载到主设备上完成，无需单独填写节能方案/原方案。
          </div>
        </Card>
      ))}

      {/* ── Global Summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card
          size="small"
          styles={{ body: { padding: '16px 20px' } }}
          style={{ border: '1px solid #e8ecf0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 4, height: 16, borderRadius: 2, background: '#52c41a' }} />
              <Text strong style={{ fontSize: 14, color: '#1a1a1a' }}>
                节能方案合计
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <div>
                <Text style={{ fontSize: 12, color: '#8c8c8c' }}>运行能耗</Text>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1677ff',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.3,
                  }}
                >
                  {globalTotals.savingEnergy > 0 ? globalTotals.savingEnergy.toFixed(2) : '-'}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#8c8c8c', marginLeft: 6 }}>
                    万kWh/年
                  </span>
                </div>
              </div>
              <div>
                <Text style={{ fontSize: 12, color: '#8c8c8c' }}>运行费用</Text>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1677ff',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.3,
                  }}
                >
                  {globalTotals.savingCost > 0 ? globalTotals.savingCost.toFixed(2) : '-'}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#8c8c8c', marginLeft: 6 }}>
                    万元/年
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card
          size="small"
          styles={{ body: { padding: '16px 20px' } }}
          style={{ border: '1px solid #e8ecf0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 4, height: 16, borderRadius: 2, background: '#fa8c16' }} />
              <Text strong style={{ fontSize: 14, color: '#1a1a1a' }}>
                原方案合计
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <div>
                <Text style={{ fontSize: 12, color: '#8c8c8c' }}>运行能耗</Text>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#fa8c16',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.3,
                  }}
                >
                  {globalTotals.originalEnergy > 0 ? globalTotals.originalEnergy.toFixed(2) : '-'}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#8c8c8c', marginLeft: 6 }}>
                    万kWh/年
                  </span>
                </div>
              </div>
              <div>
                <Text style={{ fontSize: 12, color: '#8c8c8c' }}>运行费用</Text>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#fa8c16',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.3,
                  }}
                >
                  {globalTotals.originalCost > 0 ? globalTotals.originalCost.toFixed(2) : '-'}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#8c8c8c', marginLeft: 6 }}>
                    万元/年
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <EquipmentPickerModal
        open={pickerOpen}
        selectedSystems={
          pickerIdx >= 0 ? (originalEquipments[pickerIdx]?.systemCategory ?? []) : []
        }
        onCancel={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
      />
    </div>
  );
}
