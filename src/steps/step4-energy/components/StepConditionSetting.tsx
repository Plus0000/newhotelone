import { useState } from 'react';
import { Tabs, DatePicker, TimePicker, Typography, Segmented, ConfigProvider, Card } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { TimePeriodConfig, ZoneConfig } from '@/shared/stores/projectStore';

const { Text } = Typography;

// ── Constants ──────────────────────────────────────────────────────────

const ZONES = [
  { key: '门诊', label: '门诊', color: '#1677ff' },
  { key: '医技', label: '医技', color: '#2f54eb' },
  { key: '病房', label: '病房', color: '#722ed1' },
  { key: '急诊', label: '急诊', color: '#eb2f2f' },
  { key: '行政', label: '行政', color: '#13c2c2' },
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

// ── Styles ─────────────────────────────────────────────────────────────

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '64px 1fr 1fr 1fr',
  gap: 8,
  alignItems: 'center',
  padding: '8px 16px',
  background: '#fff',
  border: '1px solid #e8ecf0',
  borderRadius: 8,
  transition: 'all 0.15s',
};

const headerStyle: React.CSSProperties = {
  ...rowStyle,
  background: '#fafafa',
  padding: '6px 16px',
  border: '1px solid #f0f0f0',
};

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

      {/* 时段类型切换 — Tabs type="card" 与 Step 3 编辑保持一致 */}
      <Card
        size="small"
        style={{ border: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '4px 16px 16px' }}
      >
        <Tabs
          activeKey={activePeriod}
          onChange={setActivePeriod}
          type="card"
          items={PERIOD_SEGMENTS.map((period) => ({
            key: period.key,
            label: <span style={{ fontSize: 13 }}>{period.label}</span>,
            children: (
              <div style={{ padding: '0 16px' }}>
                {/* 表头 */}
                <div style={headerStyle}>
                  <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>区域</Text>
                  <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>日期范围</Text>
                  <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>运行时间</Text>
                  <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600, textAlign: 'center' }}>公休系数</Text>
                </div>

                {/* 数据行 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {ZONES.map((zone) => {
                    const config = zoneConfigs[zone.key]?.[period.key as keyof ZoneConfig] as TimePeriodConfig | undefined;
                    if (!config) return null;

                    return (
                      <div
                        key={zone.key}
                        style={rowStyle}
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
                          <Text strong style={{ fontSize: 12 }}>{zone.key}</Text>
                        </div>

                        {/* 日期范围 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <DatePicker
                            value={config.startDate ? dayjs(config.startDate) : null}
                            onChange={(d: Dayjs | null) => {
                              if (d) updateZonePeriod(zone.key, period.key, { startDate: d.format('YYYY-MM-DD') });
                            }}
                            format="YYYY年M月D日"
                            size="small"
                            style={{ width: '45%', minWidth: 100 }}
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
                            style={{ width: '45%', minWidth: 100 }}
                            variant="filled"
                            allowClear={false}
                            suffixIcon={null}
                          />
                        </div>

                        {/* 运行时间 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <TimePicker
                            value={dayjs().hour(config.startHour).minute(config.startMinute).second(0)}
                            onChange={(t) => {
                              if (!t) return;
                              updateZonePeriod(zone.key, period.key, { startHour: t.hour(), startMinute: t.minute() });
                            }}
                            format="HH:mm"
                            size="small"
                            style={{ width: '42%', minWidth: 68 }}
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
                              // 00:00 = 全天运行到午夜，存为 endHour=24
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
                            style={{ width: '42%', minWidth: 68 }}
                            variant="filled"
                            needConfirm={false}
                            minuteStep={5}
                            suffixIcon={null}
                          />
                        </div>

                        {/* 公休系数 — 6档选择 */}
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
      </Card>
    </div>
  );
}
