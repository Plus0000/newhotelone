import { useMemo, useState, useCallback, useEffect } from 'react';
import { Modal, Tree, Table, Typography, Empty, Input } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';
import { EQUIPMENT_LIBRARY, SYSTEM_TO_DATA_KEY, JIFANG_SUBSYSTEMS } from '@/data/equipmentLibrary';
import type { EquipmentLibraryRow } from '@/data/equipmentLibrary';

const { Text } = Typography;

interface EquipmentPickerModalProps {
  open: boolean;
  selectedSystems: string[];
  onCancel: () => void;
  onSelect: (row: {
    systemLargeClass: string;
    deviceType: string;
    deviceName: string;
    equipmentName: string;
    ratedPower: number;
    unit: string;
  }) => void;
}

interface TreeFilter {
  sub?: string;
  m?: string;
  sm?: string;
  e?: string;
}

function encodeFilter(f: TreeFilter): string {
  return JSON.stringify(f);
}

function decodeFilter(key: string): TreeFilter {
  try { return JSON.parse(key); } catch { return {}; }
}

const isJifang = (systems: string[]) => systems.includes('重点机房系统');

function getRowKey(r: EquipmentLibraryRow): string {
  return [r.s, r.m, r.sm, r.e, r.b, r.ba, r.sp, r.p, r.u, r.pr, r.sub].join('\x00');
}

