import { useState, useMemo, useEffect } from 'react';
import { Modal, Table, Empty, Button, Typography, Row, Col, Select, Space } from 'antd';
import type { TechEntry } from '@/data/materials';
import {
  CATEGORY_LABELS,
  calcComprehensiveRate,
  calcDimensionRates,
  calcOriginalEnergyByDimension,
  calcCoalCarbon,
  type DimensionEnergy,
} from '../constants';
import { hasEnergyQuota } from '@/data/energyQuota';
import { getEnergyConversion } from '@/data/energyConversion';
import { normalizeProvince } from '@/data/electricityCarbonFactor';
import { StableInputNumber } from '@/shared/components/StableInputNumber';

const { Title } = Typography;

interface Props {
  open: boolean;
  selectedTechs: TechEntry[];
  onClose: () => void;
  onConfirm?: () => void;
  climateZone: string;
  hvacYear: number;
  province: string;
  hospitalScale: '三级' | '二级' | '一级';
  totalArea: number;
  techAdaptationScores?: Map<string, number>;
}

type Section1Row = DimensionEnergy & { key: string };
type Section2Row = DimensionEnergy & { key: string; quotaOriginal: number | null; isUserInput: boolean };

export function ComprehensiveRateModal({
  open,
  selectedTechs,
  onClose,
  onConfirm,
  climateZone,
  hvacYear,
  province,
  hospitalScale,
  totalArea,
  techAdaptationScores,
}: Props) {
  const result = useMemo(
    () =>
      calcComprehensiveRate({
        techs: selectedTechs,
        climateZone,
        hvacYear,
        hospitalScale,
        province,
        totalArea,
        techAdaptationScores,
      }),
    [selectedTechs, climateZone, hvacYear, hospitalScale, province, totalArea, techAdaptationScores]
  );

  const dimRates = useMemo(
    () =>
      calcDimensionRates({
        techs: selectedTechs,
        climateZone,
        hvacYear,
        hospitalScale,
        province,
        totalArea,
        techAdaptationScores,
      }),
    [selectedTechs, climateZone, hvacYear, hospitalScale, province, totalArea, techAdaptationScores]
  );

  const dimEnergies = useMemo(
    () =>
      dimRates
        ? calcOriginalEnergyByDimension(province, hospitalScale, totalArea, dimRates)
        : [],
    [dimRates, province, hospitalScale, totalArea]
  );

  const normalizedProvince = normalizeProvince(province);
  const hasQuota = hasEnergyQuota(normalizedProvince);

  // 单位换算：万kWh → 显示单位
  const convertFromWanKwh = (value: number, unit: '万kWh' | '万Nm³' | 'GJ'): number => {
    if (unit === '万kWh') return value;
    if (unit === '万Nm³') return value / getEnergyConversion('天然气');
    // GJ: 万kWh × 10000 / 65.45
    return (value * 10000) / getEnergyConversion('市政热力');
  };

  // 用户输入覆盖（null = 用 quota 默认值）
  const [userOriginals, setUserOriginals] = useState<Record<string, number | null>>({
    制冷系统: null,
    供暖系统: null,
    非供暖系统: null,
  });
  const [userUnits, setUserUnits] = useState<Record<string, '万kWh' | '万Nm³' | 'GJ'>>({
    制冷系统: '万kWh',
    供暖系统: '万kWh',
    非供暖系统: '万kWh',
  });

  // 第一部分原方案能耗显示单位
  const [section1DisplayUnit, setSection1DisplayUnit] = useState<'万kWh' | '万Nm³' | 'GJ'>('万kWh');

  // 项目上下文变化时重置用户输入
  const resetKey = `${province}-${hospitalScale}-${totalArea}-${selectedTechs
    .map((t) => t.id)
    .join(',')}`;
  useEffect(() => {
    setUserOriginals({ 制冷系统: null, 供暖系统: null, 非供暖系统: null });
    setUserUnits({ 制冷系统: '万kWh', 供暖系统: '万kWh', 非供暖系统: '万kWh' });
    setSection1DisplayUnit('万kWh');
  }, [resetKey]);

  // 最终能耗：用户输入优先于 quota
  const finalEnergies: Section2Row[] = useMemo(() => {
    return dimEnergies.map((de) => {
      const userInput = userOriginals[de.dimension];
      const unit = userUnits[de.dimension];
      const isUserInput = userInput !== null;
      if (isUserInput) {
        const conversionFactor =
          unit === '万Nm³' ? getEnergyConversion('天然气')
          : unit === 'GJ' ? getEnergyConversion('市政热力') / 10000
          : 1;
        const originalEnergyKwh = userInput * conversionFactor;
        const savingEnergy = originalEnergyKwh * (1 - de.rate);
        const isNonElectric = unit === '万Nm³' || unit === 'GJ';
        return {
          ...de,
          key: de.dimension,
          quotaOriginal: de.originalEnergy,
          originalEnergy: originalEnergyKwh,
          savingEnergy,
          originalElectricity: isNonElectric ? 0 : originalEnergyKwh,
          originalGas: unit === '万Nm³' ? userInput : 0,
          savingElectricity: isNonElectric ? 0 : savingEnergy,
          savingGas: unit === '万Nm³' ? userInput * (1 - de.rate) : 0,
          hasData: true,
          isUserInput: true,
        };
      }
      return { ...de, key: de.dimension, quotaOriginal: de.originalEnergy, isUserInput: false };
    });
  }, [dimEnergies, userOriginals, userUnits]);

  const coalCarbon = useMemo(
    () => calcCoalCarbon(finalEnergies, province),
    [finalEnergies, province]
  );

  const handleUserInput = (dimension: string, value: number) => {
    setUserOriginals((prev) => ({ ...prev, [dimension]: value }));
  };

  const handleUnitChange = (dimension: string, newUnit: '万kWh' | '万Nm³' | 'GJ') => {
    setUserUnits((prev) => ({ ...prev, [dimension]: newUnit }));
    setUserOriginals((prev) => ({ ...prev, [dimension]: null }));
  };

  if (selectedTechs.length === 0) {
    return (
      <Modal title="综合节能率估算" open={open} onCancel={onClose} footer={null}>
        <Empty description="请先选择节能技术" />
      </Modal>
    );
  }

  const section1Data: Section1Row[] = dimEnergies.map((de) => ({ ...de, key: de.dimension }));

  return (
    <Modal
      title="综合节能率估算"
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button type="primary" onClick={onConfirm}>
            确认完成
          </Button>
        </Space>
      }
      width={900}
      style={{ top: 24 }}
      destroyOnClose
    >
      <style>{`
        .ra-input .ant-input-number-input { text-align: left !important; }
        .ra-input .ant-input-number-handler-wrap { display: none !important; }
      `}</style>

      {/* 部分 4: 综合节能率结果（置顶） */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2B87C9 0%, #52c41a 100%)',
          borderRadius: 8,
          padding: '20px 24px',
          textAlign: 'center',
          color: '#fff',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>综合节能率估算结果</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>
          {result ? `${(result.finalRate * 100).toFixed(1)}%` : '无法计算'}
        </div>
      </div>

      {!hasQuota && (
        <div style={{ fontSize: 12, color: '#fa8c16', background: '#fff7e6', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>
          该省份无能耗限额数据，维度能耗将显示为空。省份: {province}
        </div>
      )}

      {/* 部分 1: 能耗定额与节能方案对比 */}
      <Title level={5} style={{ marginBottom: 12 }}>① 能耗定额与节能方案对比</Title>
      <Table
        dataSource={section1Data}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
        style={{ marginBottom: 24 }}
        columns={[
          {
            title: '维度',
            dataIndex: 'dimension',
            key: 'dimension',
            width: 120,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
          },
          {
            title: '原方案能耗',
            dataIndex: 'originalEnergy',
            key: 'originalEnergy',
            width: 280,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (v: number | null, record: Section1Row) =>
              record.hasData && v !== null ? (
                <Space.Compact style={{ width: '100%' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '0 11px',
                    height: 32, fontWeight: 600, border: '1px solid #d9d9d9',
                    borderRight: 0, borderRadius: '6px 0 0 6px', background: '#fff',
                    flex: 1,
                  }}>
                    {convertFromWanKwh(v, section1DisplayUnit).toFixed(2)}
                  </span>
                  <Select
                    value={section1DisplayUnit}
                    onChange={(v) => setSection1DisplayUnit(v)}
                    options={[
                      { label: '万kWh/年', value: '万kWh' },
                      { label: '万Nm³/年', value: '万Nm³' },
                      { label: 'GJ/年', value: 'GJ' },
                    ]}
                    style={{ width: 110 }}
                  />
                </Space.Compact>
              ) : (
                <span style={{ color: '#999' }}>无数据</span>
              ),
          },
          {
            title: '节能方案能耗（万kWh/年）',
            dataIndex: 'savingEnergy',
            key: 'savingEnergy',
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (v: number | null, record: Section1Row) =>
              record.hasData && v !== null ? (
                <span style={{ color: '#52c41a', fontWeight: 600 }}>{v.toFixed(2)}</span>
              ) : (
                <span style={{ color: '#999' }}>无数据</span>
              ),
          },
          {
            title: '节能率',
            dataIndex: 'rate',
            key: 'rate',
            width: 100,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (v: number) => (
              <span style={{ color: '#52c41a', fontWeight: 600 }}>{(v * 100).toFixed(1)}%</span>
            ),
          },
        ]}
      />

      {/* 部分 2: 原方案与节能方案对比（用户可输入历史数据） */}
      <Title level={5} style={{ marginBottom: 12 }}>② 原方案与节能方案对比（可选填历史数据）</Title>
      <Table
        dataSource={finalEnergies}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
        style={{ marginBottom: 24 }}
        columns={[
          {
            title: '维度',
            dataIndex: 'dimension',
            key: 'dimension',
            width: 120,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
          },
          {
            title: '原方案能耗',
            dataIndex: 'originalEnergy',
            key: 'originalEnergy',
            width: 280,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (_: number | null, record: Section2Row) => {
              const rawValue = userOriginals[record.dimension];
              const isUserInput = rawValue !== null;
              const placeholder =
                record.quotaOriginal !== null && record.hasData
                  ? `默认 ${record.quotaOriginal.toFixed(2)}`
                  : '无数据';
              return (
                <Space.Compact style={{ width: '100%' }}>
                  <StableInputNumber
                    value={isUserInput ? rawValue : undefined}
                    onValueChange={(v) => handleUserInput(record.dimension, v)}
                    size="middle"
                    style={{ flex: 1 }}
                    className="ra-input"
                    placeholder={placeholder}
                    min={0}
                    precision={2}
                  />
                  <Select
                    value={userUnits[record.dimension]}
                    onChange={(v) => handleUnitChange(record.dimension, v)}
                    options={[
                      { label: '万kWh', value: '万kWh' },
                      { label: '万Nm³', value: '万Nm³' },
                      { label: 'GJ', value: 'GJ' },
                    ]}
                    style={{ width: 90 }}
                  />
                </Space.Compact>
              );
            },
          },
          {
            title: '节能方案能耗（万kWh/年）',
            dataIndex: 'savingEnergy',
            key: 'savingEnergy',
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (v: number | null, record: Section2Row) =>
              record.hasData && v !== null ? (
                <span style={{ color: '#52c41a', fontWeight: 600 }}>{v.toFixed(2)}</span>
              ) : (
                <span style={{ color: '#999' }}>无数据</span>
              ),
          },
          {
            title: '节能率',
            dataIndex: 'rate',
            key: 'rate',
            width: 100,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (v: number) => (
              <span style={{ color: '#52c41a', fontWeight: 600 }}>{(v * 100).toFixed(1)}%</span>
            ),
          },
        ]}
      />

      {/* 标煤和碳排折算 */}
      <Row gutter={14} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8ecf0', padding: '14px' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 10 }}>标煤数（tce/年）</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>原方案</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
                  {coalCarbon.originalCoal.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>节能方案</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                  {coalCarbon.savingCoal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8ecf0', padding: '14px' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 10 }}>碳排量（tCO₂/年）</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>原方案</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
                  {coalCarbon.originalCarbon.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>节能方案</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                  {coalCarbon.savingCarbon.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 部分 3: 已选技术 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>③ 已选技术</div>
        <Table
          rowKey="id"
          dataSource={selectedTechs}
          pagination={false}
          size="small"
          bordered
          columns={[
            { title: '技术名称', dataIndex: 'name', key: 'name', align: 'left', onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13 } }) },
            {
              title: '分类',
              dataIndex: 'category',
              key: 'category',
              align: 'left',
              onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
              render: (c: string) => CATEGORY_LABELS[c] || c,
            },
            { title: '节能率', dataIndex: 'energySavingRate', key: 'rate', align: 'left', onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13 } }) },
          ]}
        />
      </div>

      {/* 注释 */}
      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
        注：实际节能效果受建筑条件、气候环境、运行管理等多因素影响，以上为理论估算值。
      </div>
    </Modal>
  );
}
