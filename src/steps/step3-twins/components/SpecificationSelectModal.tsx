import { useMemo, useState } from 'react';
import { Modal, Table, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { EquipmentItem } from '@/data/equipmentClassification';
import { useMergedEquipmentItems } from '@/features/knowledge-base/store';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: { specification: string; unit: string; unitPrice: number; powerKw: number; powerUnit: string }) => void;
}

export function SpecificationSelectModal({ open, onClose, onSelect }: Props) {
  const equipmentItems = useMergedEquipmentItems();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string | undefined>(undefined);
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string | undefined>(undefined);

  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const subCategories = new Set<string>();
    const equipmentTypes = new Set<string>();
    for (const item of equipmentItems) {
      categories.add(item.category);
      subCategories.add(item.subCategory);
      equipmentTypes.add(item.equipmentType);
    }
    return {
      categories: [...categories],
      subCategories: [...subCategories],
      equipmentTypes: [...equipmentTypes],
    };
  }, [equipmentItems]);

  const filteredData = useMemo(() => {
    return equipmentItems.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (subCategoryFilter && item.subCategory !== subCategoryFilter) return false;
      if (equipmentTypeFilter && item.equipmentType !== equipmentTypeFilter) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          item.brand.toLowerCase().includes(q) ||
          item.specification.toLowerCase().includes(q) ||
          item.equipmentType.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.subCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [equipmentItems, categoryFilter, subCategoryFilter, equipmentTypeFilter, searchText]);

  const columns: ColumnsType<EquipmentItem> = [
    { title: '大类(系统)', dataIndex: 'category', key: 'category', width: 100 },
    { title: '中类(设备类型)', dataIndex: 'subCategory', key: 'subCategory', width: 130 },
    { title: '小类(主要用能设备)', dataIndex: 'equipmentType', key: 'equipmentType', width: 150 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 120 },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      width: 350,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    {
      title: '报价(元)',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
  ];

  /** 从规格型号中提取型号部分（"型号: XXX" → "XXX"） */
  function extractModel(spec: string): string {
    const m = spec.match(/型号:\s*([^;]+)/);
    return m ? m[1].trim() : spec;
  }

  /** 从规格型号中提取功率数值和单位（"功率: XXXkW" → { value: XXX, unit: "kW" }） */
  function extractPowerKw(spec: string): { value: number; unit: string } {
    const m = spec.match(/功率:\s*([\d.]+)\s*(\w+)/);
    return m ? { value: parseFloat(m[1]) || 0, unit: m[2] } : { value: 0, unit: '' };
  }

  const handleRowClick = (record: EquipmentItem) => {
    const power = extractPowerKw(record.specification);
    onSelect({
      specification: extractModel(record.specification),
      unit: record.unit,
      unitPrice: record.price / 10000, // 元 → 万元
      powerKw: power.value,
      powerUnit: power.unit,
    });
    handleClose();
  };

  const handleClose = () => {
    setSearchText('');
    setCategoryFilter(undefined);
    setSubCategoryFilter(undefined);
    setEquipmentTypeFilter(undefined);
    onClose();
  };

  return (
    <Modal
      title="设备型号选择"
      open={open}
      onCancel={handleClose}
      width={1100}
      footer={null}
      destroyOnClose
    >
      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>大类</span>
          <Select
            allowClear
            placeholder="全部"
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setSubCategoryFilter(undefined); setEquipmentTypeFilter(undefined); }}
            style={{ width: 130 }}
            options={filterOptions.categories.map((c) => ({ label: c, value: c }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>中类</span>
          <Select
            allowClear
            placeholder="全部"
            value={subCategoryFilter}
            onChange={(v) => { setSubCategoryFilter(v); setEquipmentTypeFilter(undefined); }}
            style={{ width: 140 }}
            options={filterOptions.subCategories.map((c) => ({ label: c, value: c }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap' }}>小类</span>
          <Select
            allowClear
            placeholder="全部"
            value={equipmentTypeFilter}
            onChange={setEquipmentTypeFilter}
            style={{ width: 160 }}
            options={filterOptions.equipmentTypes.map((c) => ({ label: c, value: c }))}
          />
        </div>
        <Input
          placeholder="搜索品牌/型号"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 200 }}
        />
      </div>

      {/* 表格 */}
      <Table
        rowKey={(r) => `${r.category}-${r.subCategory}-${r.equipmentType}-${r.brand}-${r.specification}`}
        dataSource={filteredData}
        columns={columns}
        pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
        size="small"
        bordered
        scroll={{ y: 450 }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
        components={{
          header: {
            cell: (props: any) => (
              <th {...props} style={{ ...props.style, background: '#f0f2f5', fontWeight: 600, fontSize: 13 }} />
            ),
          },
        }}
      />
    </Modal>
  );
}