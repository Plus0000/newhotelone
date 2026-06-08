import { useState, useEffect, useCallback } from 'react';
import { Tabs, Table, Input, Button, Space, Checkbox, Card, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TechInvestment, InvestmentRow } from '@/shared/stores/projectStore';
import { StableInputNumber } from '@/shared/components/StableInputNumber';

interface Props {
  investment: TechInvestment;
  techName: string;
  editable: boolean;
  hideFooter?: boolean;
  onSave: (inv: TechInvestment) => void;
  onBack: () => void;
}

type TabKey = 'equipment' | 'materials' | 'installation' | 'maintenance';

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: 'equipment', label: '主要设备表' },
  { key: 'materials', label: '主要材料表' },
  { key: 'installation', label: '安装与调试' },
  { key: 'maintenance', label: '运营与维护' },
];

function calcSubtotal(row: InvestmentRow): number {
  return row.quantity * row.unitPrice;
}

function calcTotal(rows: InvestmentRow[]): number {
  return rows.reduce((s, r) => s + r.subtotal, 0);
}

export function TechInvestmentTable({ investment, techName, editable, hideFooter, onSave, onBack }: Props) {
  const [data, setData] = useState<TechInvestment>(structuredClone(investment));
  const [activeTab, setActiveTab] = useState<TabKey>('equipment');
  const [selectedKeys, setSelectedKeys] = useState<Record<TabKey, Set<string>>>({
    equipment: new Set(),
    materials: new Set(),
    installation: new Set(),
    maintenance: new Set(),
  });

  useEffect(() => {
    setData(structuredClone(investment));
    const keys: Record<TabKey, Set<string>> = {
      equipment: new Set(),
      materials: new Set(),
      installation: new Set(),
      maintenance: new Set(),
    };
    for (const tab of ['equipment', 'materials', 'installation', 'maintenance'] as TabKey[]) {
      const rows = investment[tab];
      const hasAnySelected = rows.some((r) => r.selected);
      for (const row of rows) {
        // 首次进入（还没有任何行被选中过）→ 默认全选；否则只恢复已选中的
        if (!hasAnySelected || row.selected) keys[tab].add(row.id);
      }
    }
    setSelectedKeys(keys);
  }, [investment]);

  const updateRow = useCallback((tab: TabKey, rowId: string, field: string, value: unknown) => {
    setData((prev) => {
      const rows = prev[tab].map((r) => {
        if (r.id !== rowId) return r;
        const updated = { ...r, [field]: value };
        updated.subtotal = calcSubtotal(updated);
        return updated;
      });
      return { ...prev, [tab]: rows };
    });
  }, []);

  const addRow = useCallback((tab: TabKey) => {
    setData((prev) => {
      const unitMap: Record<TabKey, string> = { equipment: '台', materials: '吨', installation: '项', maintenance: '次/年' };
      const newRow: InvestmentRow = {
        id: crypto.randomUUID(),
        name: '',
        specification: '',
        quantity: 1,
        unit: unitMap[tab],
        unitPrice: 0,
        subtotal: 0,
        isMainEquipment: false,
        powerKw: 0,
        remark: '',
      };
      return { ...prev, [tab]: [...prev[tab], newRow] };
    });
  }, []);

  const deleteSelected = useCallback((tab: TabKey) => {
    const keys = selectedKeys[tab];
    if (keys.size === 0) {
      message.warning('请先选择要删除的行');
      return;
    }
    setData((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((r) => !keys.has(r.id)),
    }));
    setSelectedKeys((prev) => ({ ...prev, [tab]: new Set() }));
  }, [selectedKeys]);

  const toggleSelect = useCallback((tab: TabKey, rowId: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev[tab]);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      return { ...prev, [tab]: next };
    });
  }, []);

  const toggleSelectAll = useCallback((tab: TabKey, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set<string>();
      if (checked) {
        data[tab].forEach((r) => next.add(r.id));
      }
      return { ...prev, [tab]: next };
    });
  }, [data]);

  const handleSave = useCallback(() => {
    const updated = {
      ...data,
      equipment: data.equipment.map((r) => ({ ...r, selected: selectedKeys.equipment.has(r.id) })),
      materials: data.materials.map((r) => ({ ...r, selected: selectedKeys.materials.has(r.id) })),
      installation: data.installation.map((r) => ({ ...r, selected: selectedKeys.installation.has(r.id) })),
      maintenance: data.maintenance.map((r) => ({ ...r, selected: selectedKeys.maintenance.has(r.id) })),
    };
    const selectedEquipment = updated.equipment.filter((r) => r.selected);
    const selectedMaterials = updated.materials.filter((r) => r.selected);
    const selectedInstallation = updated.installation.filter((r) => r.selected);
    const selectedMaintenance = updated.maintenance.filter((r) => r.selected);
    const initialInv = calcTotal(selectedEquipment) + calcTotal(selectedMaterials) + calcTotal(selectedInstallation);
    const maintenanceCost = calcTotal(selectedMaintenance);
    const saved = {
      ...updated,
      fixedInvestment: initialInv + maintenanceCost,
      initialInvestment: initialInv,
      maintenanceCost,
      accountingStatus: 'completed' as const,
    };
    onSave(saved);
    message.success('投资明细已保存');
  }, [data, selectedKeys, onSave]);

  const handleSaveAndBack = useCallback(() => {
    handleSave();
    onBack();
  }, [handleSave, onBack]);

  const renderTable = (tab: TabKey) => {
    const rows = data[tab];
    const selKeys = selectedKeys[tab];
    const allSelected = rows.length > 0 && rows.every((r) => selKeys.has(r.id));
    const selectedTotal = rows
      .filter((r) => selKeys.has(r.id))
      .reduce((s, r) => s + r.subtotal, 0);

    const nameTitle: Record<TabKey, string> = {
      equipment: '设备名称',
      materials: '材料名称',
      installation: '项目名称',
      maintenance: '维护项目',
    };

    const subtotalTitle: Record<TabKey, string> = {
      equipment: '总价(万元)',
      materials: '总价(万元)',
      installation: '总价(万元)',
      maintenance: '年度总价(万元)',
    };

    const columns = [
      {
        title: (
          <Checkbox
            checked={allSelected}
            indeterminate={selKeys.size > 0 && !allSelected}
            disabled={!editable}
            onChange={(e) => toggleSelectAll(tab, e.target.checked)}
          />
        ),
        key: 'select',
        width: 48,
        render: (_: unknown, r: InvestmentRow) => (
          <Checkbox checked={selKeys.has(r.id)} disabled={!editable} onChange={() => toggleSelect(tab, r.id)} />
        ),
      },
      {
        title: nameTitle[tab],
        dataIndex: 'name',
        key: 'name',
        width: 160,
        onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
        onCell: () => ({ style: { textAlign: 'left' as const } }),
        render: (_: unknown, r: InvestmentRow) => (
          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.name || '-'}</span>
        ),
      },
      {
        title: '规格型号',
        dataIndex: 'specification',
        key: 'specification',
        width: 140,
        onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
        onCell: () => ({ style: { textAlign: 'left' as const } }),
        render: (_: unknown, r: InvestmentRow) =>
          editable ? (
            <Input
              size="small"
              value={r.specification}
              placeholder="规格型号"
              onChange={(e) => updateRow(tab, r.id, 'specification', e.target.value)}
            />
          ) : (
            <span style={{ fontSize: 13 }}>{r.specification || '-'}</span>
          ),
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 90,
        onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
        onCell: () => ({ style: { textAlign: 'left' as const } }),
        render: (_: unknown, r: InvestmentRow) => (
          <span style={{ fontSize: 13 }}>{r.unit || '-'}</span>
        ),
      },
      {
        title: tab === 'installation' ? '工程量' : '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
        onCell: () => ({ style: { textAlign: 'right' as const } }),
        render: (_: unknown, r: InvestmentRow) =>
          editable ? (
            <StableInputNumber
              size="small"
              value={r.quantity}
              min={0}
              style={{ width: '100%' }}
              onValueChange={(v) => updateRow(tab, r.id, 'quantity', v)}
            />
          ) : (
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{r.quantity}</span>
          ),
      },
      {
        title: '单价(万元)',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        width: 120,
        onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
        onCell: () => ({ style: { textAlign: 'right' as const } }),
        render: (_: unknown, r: InvestmentRow) =>
          editable ? (
            <StableInputNumber
              size="small"
              value={r.unitPrice}
              min={0}
              style={{ width: '100%' }}
              onValueChange={(v) => updateRow(tab, r.id, 'unitPrice', v)}
            />
          ) : (
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{r.unitPrice.toFixed(4)}</span>
          ),
      },
      {
        title: subtotalTitle[tab],
        dataIndex: 'subtotal',
        key: 'subtotal',
        width: 120,
        onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
        onCell: () => ({ style: { textAlign: 'right' as const } }),
        render: (_: unknown, r: InvestmentRow) => (
          <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#1677ff' }}>
            {r.subtotal.toFixed(2)}
          </span>
        ),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
        onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
        onCell: () => ({ style: { textAlign: 'left' as const } }),
        render: (_: unknown, r: InvestmentRow) => (
          <span style={{ fontSize: 13, color: '#8c8c8c' }}>{r.remark || ''}</span>
        ),
      },
      ...(tab === 'maintenance'
        ? [
            {
              title: '费用类型',
              key: 'costType',
              width: 120,
              onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
              onCell: () => ({ style: { textAlign: 'center' as const } }),
              render: (_: unknown, r: InvestmentRow) =>
                editable ? (
                  <Select
                    size="small"
                    value={r.costType || 'repair'}
                    style={{ width: '100%' }}
                    onChange={(v) => updateRow(tab, r.id, 'costType', v)}
                    options={[
                      { label: '维修维保', value: 'repair' },
                      { label: '人工费', value: 'labor' },
                    ]}
                  />
                ) : (
                  <span style={{ fontSize: 13 }}>
                    {r.costType === 'labor' ? '人工费' : '维修维保'}
                  </span>
                ),
            },
          ]
        : []),
      ...(tab === 'equipment'
        ? [
            {
              title: '是否为主要设备',
              dataIndex: 'isMainEquipment',
              key: 'isMainEquipment',
              width: 130,
              onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
              onCell: () => ({ style: { textAlign: 'center' as const } }),
              render: (_: unknown, r: InvestmentRow) =>
                editable ? (
                  <Select
                    size="small"
                    value={r.isMainEquipment ? 'yes' : 'no'}
                    style={{ width: '100%' }}
                    onChange={(v) => updateRow(tab, r.id, 'isMainEquipment', v === 'yes')}
                    options={[
                      { label: '是', value: 'yes' },
                      { label: '否', value: 'no' },
                    ]}
                  />
                ) : (
                  <span style={{ fontSize: 13 }}>
                    {r.isMainEquipment ? '是' : '否'}
                  </span>
                ),
            },
            {
              title: '功率(kW)',
              dataIndex: 'powerKw',
              key: 'powerKw',
              width: 100,
              onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
              onCell: () => ({ style: { textAlign: 'right' as const } }),
              render: (_: unknown, r: InvestmentRow) => (
                <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                  {r.powerKw != null ? r.powerKw : ''}
                </span>
              ),
            },
          ]
        : []),
    ];

    return (
      <div>
        {/* 工具栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          marginBottom: 12,
          background: '#fafbfc',
          borderRadius: 6,
          border: '1px solid #f0f0f0',
        }}>
          <Space>
            {editable && (
              <>
                <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={() => addRow(tab)}>
                  添加行
                </Button>
                <Button type="text" icon={<DeleteOutlined />} size="small" danger disabled={selKeys.size === 0} onClick={() => deleteSelected(tab)}>
                  删除选中
                </Button>
              </>
            )}
          </Space>
          <div style={{
            padding: '4px 14px',
            background: '#fff',
            borderRadius: 4,
            border: '1px solid #e8e8e8',
          }}>
            <span style={{ fontSize: 13, color: '#595959' }}>小计:</span>
            <span style={{ fontWeight: 700, color: '#1677ff', fontVariantNumeric: 'tabular-nums', marginLeft: 6, fontSize: 14 }}>
              {selectedTotal.toFixed(2)}
            </span>
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 2 }}>万元</span>
          </div>
        </div>

        <Table
          rowKey="id"
          dataSource={rows}
          columns={columns}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 1100 }}
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
          locale={{ emptyText: '暂无数据' }}
        />
      </div>
    );
  };

  return (
    <div>
      {/* 标题 */}
      <div style={{
        marginBottom: 16,
        fontSize: 15,
        fontWeight: 600,
        color: '#1a1a1a',
        padding: '10px 16px',
        background: '#f0f5ff',
        borderRadius: 6,
        borderLeft: '3px solid #1677ff',
      }}>
        {techName} — 单项技术固定投资计算表
      </div>

      {/* Tab 区域用卡片包裹 */}
      <Card
        size="small"
        style={{ border: '1px solid #e8ecf0', borderRadius: 8 }}
        bodyStyle={{ padding: '4px 16px 16px' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
          type="card"
          items={TAB_CONFIG.map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: renderTable(tab.key),
          }))}
        />
      </Card>

      {/* 底部按钮 */}
      {!hideFooter && editable && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e8ecf0' }}>
          <Button onClick={onBack}>上一步</Button>
          <Space>
            <Button onClick={handleSave}>保存</Button>
            <Button type="primary" onClick={handleSaveAndBack}>保存并返回总表</Button>
          </Space>
        </div>
      )}

      {!hideFooter && !editable && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e8ecf0' }}>
          <Button onClick={onBack}>上一步</Button>
        </div>
      )}
    </div>
  );
}