export function EquipmentPickerModal({ open, selectedSystems, onCancel, onSelect }: EquipmentPickerModalProps) {
  const [selectedRow, setSelectedRow] = useState<EquipmentLibraryRow | null>(null);
  const [filteredRows, setFilteredRows] = useState<EquipmentLibraryRow[]>([]);
  const [treeFilter, setTreeFilter] = useState<TreeFilter>({});
  const [searchKeyword, setSearchKeyword] = useState('');

  // Filter library by selected systems
  const libraryRows = useMemo(() => {
    if (selectedSystems.length === 0) return [];
    const dataKeys = selectedSystems
      .map((s) => SYSTEM_TO_DATA_KEY[s])
      .filter(Boolean);
    return EQUIPMENT_LIBRARY.filter((row) => dataKeys.includes(row.s));
  }, [selectedSystems]);

  // 弹窗打开时默认显示全部数据
  useEffect(() => {
    if (open) {
      setFilteredRows(libraryRows);
      setSelectedRow(null);
      setTreeFilter({});
      setSearchKeyword('');
    }
  }, [open, libraryRows]);

  const applyFilter = useCallback((f: TreeFilter) => {
    setTreeFilter(f);
  }, []);

  // 统一过滤：tree 分类 + 搜索关键字（设备名称 e / 品牌 b）
  useEffect(() => {
    let rows = libraryRows;
    const f = treeFilter;
    if (f.sub) rows = rows.filter((r) => r.sub === f.sub);
    if (f.m) rows = rows.filter((r) => r.m === f.m);
    if (f.sm) rows = rows.filter((r) => r.sm === f.sm);
    if (f.e) rows = rows.filter((r) => r.e === f.e);

    const kw = searchKeyword.trim().toLowerCase();
    if (kw) {
      rows = rows.filter((r) =>
        (r.e ?? '').toLowerCase().includes(kw) ||
        (r.b ?? '').toLowerCase().includes(kw),
      );
    }

    setFilteredRows(rows);
    setSelectedRow(null);
  }, [libraryRows, treeFilter, searchKeyword]);

  // Build tree data
  const treeData = useMemo<DataNode[]>(() => {
    if (libraryRows.length === 0) return [];

    const jifang = isJifang(selectedSystems);

    if (jifang) {
      return JIFANG_SUBSYSTEMS.map((sub) => {
        const subRows = libraryRows.filter((r) => r.sub === sub);
        const midClasses = [...new Set(subRows.map((r) => r.m).filter(Boolean))];
        return {
          title: sub,
          key: encodeFilter({ sub }),
          children: midClasses.map((m) => {
            const mRows = subRows.filter((r) => r.m === m);
            const smallClasses = [...new Set(mRows.map((r) => r.sm).filter(Boolean))];
            return {
              title: m,
              key: encodeFilter({ sub, m }),
              children: smallClasses.map((sm) => {
                const smRows = mRows.filter((r) => r.sm === sm);
                const names = [...new Set(smRows.map((r) => r.e).filter(Boolean))];
                return {
                  title: sm,
                  key: encodeFilter({ sub, m, sm }),
                  children: names.map((n) => ({
                    title: n || '(无名称)',
                    key: encodeFilter({ sub, m, sm, e: n }),
                    isLeaf: true,
                  })),
                };
              }),
            };
          }),
        };
      });
    }

    const midClasses = [...new Set(libraryRows.map((r) => r.m).filter(Boolean))];
    return midClasses.map((m) => {
      const mRows = libraryRows.filter((r) => r.m === m);
      const smallClasses = [...new Set(mRows.map((r) => r.sm).filter(Boolean))];
      return {
        title: m,
        key: encodeFilter({ m }),
        children: smallClasses.map((sm) => {
          const smRows = mRows.filter((r) => r.sm === sm);
          const names = [...new Set(smRows.map((r) => r.e).filter(Boolean))];
          return {
            title: sm,
            key: encodeFilter({ m, sm }),
            children: names.map((n) => ({
              title: n || '(无名称)',
              key: encodeFilter({ m, sm, e: n }),
              isLeaf: true,
            })),
          };
        }),
      };
    });
  }, [libraryRows, selectedSystems]);

  const handleTreeSelect = (keys: React.Key[]) => {
    if (keys.length === 0) return;
    applyFilter(decodeFilter(keys[0] as string));
  };

  const handleConfirm = () => {
    if (!selectedRow) return;
    onSelect({
      systemLargeClass: selectedRow.s,
      deviceType: selectedRow.m,
      deviceName: selectedRow.sm,
      equipmentName: selectedRow.e,
      ratedPower: selectedRow.p ?? 0,
      unit: selectedRow.pu ?? 'kW',
    });
    setSelectedRow(null);
    setFilteredRows([]);
  };

  const handleCancel = () => {
    setSelectedRow(null);
    setFilteredRows([]);
    onCancel();
  };

  const tableColumns: ColumnsType<EquipmentLibraryRow> = [
    { title: '设备名称', dataIndex: 'e', width: 180, ellipsis: true },
    { title: '品牌', dataIndex: 'b' },
    { title: '品牌属性', dataIndex: 'ba' },
    {
      title: '规格型号',
      dataIndex: 'sp',
      width: 220,
      onCell: () => ({ className: 'cell-wrap' }),
    },
    {
      title: '功率(kW)',
      dataIndex: 'p',
      width: 90,
      align: 'right',
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (v: number | null) => v != null ? v.toFixed(1) : '-',
    },
    { title: '单位', dataIndex: 'u', width: 50 },
    {
      title: '报价(元)',
      dataIndex: 'pr',
      width: 90,
      align: 'right',
      render: (v: number | null) => v != null ? v.toLocaleString() : '-',
    },
  ];

  const hasData = selectedSystems.length > 0 && !selectedSystems.every((s) =>
    s === '科室用电（办公设备）' || s === '医疗设备系统'
  );

  return (
    <Modal
      title="选择设备"
      open={open}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okButtonProps={{ disabled: !selectedRow }}
      width={1120}
      destroyOnClose
    >
      <style>{`
        .equip-picker-table .ant-table-thead th { white-space: nowrap !important; }
        .equip-picker-table .ant-table-tbody td { vertical-align: middle !important; }
        .equip-picker-table .cell-wrap { white-space: normal !important; word-break: break-word !important; line-height: 18px !important; }
        .equip-picker-tree .ant-tree-node-content-wrapper { white-space: nowrap !important; }
        .equip-picker-tree .ant-tree-title { font-size: 13px !important; }
        .equip-picker-tree { font-size: 13px !important; }
      `}</style>
      {!hasData ? (
        <Empty description="科室用电和医疗设备系统暂无设备库数据" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            allowClear
            placeholder="搜索设备名称 / 品牌"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', gap: 16, height: 480 }}>
            <div style={{
              width: 230, flexShrink: 0, overflow: 'auto',
              border: '1px solid #f0f0f0', borderRadius: 6, padding: 8,
            }}>
              <Text type="secondary" style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
                {isJifang(selectedSystems) ? '子系统 -> 中类 -> 小类 -> 设备名称' : '中类 -> 小类 -> 设备名称'}
              </Text>
              {treeData.length > 0 ? (
                <Tree
                  key={selectedSystems.join(',')}
                  className="equip-picker-tree"
                  treeData={treeData}
                  onSelect={handleTreeSelect}
                  defaultExpandedKeys={treeData.map((n) => n.key as string)}
                  showLine={{ showLeafIcon: false }}
                />
              ) : (
                <Empty description="无匹配数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Table
                className="equip-picker-table"
                rowKey={getRowKey}
                dataSource={filteredRows}
                columns={tableColumns}
                size="small"
                pagination={{ pageSize: 20, size: 'small', showSizeChanger: false }}
                scroll={{ x: 830, y: 360 }}
                rowSelection={{
                  type: 'radio',
                  selectedRowKeys: selectedRow ? [getRowKey(selectedRow)] : [],
                  onChange: (keys: React.Key[]) => {
                    if (keys.length === 0) { setSelectedRow(null); return; }
                    const row = filteredRows.find((r) => getRowKey(r) === keys[0]);
                    if (row) setSelectedRow(row);
                  },
                }}
                locale={{ emptyText: <Empty description="请在左侧选择分类或输入搜索关键字" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
