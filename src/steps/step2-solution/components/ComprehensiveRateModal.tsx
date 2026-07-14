import { useState, useMemo, useEffect } from 'react';
import { Modal, Table, Empty, Button, Typography, Row, Col, Space } from 'antd';
import {
  ThunderboltOutlined,
  FireOutlined,
  ExperimentOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import type { TechEntry } from '@/data/materials';
import { CATEGORY_LABELS, calcComprehensiveRate } from '../constants';
import { getEnergyQuota, hasEnergyQuota } from '@/data/energyQuota';
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
  hospitalScale: '三级' | '二级';
  totalArea: number;
}

interface EnergyMetric {
  key: string;
  label: string;
  icon: React.ReactNode;
  unit: string;
  color: string;
}

const METRICS: EnergyMetric[] = [
  { key: 'electricity', label: '耗电量', icon: <ThunderboltOutlined />, unit: '万kWh/年', color: '#2B87C9' },
  { key: 'gas', label: '耗气量', icon: <FireOutlined />, unit: '万m³/年', color: '#fa8c16' },
  { key: 'coal', label: '标煤数', icon: <ExperimentOutlined />, unit: 'tce/年', color: '#595959' },
  { key: 'carbon', label: '碳排量', icon: <CloudOutlined />, unit: 'tCO₂/年', color: '#52c41a' },
];

const DEFAULT_ORIGINAL: Record<string, number> = {
  electricity: 250,
  gas: 18,
  coal: 850,
  carbon: 2100,
};

