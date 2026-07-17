import { useState } from 'react';
import { Tabs, DatePicker, TimePicker, Typography, Segmented, ConfigProvider, Card, InputNumber, Checkbox } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { TimePeriodConfig, ZoneConfig } from '@/shared/stores/projectStore';

const { Text } = Typography;

// ── Constants ──────────────────────────────────────────────────────────

const ZONES = [
  { key: '门诊', label: '门诊', color: '#1677ff' },
  { key: '急诊', label: '急诊', color: '#eb2f2f' },
  { key: '医技', label: '医技', color: '#2f54eb' },
  { key: '病房和感染', label: '病房和感染', color: '#722ed1' },
  { key: '行政后勤', label: '行政后勤', color: '#13c2c2' },
  { key: '教学科研', label: '教学科研', color: '#fa8c16' },
  { key: '健康管理', label: '健康管理', color: '#52c41a' },
] as const;

const PERIOD_SEGMENTS = [
  { key: 'coolingPeriod', label: '制冷运行时间段' },
  { key: 'heatingPeriod', label: '供暖运行时间段' },
  { key: 'lightingPeriod', label: '照明运行时间段' },
  { key: 'hotWaterPeriod', label: '生活热水运行时间段' },
] as const;

const COEFF_OPTIONS = [
  { value: 0.0, label: '0.0' },
  { value: 0.2, label: '0.2' },
  { value: 0.4, label: '0.4' },
  { value: 0.6, label: '0.6' },
  { value: 0.8, label: '0.8' },
  { value: 1.0, label: '1.0' },
] as const;

// ── Props ──────────────────────────────────────────────────────────────

interface Props {
  zoneConfigs: Record<string, ZoneConfig>;
  onChange: (zoneConfigs: Record<string, ZoneConfig>) => void;
}

// ── Grid column widths ─────────────────────────────────────────────────
// ── Grid column widths ─────────────────────────────────────────────────
// 上表格（时段参数）：checkbox + zone + dateRange + runTime + coeff
const GRID_COLUMNS_TOP = '44px 90px 260px 200px 196px';
// 下表格（建筑面积）：zone(对齐上表格) + area(撑满剩余)
const GRID_COLUMNS_BOTTOM = '90px 1fr';
const GAP = 6;

// ── Component ──────────────────────────────────────────────────────────

