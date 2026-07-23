import { useState } from 'react';
import {
  Tabs,
  DatePicker,
  TimePicker,
  Typography,
  Segmented,
  ConfigProvider,
  Card,
  InputNumber,
  Checkbox,
  message,
} from 'antd';
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
// 44(checkbox) + 90(zone) + 300(date) + 180(run) + 24(spacer) + 196(coeff) + 44(spacer) + 140(area)
const GRID_COLUMNS = '44px 90px 300px 180px 24px 196px 44px 140px';
const GAP = 6;

// ── Component ──────────────────────────────────────────────────────────

export default function StepConditionSetting({ zoneConfigs, onChange }: Props) {
  const [activePeriod, setActivePeriod] = useState('coolingPeriod');

  const updateZonePeriod = (
    zoneKey: string,
    periodKey: string,
    patch: Partial<TimePeriodConfig>,
  ) => {
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
      ZONES.map((z) => [z.key, { ...zoneConfigs[z.key], enabled: checked }]),
    );
    onChange(updated);
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS,
    gap: GAP,
    alignItems: 'center',
    padding: '8px 8px',
    background: '#fff',
    border: '1px solid #e8ecf0',
    borderRadius: 8,
    transition: 'all 0.15s',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    ...rowStyle,
    background: '#fafafa',
    border: '1px solid #f0f0f0',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部提示 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0f5ff, #e6f4ff)',
          borderRadius: 8,
          padding: '10px 16px',
          border: '1px solid #d6e4ff',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <InfoCircleOutlined
            style={{ color: '#1677ff', fontSize: 14, flexShrink: 0, marginTop: 2 }}
          />
          <Text style={{ fontSize: 12, color: '#595959' }}>
            <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>公休系数：</Text>
            是指周末和国家法定节假日，按照医院的经营情况进行排班，值班时间所占公休时间的大概比值，系统默认为0。
          </Text>
        </div>
        <Text style={{ fontSize: 12, color: '#595959', paddingLeft: 22 }}>
          <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>建筑面积：</Text>
          请按照院区医疗区域组成和机电系统实际运行情况，填写各区域建筑面积运行时间。
        </Text>
      </div>

      {/* 时段类型切换 */}
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
              <div style={{ padding: '0 8px' }}>
                {/* 表头 */}
                <div style={headerStyle}>
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
                  <div />
                  {/* 间隔列 - 运行时间与公休系数间距 */}
                  <Text
                    style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600, textAlign: 'center' }}
                  >
                    公休系数
                  </Text>
                  <div />
                  {/* 间隔列 - 拉开建筑面积与公休系数的间距 */}
                  <div
                    style={{
                      background: '#f6faff',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 10,
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#1677ff',
                        display: 'inline-block',
                      }}
                    />
                    <Text style={{ fontSize: 11, color: '#1677ff', fontWeight: 600 }}>
                      建筑面积
                    </Text>
                  </div>
                </div>

                {/* 数据行 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {ZONES.map((zone) => {
                    const config = zoneConfigs[zone.key]?.[period.key as keyof ZoneConfig] as
                      | TimePeriodConfig
                      | undefined;
                    const zoneConfig = zoneConfigs[zone.key];
                    if (!config) return null;

                    return (
                      <div
                        key={zone.key}
                        style={{
                          ...rowStyle,
                          opacity: zoneConfig?.enabled === false ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#d6e4ff';
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            '0 1px 4px rgba(22,119,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#e8ecf0';
                          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                      >
                        {/* 多选框 */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Checkbox
                            checked={zoneConfig?.enabled !== false}
                            onChange={(e) => updateZoneEnabled(zone.key, e.target.checked)}
                          />
                        </div>

                        {/* 区域名称 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 5,
                              background: zone.color,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {zone.key.charAt(0)}
                          </div>
                          <Text strong style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                            {zone.key}
                          </Text>
                        </div>

                        {/* 日期范围 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <DatePicker
                            value={config.startDate ? dayjs(config.startDate) : null}
                            onChange={(d: Dayjs | null) => {
                              if (!d) return;
                              const newStart = d.format('YYYY-MM-DD');
                              if (config.endDate && dayjs(newStart).isAfter(config.endDate)) {
                                message.warning('开始日期不能晚于结束日期');
                                return;
                              }
                              updateZonePeriod(zone.key, period.key, { startDate: newStart });
                            }}
                            format="YYYY年M月D日"
                            style={{ width: '46%', minWidth: 105 }}
                            variant="filled"
                            allowClear={false}
                            suffixIcon={null}
                          />
                          <span
                            style={{
                              color: '#d9d9d9',
                              fontSize: 13,
                              lineHeight: '22px',
                              userSelect: 'none',
                              flexShrink: 0,
                            }}
                          >
                            ~
                          </span>
                          <DatePicker
                            value={config.endDate ? dayjs(config.endDate) : null}
                            onChange={(d: Dayjs | null) => {
                              if (!d) return;
                              const newEnd = d.format('YYYY-MM-DD');
                              if (config.startDate && dayjs(newEnd).isBefore(config.startDate)) {
                                message.warning('结束日期不能早于开始日期');
                                return;
                              }
                              updateZonePeriod(zone.key, period.key, { endDate: newEnd });
                            }}
                            format="YYYY年M月D日"
                            style={{ width: '46%', minWidth: 105 }}
                            variant="filled"
                            allowClear={false}
                            suffixIcon={null}
                          />
                        </div>

                        {/* 运行时间 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <TimePicker
                            value={dayjs()
                              .hour(config.startHour)
                              .minute(config.startMinute)
                              .second(0)}
                            onChange={(t) => {
                              if (!t) return;
                              updateZonePeriod(zone.key, period.key, {
                                startHour: t.hour(),
                                startMinute: t.minute(),
                              });
                            }}
                            format="HH:mm"
                            style={{ width: '42%', minWidth: 60 }}
                            variant="filled"
                            needConfirm={false}
                            minuteStep={5}
                            suffixIcon={null}
                          />
                          <span
                            style={{
                              color: '#d9d9d9',
                              fontSize: 13,
                              lineHeight: '22px',
                              userSelect: 'none',
                              flexShrink: 0,
                            }}
                          >
                            ~
                          </span>
                          <TimePicker
                            value={
                              config.endHour === 24 && config.endMinute === 0
                                ? dayjs().hour(0).minute(0).second(0)
                                : dayjs().hour(config.endHour).minute(config.endMinute).second(0)
                            }
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
                            style={{ width: '42%', minWidth: 60 }}
                            variant="filled"
                            needConfirm={false}
                            minuteStep={5}
                            suffixIcon={null}
                          />
                        </div>

                        <div />
                        {/* 间隔列 - 运行时间与公休系数间距 */}

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
                              onChange={(val) =>
                                updateZonePeriod(zone.key, period.key, {
                                  publicHolidayCoeff: val as number,
                                })
                              }
                              options={COEFF_OPTIONS.map((o) => ({
                                value: o.value,
                                label: o.label,
                              }))}
                              style={{ background: '#f0f2f5' }}
                            />
                          </ConfigProvider>
                        </div>

                        <div />
                        {/* 间隔列 - 拉开建筑面积与公休系数的间距 */}

                        {/* 面积输入 - 浅蓝渐变底 */}
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #f0f5ff, #e6f4ff)',
                            borderRadius: 6,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: 8,
                            paddingRight: 8,
                            opacity: zoneConfig?.enabled === false ? 0.5 : 1,
                          }}
                        >
                          <InputNumber
                            value={zoneConfig?.buildingArea}
                            onChange={(val) => updateZoneArea(zone.key, val)}
                            min={0}
                            placeholder="面积"
                            style={{ width: '100%', background: 'transparent' }}
                            variant="borderless"
                            disabled={zoneConfig?.enabled === false}
                          />
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