interface TableRow {
  key: string;
  metric: EnergyMetric;
  original: number;
  saving: number;
  rate: string;
  isDown: boolean;
}

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
}: Props) {
  const result = calcComprehensiveRate({
    techs: selectedTechs,
    climateZone,
    hvacYear,
    hospitalScale,
    province,
    totalArea,
  });
  const comprehensiveRate = result ? result.finalRate : 0;
  const normalizedProvince = normalizeProvince(province);
  const hasQuota = hasEnergyQuota(normalizedProvince);

  // original 从 energyQuota 算（无数据省份回退 DEFAULT_ORIGINAL）
  const defaultOriginal = useMemo(() => {
    if (!hasQuota) return { ...DEFAULT_ORIGINAL };
    const electricityPerArea = getEnergyQuota(normalizedProvince, hospitalScale, '电力', 'comprehensive', 'baseline') ?? 0;
    const gasPerArea = getEnergyQuota(normalizedProvince, hospitalScale, '天然气', 'comprehensive', 'baseline') ?? 0;
    // 单位换算:
    //   电力 kWh/(㎡·a) × 面积 / 10000 = 万kWh/年
    //   天然气 Nm³/(㎡·a) × 面积 / 10000 = 万Nm³/年
    //   煤耗和碳排先保留 DEFAULT_ORIGINAL（Phase 1.8 接通）
    return {
      electricity: electricityPerArea * totalArea / 10000,
      gas: gasPerArea * totalArea / 10000,
      coal: DEFAULT_ORIGINAL.coal,
      carbon: DEFAULT_ORIGINAL.carbon,
    };
  }, [hasQuota, normalizedProvince, hospitalScale, totalArea]);

  const [original, setOriginal] = useState<Record<string, number>>(defaultOriginal);

  // 当 defaultOriginal 变化时（如切换项目），同步 state
  useEffect(() => {
    setOriginal(defaultOriginal);
  }, [defaultOriginal]);

  const saving = useMemo(() => {
    const s: Record<string, number> = {};
    for (const key of Object.keys(original)) {
      s[key] = original[key] * (1 - comprehensiveRate);
    }
    return s;
  }, [original, comprehensiveRate]);

  const handleOriginalChange = (key: string, value: number | null) => {
    setOriginal((prev) => ({ ...prev, [key]: value ?? 0 }));
  };

  const tableData: TableRow[] = useMemo(() => {
    return METRICS.map((m) => {
      const orig = original[m.key];
      const saved = saving[m.key];
      const itemRate = orig > 0 ? ((orig - saved) / orig * 100).toFixed(1) : '0.0';
      return {
        key: m.key,
        metric: m,
        original: orig,
        saving: saved,
        rate: itemRate,
        isDown: orig > saved,
      };
    });
  }, [original, saving]);

  if (selectedTechs.length === 0) {
    return (
      <Modal title="综合节能率估算" open={open} onCancel={onClose} footer={null}>
        <Empty description="请先选择节能技术" />
      </Modal>
    );
  }

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

      {/* Result — 置顶 */}
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
          {result
            ? `${(result.finalRate * 100).toFixed(1)}%`
            : '无法计算'}
        </div>
        {result && (
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            初步 {(result.preliminaryRate * 100).toFixed(1)}% × 医院修正 {result.hospitalCorrection} = {(result.finalRate * 100).toFixed(1)}%
          </div>
        )}
      </div>

      {!hasQuota && (
        <div style={{ fontSize: 12, color: '#fa8c16', background: '#fff7e6', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>
          该省份无能耗限额数据，原始方案能耗使用默认值。省份: {province}
        </div>
      )}

      {/* Energy comparison cards */}
      <Title level={5} style={{ marginBottom: 12 }}>能耗对比</Title>
      <Row gutter={14} style={{ marginBottom: 24 }}>
        {METRICS.map((m) => {
          const orig = original[m.key];
          const saved = saving[m.key];
          const itemRate = orig > 0 ? ((orig - saved) / orig * 100).toFixed(1) : '0.0';
          const isDown = orig > saved;
          return (
            <Col span={6} key={m.key}>
              <div style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e8ecf0',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${m.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: m.color, fontSize: 14,
                  }}>
                    {m.icon}
                  </div>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>{m.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    flex: 1,
                    background: '#fafafa',
                    borderRadius: 6,
                    padding: '8px 10px',
                    border: '1px solid #f0f0f0',
                    textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 2, textAlign: 'left' }}>原始方案</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', textAlign: 'left' }}>
                      {orig.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: '#bbb', textAlign: 'left' }}>{m.unit}</div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: '#f6ffed',
                    borderRadius: 6,
                    padding: '8px 10px',
                    border: '1px solid #b7eb8f',
                  }}>
                    <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>节能方案</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#52c41a' }}>
                      {saved.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: '#95de64' }}>{m.unit}</div>
                  </div>
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDown ? '#52c41a' : '#ff4d4f',
                  marginTop: 8,
                  padding: '4px 0',
                  background: isDown ? '#f6ffed' : '#fff2f0',
                  borderRadius: 4,
                }}>
                  节能率 ↓ {itemRate}%
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Editable comparison table — antd Table */}
      <Title level={5} style={{ marginBottom: 12 }}>原始方案与节能方案对比</Title>
      <Table
        dataSource={tableData}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
        columns={[
          {
            title: '指标',
            dataIndex: 'metric',
            key: 'metric',
            width: 140,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (m: EnergyMetric) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: m.color, fontSize: 14 }}>{m.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
              </div>
            ),
          },
          {
            title: '原始方案',
            dataIndex: 'original',
            key: 'original',
            width: 220,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (_: number, record: TableRow) => (
              <StableInputNumber
                value={record.original}
                onValueChange={(v) => handleOriginalChange(record.metric.key, v)}
                size="middle"
                style={{ width: '100%' }}
                className="ra-input"
                addonAfter={<span style={{ fontSize: 11, display: 'inline-block', width: 72, textAlign: 'left' }}>{record.metric.unit}</span>}
                min={0}
                precision={2}
              />
            ),
          },
          {
            title: '',
            dataIndex: 'isDown',
            key: 'arrow',
            width: 40,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (isDown: boolean) => (
              <span style={{ fontSize: 16, color: isDown ? '#52c41a' : '#ff4d4f' }}>
                {isDown ? '→' : '←'}
              </span>
            ),
          },
          {
            title: '节能方案',
            dataIndex: 'saving',
            key: 'saving',
            width: 180,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (_: number, record: TableRow) => (
              <span style={{ fontSize: 14, fontWeight: 700, color: '#52c41a' }}>
                {record.saving.toFixed(2)}
              </span>
            ),
          },
          {
            title: '节能率',
            dataIndex: 'rate',
            key: 'rate',
            width: 120,
            align: 'left',
            onHeaderCell: () => ({ style: { background: '#f0f2f5', fontWeight: 600, fontSize: 13, textAlign: 'left' } }),
            render: (_: string, record: TableRow) => (
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: record.isDown ? '#52c41a' : '#ff4d4f',
              }}>
                ↓ {record.rate}%
              </span>
            ),
          },
        ]}
      />

      {/* Selected techs */}
      <div style={{ marginTop: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>已选技术</div>
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

      {/* Note */}
      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
        注：实际节能效果受建筑条件、气候环境、运行管理等多因素影响，以上为理论估算值。
      </div>
    </Modal>
  );
}