export default function StepConditionSetting({ zoneConfigs, onChange }: Props) {
  const [activePeriod, setActivePeriod] = useState('coolingPeriod');

  const updateZonePeriod = (zoneKey: string, periodKey: string, patch: Partial<TimePeriodConfig>) => {
    const current = zoneConfigs[zoneKey]?.[periodKey as keyof ZoneConfig] as TimePeriodConfig;
    const updated = {
      ...zoneConfigs,
      [zoneKey]: {
        ...zoneConfigs[zoneKey],
        [periodKey]: { ...current, ...patch },
      },
    };
    onChange(updated);
  };

  const updateZoneArea = (zoneKey: string, buildingArea: number | null) => {
    const updated = {
      ...zoneConfigs,
      [zoneKey]: {
        ...zoneConfigs[zoneKey],
        buildingArea: buildingArea ?? undefined,
      },
    };
    onChange(updated);
  };

  const updateZoneEnabled = (zoneKey: string, enabled: boolean) => {
    const updated = {
      ...zoneConfigs,
      [zoneKey]: {
        ...zoneConfigs[zoneKey],
        enabled,
      },
    };
    onChange(updated);
  };

  const allEnabled = ZONES.every((z) => zoneConfigs[z.key]?.enabled !== false);
  const someEnabled = ZONES.some((z) => zoneConfigs[z.key]?.enabled !== false);
  const toggleAll = (checked: boolean) => {
    const updated = Object.fromEntries(
      ZONES.map((z) => [z.key, { ...zoneConfigs[z.key], enabled: checked }])
    );
    onChange(updated);
  };

  const rowStyleTop: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS_TOP,
    gap: GAP,
    alignItems: 'center',
    padding: '0 8px',
    background: '#fff',
    border: '1px solid #e8ecf0',
    borderRadius: 0,
    transition: 'all 0.15s',
    overflow: 'hidden',
    height: 36,
  };

  const rowStyleBottom: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS_BOTTOM,
    gap: GAP,
    alignItems: 'center',
    padding: '0 8px',
    background: '#fff',
    border: '1px solid #e8ecf0',
    borderRadius: 0,
    transition: 'all 0.15s',
    overflow: 'hidden',
    height: 36,
  };

  const headerStyleTop: React.CSSProperties = {
    ...rowStyleTop,
    background: '#fafafa',
    border: '1px solid #f0f0f0',
  };

  const headerStyleBottom: React.CSSProperties = {
    ...rowStyleBottom,
    background: '#fafafa',
    border: '1px solid #f0f0f0',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部提示 */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f5ff, #e6f4ff)',
        borderRadius: 8, padding: '10px 16px',
        border: '1px solid #d6e4ff',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 14 }} />
        <Text style={{ fontSize: 12, color: '#595959' }}>
          公休系数，是指周末和国家法定节假日，按照医院的经营情况进行排班，值班时间所占公休时间的大概比值，系统默认为0。
        </Text>
      </div>

      {/* 左右并排布局 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

        {/* 左卡片：时段参数 */}
        <Card
          size="small"
          style={{ flex: 1, borderRadius: '8px 0 0 8px', border: '1px solid #e8ecf0' }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: '4px 16px 0' }}>
            <Tabs
              activeKey={activePeriod}
              onChange={setActivePeriod}
              type="card"
              items={PERIOD_SEGMENTS.map((period) => ({
                key: period.key,
                label: <span style={{ fontSize: 13 }}>{period.label}</span>,
                children: (
                  <div style={{ height: 'calc(36px * 7 + 7 * 6px + 16px + 36px)', overflow: 'auto' }}>
                    {/* 表头 */}
                    <div style={headerStyleTop}>
                      {/* 全选 / checkbox 列 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Checkbox
                          checked={allEnabled}
                          indeterminate={someEnabled && !allEnabled}
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      </div>
                      <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>区域</Text>
                      <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>日期范围</Text>
                      <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>运行时间</Text>
                      <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600, textAlign: 'center' }}>公休系数</Text>
                    </div>

                    {/* 数据行 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {ZONES.map((zone) => {
                        const config = zoneConfigs[zone.key]?.[period.key as keyof ZoneConfig] as TimePeriodConfig | undefined;
                        const zoneConfig = zoneConfigs[zone.key];
                        if (!config) return null;

                        return (
                          <div
                            key={zone.key}
                            style={{
                              ...rowStyleTop,
                              opacity: zoneConfig?.enabled === false ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.borderColor = '#d6e4ff';
                              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(22,119,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.borderColor = '#e8ecf0';
                              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            }}
                          >
                            {/* 多选框 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Checkbox
                                checked={zoneConfig?.enabled !== false}
                                onChange={(e) => updateZoneEnabled(zone.key, e.target.checked)}
                              />
                            </div>

                            {/* 区域名称 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: 5,
                                background: zone.color, color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, flexShrink: 0,
                              }}>
                                {zone.key.charAt(0)}
                              </div>
                              <Text strong style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{zone.key}</Text>
                            </div>

                            {/* 日期范围 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <DatePicker
                                value={config.startDate ? dayjs(config.startDate) : null}
                                onChange={(d: Dayjs | null) => {
                                  if (d) updateZonePeriod(zone.key, period.key, { startDate: d.format('YYYY-MM-DD') });
                                }}
                                format="YYYY年M月D日"
                                size="small"
                                style={{ width: '52%', minWidth: 96 }}
                                variant="filled"
                                allowClear={false}
                                suffixIcon={null}
                              />
                              <span style={{ color: '#d9d9d9', fontSize: 13, lineHeight: '22px', userSelect: 'none', flexShrink: 0 }}>~</span>
                              <DatePicker
                                value={config.endDate ? dayjs(config.endDate) : null}
                                onChange={(d: Dayjs | null) => {
                                  if (d) updateZonePeriod(zone.key, period.key, { endDate: d.format('YYYY-MM-DD') });
                                }}
                                format="YYYY年M月D日"
                                size="small"
                                style={{ width: '52%', minWidth: 96 }}
                                variant="filled"
                                allowClear={false}
                                suffixIcon={null}
                              />
                            </div>

                            {/* 运行时间 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <TimePicker
                                value={dayjs().hour(config.startHour).minute(config.startMinute).second(0)}
                                onChange={(t) => {
                                  if (!t) return;
                                  updateZonePeriod(zone.key, period.key, { startHour: t.hour(), startMinute: t.minute() });
                                }}
                                format="HH:mm"
                                size="small"
                                style={{ width: '46%', minWidth: 52 }}
                                variant="filled"
                                needConfirm={false}
                                minuteStep={5}
                                suffixIcon={null}
                              />
                              <span style={{ color: '#d9d9d9', fontSize: 13, lineHeight: '22px', userSelect: 'none', flexShrink: 0 }}>~</span>
                              <TimePicker
                                value={config.endHour === 24 && config.endMinute === 0
                                  ? dayjs().hour(0).minute(0).second(0)
                                  : dayjs().hour(config.endHour).minute(config.endMinute).second(0)}
                                onChange={(t) => {
                                  if (!t) return;
                                  const h = t.hour();
                                  const m = t.minute();
                                  const isMidnight = h === 0 && m === 0;
                                  updateZonePeriod(zone.key, period.key, {
                                    endHour: isMidnight ? 24 : h,
                                    endMinute: m,
                                  });
                                }}
                                format="HH:mm"
                                size="small"
                                style={{ width: '46%', minWidth: 52 }}
                                variant="filled"
                                needConfirm={false}
                                minuteStep={5}
                                suffixIcon={null}
                              />
                            </div>

                            {/* 公休系数 */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <ConfigProvider
                                theme={{
                                  components: {
                                    Segmented: {
                                      itemSelectedBg: '#2b87c9',
                                      itemSelectedColor: '#fff',
                                    },
                                  },
                                }}
                              >
                                <Segmented
                                  value={config.publicHolidayCoeff}
                                  onChange={(val) => updateZonePeriod(zone.key, period.key, { publicHolidayCoeff: val as number })}
                                  options={COEFF_OPTIONS.map((o) => ({
                                    value: o.value,
                                    label: o.label,
                                  }))}
                                  size="small"
                                  style={{ background: '#f0f2f5' }}
                                />
                              </ConfigProvider>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </Card>

        {/* 右卡片：建筑面积 */}
        <Card
          size="small"
          title={<span style={{ fontSize: 13, fontWeight: 600 }}>建筑面积</span>}
          style={{ flex: '0 0 280px', borderRadius: '0 8px 8px 0', border: '1px solid #e8ecf0' }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ height: 'calc(36px * 7 + 7 * 6px + 16px + 36px)', overflow: 'auto', padding: '8px 16px' }}>
            {/* 表头 */}
            <div style={headerStyleBottom}>
              <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>区域</Text>
              <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>建筑面积（㎡）</Text>
            </div>
            {/* 数据行 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {ZONES.map((zone) => {
                const zoneConfig = zoneConfigs[zone.key];
                return (
                  <div
                    key={zone.key}
                    style={{
                      ...rowStyleBottom,
                      opacity: zoneConfig?.enabled === false ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#d6e4ff';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(22,119,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#e8ecf0';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* 区域名称 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 5,
                        background: zone.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>
                        {zone.key.charAt(0)}
                      </div>
                      <Text strong style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{zone.key}</Text>
                    </div>
                    {/* 面积输入 */}
                    <InputNumber
                      value={zoneConfig?.buildingArea}
                      onChange={(val) => updateZoneArea(zone.key, val)}
                      min={0}
                      placeholder="填写面积"
                      size="small"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
