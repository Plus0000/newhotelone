import { useState, useEffect } from 'react';
import { Modal, Tabs, Table, Input, Button, Typography, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TechInvestment, InvestmentRow } from '@/shared/stores/projectStore';
import { CATEGORY_LABELS } from '@/steps/step2-solution/constants';
import { StableInputNumber } from '@/shared/components/StableInputNumber';
import { calcRowSubtotal, calcTotal } from '../constants';

const { Title } = Typography;

interface Props {
  open: boolean;
  investment: TechInvestment | null;
  techName: string;
  techCategory?: string;
  editable: boolean;
  onSave: (inv: TechInvestment) => void;
  onClose: () => void;
}

const TABS = [
  { key: 'equipment', label: '设备费用' },
  { key: 'materials', label: '材料费用' },
  { key: 'installation', label: '安装费用' },
  { key: 'maintenance', label: '运维费用' },
];

type TabKey = 'equipment' | 'materials' | 'installation' | 'maintenance';

export function InvestmentDetailModal({ open, investment, techName, techCategory, editable, onSave, onClose }: Props) {
  const [data, setData] = useState<TechInvestment | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('equipment');

  useEffect(() => {
    if (open && investment) {
      setData(structuredClone(investment));
      setActiveTab('equipment');
    }
  }, [open, investment]);

  if (!data) return null;

  const handleRowChange = (tab: TabKey, rowId: string, field: keyof InvestmentRow, value: unknown) => {
    setData((prev) => {
      if (!prev) return prev;
      const rows = prev[tab].map((r) => {
        if (r.id !== rowId) return r;
        const updated = { ...r, [field]: value };
        updated.subtotal = calcRowSubtotal(updated);
        return updated;
      });
      return { ...prev, [tab]: rows };
    });
  };

  const handleAddRow = (tab: TabKey) => {
    setData((prev) => {
      if (!prev) return prev;
      const newRow: InvestmentRow = {
        id: crypto.randomUUID(),
        name: '',
        specification: '',
        quantity: 1,
        unit: '台',
        unitPrice: 0,
        subtotal: 0,
      };
      return { ...prev, [tab]: [...prev[tab], newRow] };
    });
  };

  const handleDeleteRow = (tab: TabKey, rowId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      if (prev[tab].length <= 1) {
        message.warning('至少保留一行');
        return prev;
      }
      return { ...prev, [tab]: prev[tab].filter((r) => r.id !== rowId) };
    });
  };

  const handleSave = () => {
    if (!data) return;
    const totalFixed =
      calcTotal(data.equipment) +
      calcTotal(data.materials) +
      calcTotal(data.installation) +
      calcTotal(data.maintenance);
    const updated = {
      ...data,
      fixedInvestment: totalFixed,
      accountingStatus: 'completed' as const,
      basicInfoCompleted: true,
    };
    onSave(updated);
    message.success('投资明细已保存');
    onClose();
  };

  const renderTab = (tab: TabKey) => {
    const rows = data[tab];
    const total = calcTotal(rows);

    return (
      <div>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => handleAddRow(tab)}
            disabled={!editable}
          >
            添加行
          </Button>
          <span style={{ fontSize: 13, color: '#8c8c8c' }}>
            小计: <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{total.toLocaleString()} 万元</span>
          </span>
        </div>
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={false}
          size="small"
          bordered
          components={{
            header: {
              cell: (props: any) => (
                <th {...props} style={{ ...props.style, background: '#f0f2f5', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }} />
              ),
            },
            body: {
              cell: (props: any) => (
                <td {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />
              ),
            },
          }}
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
              key: 'name',
              width: 140,
              onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
              onCell: () => ({ style: { textAlign: 'left' as const } }),
              render: (_: unknown, r: InvestmentRow) => (
                <Input
                  size="small"
                  value={r.name}
                  disabled={!editable}
                  placeholder="项目名称"
                  onChange={(e) => handleRowChange(tab, r.id, 'name', e.target.value)}
                />
              ),
            },
            {
              title: '规格',
              dataIndex: 'specification',
              key: 'specification',
              width: 120,
              onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
              onCell: () => ({ style: { textAlign: 'left' as const } }),
              render: (_: unknown, r: InvestmentRow) => (
                <Input
                  size="small"
                  value={r.specification}
                  disabled={!editable}
                  placeholder="规格型号"
                  onChange={(e) => handleRowChange(tab, r.id, 'specification', e.target.value)}
                />
              ),
            },
            {
              title: '数量',
              dataIndex: 'quantity',
              key: 'quantity',
              width: 90,
              onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
              onCell: () => ({ style: { textAlign: 'right' as const } }),
              render: (_: unknown, r: InvestmentRow) => (
                <StableInputNumber
                  size="small"
                  value={r.quantity}
                  disabled={!editable}
                  min={1}
                  style={{ width: '100%' }}
                  onValueChange={(v) => handleRowChange(tab, r.id, 'quantity', v)}
                />
              ),
            },
            {
              title: '单位',
              dataIndex: 'unit',
              key: 'unit',
              width: 80,
              onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
              onCell: () => ({ style: { textAlign: 'left' as const } }),
              render: (_: unknown, r: InvestmentRow) => (
                <Input
                  size="small"
                  value={r.unit}
                  disabled={!editable}
                  onChange={(e) => handleRowChange(tab, r.id, 'unit', e.target.value)}
                />
              ),
            },
            {
              title: '单价(万元)',
              dataIndex: 'unitPrice',
              key: 'unitPrice',
              width: 110,
              onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
              onCell: () => ({ style: { textAlign: 'right' as const } }),
              render: (_: unknown, r: InvestmentRow) => (
                <StableInputNumber
                  size="small"
                  value={r.unitPrice}
                  disabled={!editable}
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  onValueChange={(v) => handleRowChange(tab, r.id, 'unitPrice', v)}
                />
              ),
            },
            {
              title: '小计(万元)',
              dataIndex: 'subtotal',
              key: 'subtotal',
              width: 110,
              onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
              onCell: () => ({ style: { textAlign: 'right' as const } }),
              render: (_: unknown, r: InvestmentRow) => (
                <span style={{ fontWeight: 500 }}>{r.subtotal.toFixed(2)}</span>
              ),
            },
            ...(editable
              ? [
                  {
                    title: '',
                    key: 'action',
                    width: 50,
                    onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
                    onCell: () => ({ style: { textAlign: 'center' as const } }),
                    render: (_: unknown, r: InvestmentRow) => (
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteRow(tab, r.id)}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>
    );
  };

  return (
    <Modal
      title={
        <div>
          <Title level={5} style={{ margin: 0 }}>{techName}</Title>
          {techCategory && (
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>{CATEGORY_LABELS[techCategory] || techCategory}</span>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={editable ? (
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </Space>
      ) : null}
      width={900}
      style={{ top: 24 }}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={TABS.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: renderTab(tab.key as TabKey),
        }))}
      />
    </Modal>
  );
}